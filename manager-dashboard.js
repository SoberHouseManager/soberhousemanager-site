// manager-dashboard.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore, collection, query, where, getDocs, addDoc, updateDoc, setDoc, doc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

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

const houseList = document.getElementById("house-list");
const residentList = document.getElementById("resident-list");
const pendingApps = document.getElementById("pending-apps");
const logoutBtn = document.getElementById("logoutBtn");
const houseForm = document.getElementById("house-form");

logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "login.html";
});

onAuthStateChanged(auth, async (user) => {
  if (!user) return (window.location.href = "login.html");

  // Handle House Form Submission
  if (houseForm) {
    houseForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = houseForm["house-name"].value.trim();
      const location = houseForm["location"].value.trim();
      const beds = parseInt(houseForm["beds"].value.trim());
      if (!name || !location || !beds) return alert("Fill all fields");

      await addDoc(collection(db, "houses"), {
        houseName: name,
        location,
        numberOfBeds: beds,
        managerEmail: user.email,
        createdAt: new Date().toISOString(),
      });

      alert("House created!");
      location.reload();
    });
  }

  // Fetch Manager Houses
  const houseQuery = query(collection(db, "houses"), where("managerEmail", "==", user.email));
  const houseSnapshot = await getDocs(houseQuery);
  const managerHouseIds = [];

  for (const docSnap of houseSnapshot.docs) {
    const data = docSnap.data();
    const id = docSnap.id;
    managerHouseIds.push(id);
    const fullLink = `${window.location.origin}/apply.html?houseId=${id}`;

    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      <h3>${data.houseName}</h3>
      <p><strong>Location:</strong> ${data.location}</p>
      <p><strong>Beds:</strong> ${data.numberOfBeds}</p>
      <p><strong>Application Link:</strong> <input type="text" value="${fullLink}" readonly onclick="this.select()" /></p>
    `;
    houseList.appendChild(div);
  }

  // Fetch Residents
  for (const houseId of managerHouseIds) {
    const usersQ = query(collection(db, "users"), where("houseId", "==", houseId));
    const usersSnap = await getDocs(usersQ);

    usersSnap.forEach(userSnap => {
      const r = userSnap.data();
      const status = r.balanceDue > 0 ? "Past Due" : "Current";

      const res = document.createElement("div");
      res.className = "card";
      res.innerHTML = `
        <p><strong>${r.fullName}</strong> (${status})</p>
        <p>Email: ${r.email}</p>
        <p>Phone: ${r.phone}</p>
        <button onclick="window.location.href='resident-details.html?residentId=${userSnap.id}'">Details</button>
      `;
      residentList.appendChild(res);
    });
  }

  // Fetch Applications
  const appSnap = await getDocs(collection(db, "applications"));
  appSnap.forEach(async (appDoc) => {
    const app = appDoc.data();
    if (app.status !== "pending" || !managerHouseIds.includes(app.houseId)) return;

    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      <h3>${app.fullName}</h3>
      <p>Email: ${app.email}</p>
      <p>Phone: ${app.phone}</p>
      <form>
        <input name="rentName" placeholder="Rent Name" required />
        <input name="rentAmount" type="number" placeholder="Amount" required />
        <input name="deposit" type="number" placeholder="Deposit" required />
        <select name="frequency">
          <option value="monthly">Monthly</option>
          <option value="weekly">Weekly</option>
        </select>
        <input name="dueDate" type="date" required />
        <label><input type="checkbox" name="recurring" /> Auto Billing</label>
        <button type="submit">Approve</button>
      </form>
    `;
    div.querySelector("form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const f = e.target;
      await setDoc(doc(db, "users", appDoc.id), {
        fullName: app.fullName,
        email: app.email,
        phone: app.phone,
        houseId: app.houseId,
        rentName: f.rentName.value.trim(),
        rentAmount: parseFloat(f.rentAmount.value),
        deposit: parseFloat(f.deposit.value),
        frequency: f.frequency.value,
        dueDate: f.dueDate.value,
        recurring: f.recurring.checked,
        role: "resident",
        balanceDue: parseFloat(f.deposit.value),
        createdAt: new Date().toISOString(),
      });
      await updateDoc(doc(db, "applications", appDoc.id), { status: "approved" });
      alert("Approved and added to residents.");
      div.remove();
    });
    pendingApps.appendChild(div);
  });
});
