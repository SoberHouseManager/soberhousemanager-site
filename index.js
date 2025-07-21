
require('dotenv').config();

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

console.log("✅ Deploy trigger – index.js updated");

admin.initializeApp();
const db = admin.firestore();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));

// Webhook Endpoint
app.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
  } catch (err) {
    console.error('⚠️ Webhook signature verification failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const logRef = db.collection('webhookLogs').doc(event.id);
  await logRef.set({
    type: event.type,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    payload: event.data.object
  });

  const data = event.data.object;

  switch (event.type) {
    case 'checkout.session.completed':
      console.log('✅ Checkout complete. Session:', data.id);
      break;

    case 'payment_intent.succeeded':
      try {
        const stripeCustomerId = data.customer;
        const amount = data.amount_received / 100;
        const paidDate = new Date();
        const type = data.metadata?.type || 'rent';

        // Find resident by stripeCustomerId in global collection
        const residentSnapshot = await db.collection('residents')
          .where('stripeCustomerId', '==', stripeCustomerId)
          .limit(1)
          .get();

        if (!residentSnapshot.empty) {
          const residentDoc = residentSnapshot.docs[0];
          const residentId = residentDoc.id;
          const residentData = residentDoc.data();
          const houseId = residentData.houseId;

          // Write payment to resident's subcollection in house doc
          await db.collection('houses').doc(houseId)
            .collection('residents').doc(residentId)
            .collection('paymentHistory').add({
              amount,
              status: 'paid',
              type,
              paidDate
            });

          // Update pastDue and nextDueDate
          const nextDue = new Date();
          nextDue.setMonth(nextDue.getMonth() + 1); // You can adjust this logic

          await db.collection('houses').doc(houseId)
            .collection('residents').doc(residentId)
            .update({
              pastDue: false,
              nextDueDate: nextDue.toISOString()
            });

          // Mirror to global collection
          await db.collection('residents').doc(residentId).update({
            pastDue: false,
            nextDueDate: nextDue.toISOString()
          });

          console.log(`✅ Payment recorded for resident ${residentId}`);
        } else {
          console.warn(`⚠️ No resident found for Stripe customer ID: ${stripeCustomerId}`);
        }
      } catch (error) {
        console.error("❌ Failed to handle payment_intent.succeeded:", error.message);
      }
      break;

    case 'invoice.payment_failed':
      try {
        const residentId = data.customer_email || 'unknown';
        console.log(`❌ Payment failed for ${residentId}`);

        await db.collection('failedPayments').add({
          residentId,
          dueDate: new Date(data.next_payment_attempt * 1000),
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          status: 'grace-period'
        });
      } catch (error) {
        console.error("❌ Failed to handle payment_failed:", error.message);
      }
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.status(200).json({ received: true });
});

// Payment Intent Endpoint (existing)
app.post('/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency = 'usd', metadata } = req.body;

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      automatic_payment_methods: { enabled: true },
      metadata
    });

    res.status(200).send({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('Stripe Payment Error:', error);
    res.status(500).send({ error: error.message });
  }
});

exports.api = functions.https.onRequest(app);
