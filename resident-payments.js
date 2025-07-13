import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, getDoc, collection, getDocs, addDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyAFUOYQoC4et7H4oTmyjo3sBs_rI5eNgOg",
  authDomain: "soberhousemanager-3371d.firebaseapp.com",
  projectId: "soberhousemanager-3371d",
  storageBucket: "soberhousemanager-3371d.firebasestorage.app",
  messagingSenderId: "931134241567",
  appId: "1:931134241567:web:f4083f35033e9e7c170e2a",
  measurementId: "G-L5SPVD901V"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// UI Elements
const paymentSection = document.getElementById("payment-section");
const paymentHistory = document.getElementById("payment-history");
const currentBalance = document.getElementById("current-balance");
const payNowButton = document.getElementById("pay-now");

// Main Logic
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

  // Payment Intent
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
