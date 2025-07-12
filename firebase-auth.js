<!-- Firebase App (the core Firebase SDK) -->
<script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js"></script>

<script>
  const firebaseConfig = {
    apiKey: "AIzaSyAFUOYQoC4et7H4oTmyjo3sBs_rI5eNgOg",
    authDomain: "soberhousemanager-3371d.firebaseapp.com",
    projectId: "soberhousemanager-3371d",
    storageBucket: "soberhousemanager-3371d.appspot.com",
    messagingSenderId: "931134241567",
    appId: "1:931134241567:web:f4083f35033e9e7c170e2a",
    measurementId: "G-L5SPVD901V"
  };

  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();

  // Login function
  function loginUser(emailId, password) {
    firebase.auth().signInWithEmailAndPassword(emailId, password)
      .then((userCredential) => {
        const user = userCredential.user;
        if (window.location.href.includes("manager")) {
          window.location.href = "manager-dashboard.html";
        } else {
          window.location.href = "resident-dashboard.html";
        }
      })
      .catch((error) => {
        alert("Login Failed: " + error.message);
      });
  }

  // Sign-up function
  function signUpUser(emailId, password) {
    firebase.auth().createUserWithEmailAndPassword(emailId, password)
      .then((userCredential) => {
        const user = userCredential.user;
        if (window.location.href.includes("manager")) {
          window.location.href = "manager-dashboard.html";
        } else {
          window.location.href = "resident-dashboard.html";
        }
      })
      .catch((error) => {
        alert("Sign-up Failed: " + error.message);
      });
  }

  // Logout function
  function logoutUser() {
    firebase.auth().signOut().then(() => {
      window.location.href = "index.html";
    });
  }

  // Protect dashboard access
  function protectDashboard() {
    firebase.auth().onAuthStateChanged((user) => {
      if (!user) {
        window.location.href = "login.html";
      }
    });
  }
</script>