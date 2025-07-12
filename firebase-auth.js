
// Firebase Compat (non-module for browser compatibility)
const firebaseConfig = {
  apiKey: "AIzaSyAFUOYQoC4et7H4oTmyjo3sBs_rI5eNgOg",
  authDomain: "soberhousemanager-3371d.firebaseapp.com",
  projectId: "soberhousemanager-3371d",
  storageBucket: "soberhousemanager-3371d.appspot.com",
  messagingSenderId: "931134241567",
  appId: "1:931134241567:web:f4083f35033e9e7c170e2a",
  measurementId: "G-L5SPVD901V"
};

// Load Firebase Compat SDK
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

function loginUser(email, password) {
  auth.signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      const email = userCredential.user.email;
      if (email === "westromdrew@gmail.com") {
        window.location.href = "admin-dashboard.html";
      } else if (window.location.href.includes("manager")) {
        window.location.href = "manager-dashboard.html";
      } else {
        window.location.href = "dashboard.html";
      }
    })
    .catch((error) => {
      alert("Login failed: " + error.message);
    });
}
