const functions = require("firebase-functions");
const admin = require("firebase-admin");
const stripe = require("stripe")("sk_test_51RkDjc4QI5lvEoKbt3vyex1JePBVeCUgpRwIefdWQKDpgDRwieKGfrYkGBA1QKHT2YW38nh4TgeEZw6cec3UazWK00xU2yc5eE");

admin.initializeApp();
const db = admin.firestore();

exports.createSubscription = functions.https.onCall(async (data, context) => {
  const { email, amount, frequency } = data;

  if (!email || !amount || !frequency) {
    throw new functions.https.HttpsError("invalid-argument", "Missing required fields.");
  }

  // Convert amount to cents
  const unitAmount = Math.round(amount * 100);

  // Check if resident already exists
  const residentId = email.replace(/[^a-zA-Z0-9]/g, "_");
  const residentRef = db.collection("residents").doc(residentId);
  const residentSnap = await residentRef.get();

  if (!residentSnap.exists) {
    throw new functions.https.HttpsError("not-found", "Resident not found.");
  }

  let customerId = residentSnap.data().stripeCustomerId;

  // Create Stripe customer if needed
  if (!customerId) {
    const customer = await stripe.customers.create({ email });
    customerId = customer.id;
    await residentRef.update({ stripeCustomerId: customerId });
  }

  // Create product + price
  const product = await stripe.products.create({ name: "Sober Living Rent" });

  const price = await stripe.prices.create({
    unit_amount: unitAmount,
    currency: "usd",
    recurring: {
      interval: frequency === "weekly" ? "week" : "month"
    },
    product: product.id,
  });

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: price.id, quantity: 1 }],
    success_url: "https://soberhousemanager.com/payment-success",
    cancel_url: "https://soberhousemanager.com/payment-cancelled",
  });

  return { url: session.url };
});
