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

  const houseQuery = query(collection(db, "houses"), where("managerEmail", "==", user.email));
  const houseSnapshot = await getDocs(houseQuery);
  const managerHouseIds = [];
  const houseMap = {};

  for (const docSnap of houseSnapshot.docs) {
    const data = docSnap.data();
    const id = docSnap.id;
    houseMap[id] = data.houseName;
    managerHouseIds.push(id);

    const residentsQ = query(collection(db, "users"), where("houseId", "==", id));
    const resSnap = await getDocs(residentsQ);
    const filledBeds = resSnap.docs.length;
    const capacity = data.numberOfBeds;
    const percent = Math.min(100, Math.round((filledBeds / capacity) * 100));

    const fullLink = `${window.location.origin}/apply.html?houseId=${id}`;
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      <h3>${data.houseName}</h3>
      <p><strong>Location:</strong> ${data.location}</p>
      <p><strong>Beds:</strong> ${filledBeds}/${capacity}</p>
      <div class="progress-container"><div class="progress-bar" style="width:${percent}%"></div></div>
      <p><strong>Application Link:</strong> <input type="text" value="${fullLink}" readonly onclick="this.select()" /></p>
    `;
    houseList.appendChild(div);
  }

  const usersQ = query(collection(db, "users"), where("houseId", "in", managerHouseIds));
  const usersSnap = await getDocs(usersQ);

  const houseFilter = document.getElementById("houseFilter");
  const statusFilter = document.getElementById("statusFilter");
  const searchInput = document.getElementById("searchResident");

  // Populate house filter dropdown
  houseFilter.innerHTML += managerHouseIds.map(id => `<option value="${id}">${houseMap[id]}</option>`).join("");

  const renderResidents = () => {
    residentList.innerHTML = "";
    const statusVal = statusFilter.value;
    const houseVal = houseFilter.value;
    const searchVal = searchInput.value.toLowerCase();

    usersSnap.forEach(userSnap => {
      const r = userSnap.data();
      const fullName = r.fullName || "Unnamed";
      const isPastDue = r.balanceDue > 0;
      const matchesStatus = statusVal === "all" || (isPastDue ? statusVal === "pastdue" : statusVal === "current");
      const matchesHouse = houseVal === "all" || r.houseId === houseVal;
      const matchesSearch = fullName.toLowerCase().includes(searchVal);
      if (!(matchesStatus && matchesHouse && matchesSearch)) return;

      const status = isPastDue ? "Past Due" : "Current";
      const badgeColor = isPastDue ? "badge-danger" : "badge-success";

      const div = document.createElement("div");
      div.className = "card";
      div.innerHTML = `
        <p><strong>${fullName}</strong> <span class="badge ${badgeColor}">${status}</span></p>
        <p>House: ${houseMap[r.houseId] || "N/A"}</p>
        <p>Email: ${r.email}</p>
        <p>Phone: ${r.phone}</p>
        <button onclick="window.location.href='resident-details.html?residentId=${userSnap.id}'">Details</button>
      `;
      residentList.appendChild(div);
    });
  };

  statusFilter.addEventListener("change", renderResidents);
  houseFilter.addEventListener("change", renderResidents);
  searchInput.addEventListener("input", renderResidents);

  renderResidents();

  const appSnap = await getDocs(collection(db, "applications"));
  pendingApps.innerHTML = "";

  appSnap.forEach(appDoc => {
    const app = appDoc.data();
    if (app.status !== "pending" || !managerHouseIds.includes(app.houseId)) return;

    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      <h3>${app.fullName}</h3>
      <p>Email: ${app.email}</p>
      <p>Phone: ${app.phone}</p>
      <p>House: ${houseMap[app.houseId] || "N/A"}</p>
      <span class="badge badge-warning">PENDING</span>
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
});
