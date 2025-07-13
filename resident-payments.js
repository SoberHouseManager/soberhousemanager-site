import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "pk_test_51RkDjSG78wJabJVZgG5LQnWDb1d7ziPeymKeaWRsWz9p4QM2zXdMgkNQYjLBWmNnTdxONFlIDpSen7v3N5DzUWVV00BZRM4R4U",
  authDomain: "soberhousemanager-3371d.firebaseapp.com",
  projectId: "soberhousemanager-3371d",
  storageBucket: "soberhousemanager-3371d.appspot.com",
  messagingSenderId: "931134241567",
  appId: "1:931134241567:web:f4083f35033e9e7c170e2a",
  measurementId: "G-L5SPVD901V"
};

// ✅ Fix: Prevent Firebase from being initialized multiple times
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const stripe = Stripe("pk_test_51RkDjSG78wJabJVZgG5LQnWDb1d7ziPeymKeaWRsWz9p4QM2zXdMgkNQYjLBWmNnTdxONFlIDpSen7v3N5DzUWVV00BZRM4R4U");

const rentAmountEl = document.getElementById("rentAmount");
const frequencyEl = document.getElementById("frequency");
const nextDueEl = document.getElementById("nextDue");
const balanceEl = document.getElementById("balance");
const messageEl = document.getElementById("payment-message");

async function fetchResidentData(user) {
  const docRef = doc(db, "users", user.uid);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const data = docSnap.data();
    rentAmountEl.textContent = `$${data.rent || 0}`;
    frequencyEl.textContent = data.frequency || "N/A";
    nextDueEl.textContent = data.nextDue || "N/A";
    balanceEl.textContent = `$${data.balance || 0}`;
  } else {
    messageEl.textContent = "❌ No resident data found.";
  }
}

async function handlePayment() {
  const user = auth.currentUser;
  if (!user) return alert("You must be logged in.");

  const docRef = doc(db, "users", user.uid);
  const docSnap = await getDoc(docRef);
  const data = docSnap.data();

  const response = await fetch("https://us-central1-soberhousemanager-3371d.cloudfunctions.net/createCheckoutSession", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: user.email,
      amount: data.rent,
      userId: user.uid
    })
  });

  const session = await response.json();
  if (session.id) {
    messageEl.textContent = "Redirecting to Stripe...";
    stripe.redirectToCheckout({ sessionId: session.id });
  } else {
    messageEl.textContent = "❌ Failed to create Stripe session.";
  }
}

document.getElementById("payNowBtn")?.addEventListener("click", handlePayment);
document.getElementById("enableAutoBtn")?.addEventListener("click", () => {
  messageEl.textContent = "🔁 Auto-debit setup coming soon...";
});

onAuthStateChanged(auth, (user) => {
  if (user) fetchResidentData(user);
});
