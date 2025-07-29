// owner-dashboard.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  doc,
  query,
  where,
  getDocs,
  updateDoc,
  addDoc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// Firebase initialization
const firebaseConfig = {
  apiKey: "AIzaSyAFUOYQoC4et7H4oTmyjo3sBs_rI5eNgOg",
  authDomain: "soberhousemanager-3371d.firebaseapp.com",
  projectId: "soberhousemanager-3371d",
  storageBucket: "soberhousemanager-3371d.appspot.com",
  messagingSenderId: "823636408266",
  appId: "1:823636408266:web:6f953b2ffacc187f"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// DOM references
const tabHouses = document.getElementById('tab-houses');
const tabManagers = document.getElementById('tab-managers');
const tabResidents = document.getElementById('tab-residents');
const mainContainer = document.getElementById('main-container');

// Auth guard & initialization
onAuthStateChanged(auth, user => {
  if (!user) {
    window.location.href = '/owner-signup.html';
    return;
  }
  if (!user.emailVerified) {
    alert('Please verify your email before accessing the Owner Dashboard.');
    signOut(auth).then(() => window.location.href = '/owner-signup.html');
    return;
  }
  initDashboard(user.uid);
});

async function initDashboard(ownerId) {
  setupTabListeners(ownerId);
  // default to houses tab
  loadHouses(ownerId);
}

function setupTabListeners(ownerId) {
  tabHouses.addEventListener('click', () => loadHouses(ownerId));
  tabManagers.addEventListener('click', () => loadManagers(ownerId));
  tabResidents.addEventListener('click', () => loadAllResidents(ownerId));
}

async function loadHouses(ownerId) {
  mainContainer.innerHTML = '<h2>Loading houses...</h2>';
  const housesRef = collection(db, 'houses');
  const q = query(housesRef, where('ownerId', '==', ownerId));
  const snapshot = await getDocs(q);
  mainContainer.innerHTML = '';
  snapshot.forEach(docSnap => {
    const house = docSnap.data();
    const card = document.createElement('div');
    card.className = 'house-card';
    card.innerHTML = `
      <h3>${house.name}</h3>
      <p>${house.location}</p>
      <p>Beds: ${house.numBeds}</p>
      <button class='btn-view-residents' data-id='${docSnap.id}'>View Residents</button>
      <button class='btn-edit-house' data-id='${docSnap.id}'>Edit House</button>
      <span class='badge-past-due'>Past Due: ${house.pastDueCount || 0}</span>
    `;
    mainContainer.appendChild(card);
  });
  document.querySelectorAll('.btn-view-residents').forEach(btn => {
    btn.addEventListener('click', e => loadHouseResidents(e.target.dataset.id));
  });
}

async function loadManagers(ownerId) {
  mainContainer.innerHTML = '<h2>Loading managers...</h2>';
  // Collect managers from each house
  const housesRef = collection(db, 'houses');
  const q = query(housesRef, where('ownerId', '==', ownerId));
  const snapshot = await getDocs(q);
  const managersSet = new Set();
  snapshot.forEach(hSnap => {
    const { managers = [] } = hSnap.data();
    managers.forEach(uid => managersSet.add(uid));
  });
  mainContainer.innerHTML = '';
  for (let uid of managersSet) {
    // Ideally fetch manager profile (to be implemented)
    const managerCard = document.createElement('div');
    managerCard.className = 'manager-card';
    managerCard.textContent = `Manager UID: ${uid}`;
    mainContainer.appendChild(managerCard);
  }
  // Invite manager button
  const inviteBtn = document.createElement('button');
  inviteBtn.textContent = 'Invite Manager';
  inviteBtn.addEventListener('click', () => {/* trigger invite flow */});
  mainContainer.appendChild(inviteBtn);
}

async function loadAllResidents(ownerId) {
  mainContainer.innerHTML = '<h2>Loading residents...</h2>';
  const housesRef = collection(db, 'houses');
  const q = query(housesRef, where('ownerId', '==', ownerId));
  const snapshot = await getDocs(q);
  mainContainer.innerHTML = '';
  for (let hSnap of snapshot.docs) {
    const houseId = hSnap.id;
    // Fetch residents subcollection
    const resRef = collection(db, 'houses', houseId, 'residents');
    const resSnap = await getDocs(resRef);
    resSnap.forEach(rSnap => {
      const res = rSnap.data();
      const card = document.createElement('div');
      card.className = 'resident-card';
      card.innerHTML = `
        <h4>${res.name}</h4>
        <p>Balance: ${res.balance || 0}</p>
        <button class='btn-resident-details' data-house='${houseId}' data-res='${rSnap.id}'>Details</button>
      `;
      mainContainer.appendChild(card);
    });
  }
  document.querySelectorAll('.btn-resident-details').forEach(btn => {
    btn.addEventListener('click', e => {
      const { house, res } = e.target.dataset;
      window.location.href = `/resident-details.html?houseId=${house}&resId=${res}`;
    });
  });
}

async function loadHouseResidents(houseId) {
  mainContainer.innerHTML = `<h2>Loading residents for house ${houseId}...</h2>`;
  const resRef = collection(db, 'houses', houseId, 'residents');
  const resSnap = await getDocs(resRef);
  mainContainer.innerHTML = '';
  resSnap.forEach(rSnap => {
    const res = rSnap.data();
    const card = document.createElement('div');
    card.className = 'resident-card';
    card.innerHTML = `
      <h4>${res.name}</h4>
      <p>Next Due: ${res.nextDueDate || 'N/A'}</p>
      <p>Past Due: ${res.isPastDue ? 'Yes' : 'No'}</p>
      <button class='btn-resident-details' data-house='${houseId}' data-res='${rSnap.id}'>Details</button>
    `;
    mainContainer.appendChild(card);
  });
  document.querySelectorAll('.btn-resident-details').forEach(btn => {
    btn.addEventListener('click', e => {
      const { house, res } = e.target.dataset;
      window.location.href = `/resident-details.html?houseId=${house}&resId=${res}`;
    });
  });
}
