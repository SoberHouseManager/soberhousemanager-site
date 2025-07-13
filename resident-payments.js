
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, getDoc, collection, getDocs, addDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { app } from './firebase-auth.js';

const auth = getAuth(app);
const db = getFirestore(app);

const paymentSection = document.getElementById("payment-section");
const paymentHistory = document.getElementById("payment-history");
const currentBalance = document.getElementById("current-balance");
const payNowButton = document.getElementById("pay-now");

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "resident-login.html";
    return;
  }

  const uid = user.uid;
  const userDocRef = doc(db, "residents", uid);
  const userDocSnap = await getDoc(userDocRef);

  if (!userDocSnap.exists()) {
    alert("Resident profile not found.");
    return;
  }

  const userData = userDocSnap.data();
  const dueAmount = userData.currentDue || 0;
  currentBalance.textContent = `$${(dueAmount / 100).toFixed(2)}`;

  // Load payment history
  const historyRef = collection(db, "residents", uid, "payments");
  const historySnap = await getDocs(historyRef);
  paymentHistory.innerHTML = "";

  historySnap.forEach(doc => {
    const data = doc.data();
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${new Date(data.timestamp?.toDate()).toLocaleDateString()}</td>
      <td>$${(data.amount / 100).toFixed(2)}</td>
      <td>${data.method}</td>
      <td>${data.status}</td>
    `;
    paymentHistory.appendChild(row);
  });

  payNowButton.addEventListener("click", async () => {
    const response = await fetch("https://us-central1-soberhousemanager.cloudfunctions.net/api/create-payment-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: dueAmount })
    });

    const { clientSecret } = await response.json();

    const stripe = Stripe("pk_test_51RkDjSG78wJabJVZgG5LQnWDb1d7ziPeymKeaWRsWz9p4QM2zXdMgkNQYjLBWmNnTdxONFlIDpSen7v3N5DzUWVV00BZRM4R4U");

    const elements = stripe.elements();
    const paymentElement = elements.create("payment");
    paymentElement.mount("#payment-element");

    document.getElementById("payment-form").style.display = "block";

    document.getElementById("submit-payment").onclick = async () => {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: window.location.href },
        redirect: "if_required"
      });

      if (error) {
        alert(error.message);
      } else {
        await addDoc(historyRef, {
          timestamp: new Date(),
          amount: dueAmount,
          method: "Stripe",
          status: paymentIntent.status
        });
        location.reload();
      }
    };
  });
});
