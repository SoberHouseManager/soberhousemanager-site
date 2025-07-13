import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  setDoc
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

// Dummy manager email for test; replace this with actual logged-in user logic
const currentManagerEmail = "test.manager@soberhouse.com";

// Load applications for houses managed by the current manager
async function loadApplications() {
  const housesSnap = await getDocs(query(collection(db, "houses"), where("managerEmail", "==", currentManagerEmail)));
  const houseIds = housesSnap.docs.map(doc => doc.id);

  const appSnap = await getDocs(collection(db, "applications"));
  const container = document.getElementById("application-list");
  container.innerHTML = "";

  appSnap.forEach(docSnap => {
    const app = docSnap.data();
    if (!houseIds.includes(app.houseId) || app.status !== "pending") return;

    const div = document.createElement("div");
    div.className = "application-card";
    div.innerHTML = `
      <h3>${app.fullName}</h3>
      <p>Email: ${app.email}</p>
      <p>Phone: ${app.phone}</p>
      <p>Reason: ${app.whyJoin}</p>
      <p>House ID: ${app.houseId}</p>
      <button onclick="openApprovalForm('${docSnap.id}', '${app.email}', '${app.houseId}')">Approve</button>
      <button onclick="rejectApplication('${docSnap.id}')">Reject</button>
    `;
    container.appendChild(div);
  });
}

window.openApprovalForm = function (appId, email, houseId) {
  const form = document.getElementById("approval-form");
  form.style.display = "block";
  form.dataset.appId = appId;
  form.dataset.email = email;
  form.dataset.houseId = houseId;
};

window.rejectApplication = async function (appId) {
  await updateDoc(doc(db, "applications", appId), { status: "rejected" });
  loadApplications();
};

document.addEventListener("DOMContentLoaded", () => {
  loadApplications();

  const form = document.getElementById("approval-form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const appId = form.dataset.appId;
    const email = form.dataset.email;
    const houseId = form.dataset.houseId;

    const rent = parseFloat(document.getElementById("rent").value);
    const deposit = parseFloat(document.getElementById("deposit").value);
    const frequency = document.getElementById("frequency").value;
    const recurring = document.getElementById("recurring").checked;

    const residentId = email.replace(/[^a-zA-Z0-9]/g, "_");

    await setDoc(doc(db, "residents", residentId), {
      email,
      houseId,
      rent,
      deposit,
      frequency,
      recurring,
      balance: deposit,
      nextDue: new Date().toISOString(),
    });

    await updateDoc(doc(db, "applications", appId), {
      status: "approved",
      linkedUserId: residentId,
    });

    form.reset();
    form.style.display = "none";
    loadApplications();
  });
});
