// manager-dashboard.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore, collection, query, where, getDocs, addDoc, updateDoc, setDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

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
const houseFilter = document.getElementById("houseFilter");
const statusFilter = document.getElementById("statusFilter");
const searchInput = document.getElementById("searchResident");

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
  const residentData = [];

  for (const docSnap of houseSnapshot.docs) {
    const data = docSnap.data();
    const id = docSnap.id;
    houseMap[id] = data.houseName;
    managerHouseIds.push(id);

    const resSnap = await getDocs(query(collection(db, "users"), where("houseId", "==", id)));
    let pastDueCount = 0;
    let totalResidents = 0;

    resSnap.forEach(rSnap => {
      const rData = rSnap.data();
      totalResidents++;
      if (rData.balanceDue > 0) pastDueCount++;
      residentData.push({ ...rData, id: rSnap.id });
    });

    const fullLink = `${window.location.origin}/apply.html?houseId=${id}`;
    const badge = pastDueCount > 1 ? 'badge-danger' : pastDueCount === 1 ? 'badge-warning' : 'badge-success';

    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      <h3>${data.houseName}</h3>
      <p><strong>Location:</strong> ${data.location}</p>
      <p><strong>Beds:</strong> ${data.numberOfBeds}</p>
      <p><strong>Residents:</strong> ${totalResidents}</p>
      <p><span class="badge ${badge}">${pastDueCount} Past Due</span></p>
      <button onclick="filterResidentsByHouse('${id}')">View Residents</button>
      <button onclick="copyToClipboard('${fullLink}')">Copy Application Link</button>
      <button onclick="editHouse('${id}', '${data.houseName}', ${data.numberOfBeds})">Edit House</button>
    `;
    houseList.appendChild(div);
  }

  if (houseFilter) {
    houseFilter.innerHTML += managerHouseIds.map(id => `<option value="${id}">${houseMap[id]}</option>`).join("");
  }

  function renderResidents() {
    residentList.innerHTML = "";
    const statusVal = statusFilter?.value || "all";
    const houseVal = houseFilter?.value || "all";
    const searchVal = searchInput?.value?.toLowerCase() || "";

    residentData.forEach(r => {
      const fullName = r.fullName || "Unnamed";
      const isPastDue = r.balanceDue > 0;
      const matchesStatus = statusVal === "all" || (isPastDue ? statusVal === "pastdue" : statusVal === "current");
      const matchesHouse = houseVal === "all" || r.houseId === houseVal;
      const matchesSearch = fullName.toLowerCase().includes(searchVal);
      if (!(matchesStatus && matchesHouse && matchesSearch)) return;

      const badgeColor = isPastDue ? "badge-danger" : "badge-success";
      const div = document.createElement("div");
      div.className = "card";
      div.innerHTML = `
        <p><strong>${fullName}</strong> <span class="badge ${badgeColor}">${isPastDue ? "Past Due" : "Current"}</span></p>
        <p>House: ${houseMap[r.houseId] || "N/A"}</p>
        <p>Email: ${r.email}</p>
        <p>Phone: ${r.phone}</p>
        <button onclick="window.location.href='resident-details.html?residentId=${r.id}'">Details</button>
      `;
      residentList.appendChild(div);
    });
  }

  if (statusFilter) statusFilter.addEventListener("change", renderResidents);
  if (houseFilter) houseFilter.addEventListener("change", renderResidents);
  if (searchInput) searchInput.addEventListener("input", renderResidents);

  window.filterResidentsByHouse = (houseId) => {
    document.querySelector('[data-tab="residents-tab"]').click();
    if (houseFilter) houseFilter.value = houseId;
    renderResidents();
  };

  window.copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => alert("Application link copied to clipboard!"));
  };

  window.editHouse = async (houseId, currentName, currentBeds) => {
    const newName = prompt("Update house name:", currentName);
    const newBeds = prompt("Update number of beds:", currentBeds);
    if (newName && newBeds) {
      await updateDoc(doc(db, "houses", houseId), {
        houseName: newName.trim(),
        numberOfBeds: parseInt(newBeds.trim())
      });
      alert("House updated.");
      location.reload();
    }
  };

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
        <label><input type="checkbox" name="recurring" disabled ${app.recurring ? 'checked' : ''}/> Auto Billing</label>
        <button type="submit">Approve</button>
        <button type="button" onclick="rejectApplication('${appDoc.id}')">Reject</button>
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
        recurring: app.recurring || false,
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

  window.rejectApplication = async (appId) => {
    await updateDoc(doc(db, "applications", appId), { status: "rejected" });
    alert("Application rejected.");
    location.reload();
  };

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
