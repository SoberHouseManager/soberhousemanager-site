// resident-payments.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  addDoc,
  Timestamp
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAFUOYQoC4et7H4oTmyjo3sBs_rI5eNgOg",
  authDomain: "soberhousemanager-3371d.firebaseapp.com",
  projectId: "soberhousemanager-3371d",
  storageBucket: "soberhousemanager-3371d.appspot.com",
  messagingSenderId: "823636408266",
  appId: "1:823636408266:web:6f953b2ffacc187f2fdd36"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const rentAmountEl = document.getElementById("rentAmount");
const frequencyEl = document.getElementById("frequency");
const nextDueEl = document.getElementById("nextDue");
const balanceEl = document.getElementById("balance");
const messageEl = document.getElementById("payment-message");

onAuthStateChanged(auth, async (user) => {
  if (!user) return (window.location.href = "resident-login.html");

  const userDoc = await getDoc(doc(db, "users", user.uid));
  if (!userDoc.exists()) return;
  const userData = userDoc.data();

  rentAmountEl.textContent = `$${userData.rent || 0}`;
  frequencyEl.textContent = userData.frequency || "Monthly";
  nextDueEl.textContent = userData.nextDue || "TBD";
  balanceEl.textContent = `$${userData.balance || 0}`;
});

async function handlePayment() {
  messageEl.textContent = "Redirecting to Stripe...";

  const user = auth.currentUser;
  if (!user) return;

  const userDoc = await getDoc(doc(db, "users", user.uid));
  const userData = userDoc.data();
  const rentAmount = userData.rent || 0;

  const response = await fetch("https://us-central1-soberhousemanager-3371d.cloudfunctions.net/createCheckoutSession", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      uid: user.uid,
      amount: rentAmount * 100,
      method: "card"
    }),
  });

  const session = await response.json();
  if (session.id) {
    const stripe = Stripe("pk_test_XXXXXXXXXXXXXXXXXXXXXXXX"); // Replace with your actual publishable key
    stripe.redirectToCheckout({ sessionId: session.id });
  } else {
    messageEl.textContent = "⚠️ Error creating checkout session.";
    console.error("Stripe error:", session);
  }
}

document.getElementById("payNowBtn")?.addEventListener("click", handlePayment);
document.getElementById("enableAutoBtn")?.addEventListener("click", () => {
  messageEl.textContent = "🔁 Auto-debit setup coming soon...";
});
