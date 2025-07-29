// manager-dashboard.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  addDoc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAFUOYQoC4et7H4oTmyjo3sBs_rI5eNgOg",
  authDomain: "soberhousemanager-3371d.firebaseapp.com",
  projectId: "soberhousemanager-3371d",
  storageBucket: "soberhousemanager-3371d.appspot.com",
  messagingSenderId: "823636408266",
  appId: "1:823636408266:web:6f953b2ffacc187f2fdd36"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// DOM elements
const houseList = document.getElementById("house-list");
const residentList = document.getElementById("resident-list");
const logoutBtn = document.getElementById("logoutBtn");
const houseForm = document.getElementById("house-form");
const houseFilter = document.getElementById("houseFilter");
const statusFilter = document.getElementById("statusFilter");
const searchInput = document.getElementById("searchResident");
const tabs = document.querySelectorAll('.tab-button');
const contents = document.querySelectorAll('.tab-content');

// Sign out
logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "/login.html";
});

// Tab switching (Houses / Residents)
tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    contents.forEach(c => c.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(tab.dataset.tab).classList.add('active');
  });
});

// Auth guard and data init
onAuthStateChanged(auth, user => {
  if (!user) {
    window.location.href = "/login.html";
    return;
  }
  initManagerDashboard(user);
});

async function initManagerDashboard(user) {
  const houseQuery = query(
    collection(db, "houses"),
    where('managerEmail', '==', user.email)
  );
  const houseSnap = await getDocs(houseQuery);

  const houseIds = [];
  const houseMap = {};
  const residentData = [];

  // Render Houses Tab
  houseList.innerHTML = '';
  if (houseSnap.empty) {
    houseList.innerHTML = `<p class="italic">No houses found.</p>`;
  } else {
    for (const hDoc of houseSnap.docs) {
      const h = hDoc.data();
      const id = hDoc.id;
      houseIds.push(id);
      houseMap[id] = h.houseName;

      // Fetch residents for this house
      const resSnap = await getDocs(
        query(collection(db, "users"), where('houseId', '==', id))
      );
      let pastDueCount = 0;
      let totalResidents = 0;
      resSnap.forEach(r => {
        const rData = r.data();
        totalResidents++;
        if (rData.balanceDue > 0) pastDueCount++;
        residentData.push({ ...rData, id: r.id });
      });

      const badgeClass = pastDueCount > 0 ? 'badge-danger' : 'badge-success';
      
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <h3 class="text-lg font-bold mb-2">${h.houseName}</h3>
        <p><strong>Location:</strong> ${h.location}</p>
        <p><strong>Beds:</strong> ${h.numberOfBeds}</p>
        <p><strong>Residents:</strong> ${totalResidents}</p>
        <p><span class="badge ${badgeClass}">${pastDueCount} Past Due</span></p>
        <div class="card-buttons">
          <button onclick="filterResidentsByHouse('${id}')">View Residents</button>
          <button onclick="openInviteResidentModal('${id}')">Invite Resident</button>
          <button onclick="editHouse('${id}')">Edit House</button>
        </div>
      `;
      houseList.appendChild(card);
    }
  }

  // Populate house filter
  if (houseFilter) {
    houseFilter.innerHTML += houseIds
      .map(id => `<option value="${id}">${houseMap[id]}</option>`)
      .join('');
  }

  // Setup residents tab
  residentList.innerHTML = '';
  function renderResidents() {
    residentList.innerHTML = '';
    const statusVal = statusFilter?.value || 'all';
    const houseVal = houseFilter?.value || 'all';
    const searchVal = searchInput?.value.toLowerCase() || '';

    residentData.forEach(r => {
      const name = r.fullName || r.email;
      const isPastDue = r.balanceDue > 0;
      const matchesStatus = statusVal === 'all' || (isPastDue ? statusVal === 'pastdue' : statusVal === 'current');
      const matchesHouse = houseVal === 'all' || r.houseId === houseVal;
      const matchesSearch = name.toLowerCase().includes(searchVal);
      if (!(matchesStatus && matchesHouse && matchesSearch)) return;

      const badgeClass = isPastDue ? 'badge-danger' : 'badge-success';
      const div = document.createElement('div');
      div.className = 'card';
      div.innerHTML = `
        <p><strong>${name}</strong> <span class="badge ${badgeClass}">${isPastDue ? 'Past Due' : 'Current'}</span></p>
        <p>House: ${houseMap[r.houseId] || 'N/A'}</p>
        <p>Email: ${r.email}</p>
        <p>Phone: ${r.phone}</p>
        <button onclick="window.location.href='resident-details.html?residentId=${r.id}'">Details</button>
      `;
      residentList.appendChild(div);
    });
  }
  if (statusFilter) statusFilter.addEventListener('change', renderResidents);
  if (houseFilter) houseFilter.addEventListener('change', renderResidents);
  if (searchInput) searchInput.addEventListener('input', renderResidents);

  window.filterResidentsByHouse = (houseId) => {
    document.querySelector('[data-tab="residents-tab"]').click();
    houseFilter.value = houseId;
    renderResidents();
  };

  // House creation form
  if (houseForm) {
    houseForm.addEventListener('submit', async e => {
      e.preventDefault();
      const name = houseForm['house-name'].value.trim();
      const location = houseForm['location'].value.trim();
      const beds = parseInt(houseForm['beds'].value.trim(), 10);
      if (!name || !location || !beds) return alert('Please fill all fields.');

      await addDoc(collection(db, 'houses'), {
        houseName: name,
        location,
        numberOfBeds: beds,
        managerEmail: auth.currentUser.email,
        createdAt: new Date().toISOString()
      });
      alert('House created!');
      location.reload();
    });
  }
}

// Invite Resident Modal
function openInviteResidentModal(houseId) {
  const email = prompt('Enter resident email to invite:');
  if (!email) return;
  addDoc(collection(db, 'houses', houseId, 'invites'), {
    email,
    created: Date.now(),
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000
  })
    .then(() => alert('Invite sent!'))
    .catch(err => alert('Error sending invite: ' + err.message));
}

// Edit House placeholder
function editHouse(houseId) {
  alert('Edit House feature coming soon.');
}
