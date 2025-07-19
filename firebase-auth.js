import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
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

// Handle login
const loginForm = document.getElementById("login-form");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Fetch user role from Firestore
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const userData = userDoc.data();

      if (!userData?.role) {
        document.getElementById("login-message").textContent = "No role found for this user.";
        return;
      }

      const role = userData.role;
      if (role === "owner") {
        window.location.href = "owner-dashboard.html";
      } else if (role === "manager") {
        window.location.href = "manager-dashboard.html";
      } else if (role === "resident") {
        window.location.href = "resident-dashboard.html";
      } else {
        document.getElementById("login-message").textContent = "Unknown user role.";
      }

    } catch (err) {
      document.getElementById("login-message").textContent = "Login failed: " + err.message;
    }
  });
}

// TEST USER CREATION – Only run once
async function setupTestAccounts() {
  const testAccounts = [
    { email: "test.manager@soberhouse.com", password: "Test1234!", role: "manager" },
    { email: "test.resident@soberhouse.com", password: "Test1234!", role: "resident" }
  ];

  for (let user of testAccounts) {
    try {
      const userCred = await createUserWithEmailAndPassword(auth, user.email, user.password);
      await setDoc(doc(db, "users", userCred.user.uid), {
        email: user.email,
        role: user.role,
        houseId: "test-house-001"
      });
    } catch (err) {
      if (!err.message.includes("already-in-use")) {
        console.warn("Test account error:", err.message);
      }
    }
  }

  await setDoc(doc(db, "houses", "test-house-001"), {
    name: "Test House",
    managerEmail: "test.manager@soberhouse.com",
    residents: ["test.resident@soberhouse.com"]
  });
}
// Uncomment below to run test account setup once:
// setupTestAccounts();
