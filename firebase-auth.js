
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

// Firebase config
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

// 🔐 Handle Login Form Submission
const loginForm = document.getElementById("login-form");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const messageBox = document.getElementById("login-message");

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Fetch user role from Firestore
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const userData = userDoc.data();

      if (!userDoc.exists() || !userData?.role) {
        messageBox.textContent = "No role found for this user. Contact admin.";
        return;
      }

      const role = userData.role;
      switch (role) {
        case "owner":
          window.location.href = "owner-dashboard.html";
          break;
        case "manager":
          window.location.href = "manager-dashboard.html";
          break;
        case "resident":
          window.location.href = "resident-dashboard.html";
          break;
        default:
          messageBox.textContent = "Unknown role. Contact admin.";
      }

    } catch (err) {
      console.error("Login error:", err.message);
      document.getElementById("login-message").textContent = "Login failed: " + err.message;
    }
  });
}

// 🧪 Test User Setup (Only run once for development)
async function setupTestAccounts() {
  const testAccounts = [
    { email: "test.manager@soberhouse.com", password: "Test1234!", role: "manager" },
    { email: "test.resident@soberhouse.com", password: "Test1234!", role: "resident" }
  ];

  for (let user of testAccounts) {
    try {
      const userCred = await createUserWithEmailAndPassword(auth, user.email, user.password);
      const uid = userCred.user.uid;

      await setDoc(doc(db, "users", uid), {
        email: user.email,
        role: user.role,
        houseId: "test-house-001"
      });

      if (user.role === "resident") {
        await setDoc(doc(db, "residents", uid), {
          fullName: "John Doe",
          email: user.email,
          houseId: "test-house-001",
          paymentFrequency: "monthly",
          nextDueDate: new Date().toISOString(),
          pastDue: false,
          autoBillingEnabled: true
        });
      }

    } catch (err) {
      if (!err.message.includes("already-in-use")) {
        console.warn("Test account setup error:", err.message);
      }
    }
  }

  // Optional: Preload test house if not exists
  await setDoc(doc(db, "houses", "test-house-001"), {
    name: "Test House",
    location: "Fort Worth, TX",
    managerEmail: "test.manager@soberhouse.com",
    residents: ["test.resident@soberhouse.com"]
  });

  console.log("✅ Test users and house initialized.");
}

// Uncomment to run once
// setupTestAccounts();
