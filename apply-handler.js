import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp
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
const db = getFirestore(app);

document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const houseId = urlParams.get("houseId") || "unknown-house";

  const form = document.getElementById("application-form");
  const confirmation = document.getElementById("confirmation-message");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const fullName = document.getElementById("fullName").value.trim();
    const email = document.getElementById("email").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const whyJoin = document.getElementById("whyJoin").value.trim();
    const password = document.getElementById("password").value.trim();

    const [firstName, ...lastParts] = fullName.split(" ");
    const lastName = lastParts.join(" ");

    try {
      await addDoc(collection(db, "applications"), {
        firstName,
        lastName,
        email,
        phone,
        whyJoin,
        houseId,
        password, // stored as plain text (optional: hash before storing for security)
        status: "pending",
        submittedAt: serverTimestamp()
      });

      form.style.display = "none";
      confirmation.textContent = "✅ Application submitted successfully!";
    } catch (error) {
      confirmation.textContent = "❌ Error: " + error.message;
    }
  });
});
