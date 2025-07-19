
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
  const applicationCounts = {};

  const appSnap = await getDocs(collection(db, "applications"));
  appSnap.forEach(appDoc => {
    const app = appDoc.data();
    if (app.status === "pending" && app.houseId) {
      if (!applicationCounts[app.houseId]) {
        applicationCounts[app.houseId] = 0;
      }
      applicationCounts[app.houseId]++;
    }
  });

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

    const pendingCount = applicationCounts[id] || 0;
    const badge = pastDueCount > 1 ? 'badge-danger' : pastDueCount === 1 ? 'badge-warning' : 'badge-success';
    const pendingBadge = pendingCount > 0 ? `<span class="badge badge-warning">${pendingCount} Pending</span>` : `<span class="badge badge-success">0 Pending</span>`;

    const fullLink = `${window.location.origin}/apply.html?houseId=${id}`;
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      <h3>${data.houseName}</h3>
      <p><strong>Location:</strong> ${data.location}</p>
      <p><strong>Beds:</strong> ${data.numberOfBeds}</p>
      <p><strong>Residents:</strong> ${totalResidents}</p>
      <p><span class="badge ${badge}">${pastDueCount} Past Due</span> ${pendingBadge}</p>
      <div class="card-buttons">
        <button onclick="filterResidentsByHouse('${id}')">View Residents</button>
        <button onclick="copyToClipboard('${fullLink}')">Copy Application Link</button>
        <button onclick="editHouse('${id}')">Edit House</button>
      </div>
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
    navigator.clipboard.writeText(text).then(() => {
      alert("Application link copied to clipboard!");
    });
  };

  window.editHouse = (houseId) => {
    alert("Edit House coming soon! (Feature placeholder)");
  };

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
      <div style="display: flex; gap: 10px;">
        <button class="btn-approve" onclick="approveApplication('${appDoc.id}')">Approve</button>
        <button class="btn-reject" onclick="rejectApplication('${appDoc.id}')">Reject</button>
      </div>
    `;
    pendingApps.appendChild(div);
  });

  window.approveApplication = async function (appId) {
    const appDoc = await getDocs(query(collection(db, "applications"), where("__name__", "==", appId)));
    const app = appDoc.docs[0]?.data();
    if (!app) return alert("Application not found.");

    const userId = app.email.replace(/[^a-zA-Z0-9]/g, "_");
    await setDoc(doc(db, "users", userId), {
      fullName: app.fullName,
      email: app.email,
      phone: app.phone,
      houseId: app.houseId,
      role: "resident",
      balanceDue: 0,
      createdAt: new Date().toISOString(),
    });
    await updateDoc(doc(db, "applications", appId), { status: "approved" });
    alert("Approved and added as a resident.");
    location.reload();
  };

  window.rejectApplication = async function (appId) {
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
