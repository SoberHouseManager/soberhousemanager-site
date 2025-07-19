import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc
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

const loginForm = document.getElementById("login-form");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    try {
      await signInWithEmailAndPassword(auth, email, password);
      const userRef = doc(db, "users", auth.currentUser.uid);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.data();

      if (!userData?.role) {
        document.getElementById("login-message").textContent = "No role found for user.";
        return;
      }

      if (userData.role === "owner") {
        window.location.href = "owner-dashboard.html";
      } else if (userData.role === "manager") {
        window.location.href = "manager-dashboard.html";
      } else if (userData.role === "resident") {
        window.location.href = "resident-dashboard.html";
      } else {
        document.getElementById("login-message").textContent = "Unrecognized user role.";
      }
    } catch (err) {
      document.getElementById("login-message").textContent = "Login failed: " + err.message;
    }
  });
}