// manager-dashboard.js

// Firebase references
const auth = firebase.auth();
const db = firebase.firestore();

// DOM elements
const housesContainer = document.getElementById('houses-container');
const residentsContainer = document.getElementById('residents-container');
const applicationsContainer = document.getElementById('applications-container');
const createHouseForm = document.getElementById('create-house-form');
const createHouseBtn = document.getElementById('create-house-btn');
const cancelCreateBtn = document.getElementById('cancel-create-btn');
const housesTab = document.getElementById('houses-tab');
const residentsTab = document.getElementById('residents-tab');
const applicationsTab = document.getElementById('applications-tab');
const statusFilter = document.getElementById('status-filter');
const houseFilter = document.getElementById('house-filter');
const searchInput = document.getElementById('search-input');
const appHouseFilter = document.getElementById('application-house-filter');

let managerId = null;
let houses = [];

// Tabs
function showTab(tabName) {
  housesContainer.style.display = tabName === 'houses' ? 'block' : 'none';
  residentsContainer.style.display = tabName === 'residents' ? 'block' : 'none';
  applicationsContainer.style.display = tabName === 'applications' ? 'block' : 'none';
}

housesTab.addEventListener('click', () => showTab('houses'));
residentsTab.addEventListener('click', () => showTab('residents'));
applicationsTab.addEventListener('click', () => showTab('applications'));

// Auth check
auth.onAuthStateChanged(user => {
  if (!user) {
    window.location.href = '/login.html';
    return;
  }
  managerId = user.uid;
  loadDashboard();
});

// Load dashboard data
async function loadDashboard() {
  await loadHouses();
  await loadResidents();
  await loadApplications();
}

// Load Houses
async function loadHouses() {
  housesContainer.innerHTML = '';
  const snapshot = await db.collection('houses').where('managerId', '==', managerId).get();
  houses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  houses.forEach(house => {
    const houseCard = document.createElement('div');
    houseCard.className = 'house-card';

    const pastDueCount = house.pastDue || 0;
    const badgeColor = pastDueCount > 0 ? 'yellow' : 'green';

    houseCard.innerHTML = `
      <h3>${house.name}</h3>
      <p><strong>Location:</strong> ${house.location}</p>
      <p><strong>Beds:</strong> ${house.beds}</p>
      <p><strong>Residents:</strong> ${house.residents || 0}</p>
      <span class="badge ${badgeColor}">${pastDueCount} PAST DUE</span>
      <div class="button-group">
        <button onclick="viewResidents('${house.id}')">View Residents</button>
        <button onclick="copyLink('${house.id}')">Copy Application Link</button>
        <button onclick="editHouse('${house.id}')">Edit House</button>
      </div>
    `;
    housesContainer.appendChild(houseCard);
  });
}

// Load Residents
async function loadResidents(filterHouseId = null) {
  residentsContainer.innerHTML = '';
  let query = db.collection('residents').where('managerId', '==', managerId);
  if (filterHouseId) {
    query = query.where('houseId', '==', filterHouseId);
  }
  const snapshot = await query.get();
  snapshot.forEach(doc => {
    const data = doc.data();
    const residentCard = document.createElement('div');
    residentCard.className = 'resident-card';
    const status = data.status === 'past_due' ? 'red' : 'green';

    residentCard.innerHTML = `
      <h3>${data.name} <span class="badge ${status}">${data.status.replace('_', ' ').toUpperCase()}</span></h3>
      <p><strong>House:</strong> ${data.houseName}</p>
      <p><strong>Email:</strong> ${data.email}</p>
      <p><strong>Phone:</strong> ${data.phone}</p>
      <button onclick="location.href='resident-details.html?id=${doc.id}'">Details</button>
    `;
    residentsContainer.appendChild(residentCard);
  });
}

// Load Applications
async function loadApplications() {
  applicationsContainer.innerHTML = '';
  let query = db.collection('applications').where('managerId', '==', managerId);
  const selectedHouse = appHouseFilter?.value;
  if (selectedHouse && selectedHouse !== 'all') {
    query = query.where('houseId', '==', selectedHouse);
  }
  const snapshot = await query.get();

  snapshot.forEach(doc => {
    const data = doc.data();
    const appCard = document.createElement('div');
    appCard.className = 'application-card';

    appCard.innerHTML = `
      <p><strong>Email:</strong> ${data.email}</p>
      <p><strong>Phone:</strong> ${data.phone}</p>
      <p><strong>House:</strong> ${data.houseName}</p>
      <p><strong>Status:</strong> ${data.status.toUpperCase()}</p>
      <p><strong>Auto Billing:</strong> ${data.autoBilling ? 'Yes' : 'No'}</p>
      <div class="button-group">
        <button onclick="approveApplication('${doc.id}')">Approve</button>
        <button onclick="rejectApplication('${doc.id}')">Reject</button>
      </div>
    `;
    applicationsContainer.appendChild(appCard);
  });
}

// Copy Link
function copyLink(houseId) {
  const link = `${window.location.origin}/apply.html?houseId=${houseId}`;
  navigator.clipboard.writeText(link).then(() => alert('Link copied!'));
}

// View Residents
function viewResidents(houseId) {
  showTab('residents');
  loadResidents(houseId);
}

// Edit House
function editHouse(houseId) {
  alert('Edit House modal functionality will go here.');
}

// Approve/Reject Application
function approveApplication(id) {
  alert(`Approved application ID: ${id}`);
}

function rejectApplication(id) {
  alert(`Rejected application ID: ${id}`);
}

// Show create form
createHouseBtn.addEventListener('click', () => {
  createHouseForm.style.display = 'block';
});
cancelCreateBtn.addEventListener('click', () => {
  createHouseForm.style.display = 'none';
});
