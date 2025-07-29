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

// DOM refs
const tabHouses = document.getElementById('tab-houses');
const tabManagers = document.getElementById('tab-managers');
const tabResidents = document.getElementById('tab-residents');
const mainContainer = document.getElementById('main-container');
const signOutBtn = document.getElementById('sign-out');

// Sign‑out
signOutBtn.addEventListener('click', () => signOut(auth).then(() => window.location.href='/owner-login.html'));

// Auth guard
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

function initDashboard(ownerId) {
  setupTabs(ownerId);
  loadHouses(ownerId);
}

function setupTabs(ownerId) {
  tabHouses.addEventListener('click', () => loadHouses(ownerId));
  tabManagers.addEventListener('click', () => loadManagers(ownerId));
  tabResidents.addEventListener('click', () => loadAllResidents(ownerId));
}

async function loadHouses(ownerId) {
  clearContainer();
  const q = query(collection(db, 'houses'), where('ownerId', '==', ownerId));
  const snap = await getDocs(q);

  if (snap.empty) {
    mainContainer.innerHTML = `
      <p class="italic">
        No houses yet. Click "Create House" in the dashboard to add one.
      </p>`;
    return;
  }

  snap.forEach(docSnap => {
    const h = docSnap.data();
    const card = document.createElement('div');
    card.className = 'bg-white p-6 rounded shadow';
    card.innerHTML = `
      <h3 class="text-lg font-bold mb-2">${h.name}</h3>
      <p class="mb-1"><strong>Location:</strong> ${h.location}</p>
      <p class="mb-1"><strong>Beds:</strong> ${h.numBeds}</p>
      <p class="mb-4">
        <span class="badge badge-success">${h.pastDueCount||0} Past Due</span>
        <span class="badge badge-warning">${h.residentsCount||0} Residents</span>
      </p>
      <div class="flex space-x-2">
        <button data-id="${docSnap.id}" class="btn-primary btn-view-residents">View Residents</button>
        <button data-id="${docSnap.id}" class="btn-secondary btn-invite-resident">Invite Resident</button>
        <button data-id="${docSnap.id}" class="btn-secondary btn-edit-house">Edit House</button>
      </div>
    `;
    mainContainer.appendChild(card);
  });

  // Hooks
  document.querySelectorAll('.btn-view-residents')
    .forEach(b => b.addEventListener('click', e => loadHouseResidents(e.target.dataset.id)));
  document.querySelectorAll('.btn-invite-resident')
    .forEach(b => b.addEventListener('click', e => openInviteModal(e.target.dataset.id)));
  document.querySelectorAll('.btn-edit-house')
    .forEach(b => b.addEventListener('click', e => window.location.href = `/edit-house.html?houseId=${e.target.dataset.id}`));
}

async function loadManagers(ownerId) {
  clearContainer();
  // ... existing managers code ...
}

async function loadAllResidents(ownerId) {
  clearContainer();
  // ... existing residents code ...
}

async function loadHouseResidents(houseId) {
  clearContainer();
  // ... existing per‑house residents code ...
}

// Utility
function clearContainer() {
  mainContainer.innerHTML = '';
}

// Invite modal (simple window.prompt for now)
async function openInviteModal(houseId) {
  const email = prompt('Enter resident email to invite:');
  if (!email) return;
  try {
    await addDoc(collection(db, 'houses', houseId, 'invites'), {
      email,
      created: Date.now(),
      expires: Date.now() + 7*24*60*60*1000
    });
    alert('Invite sent! They have 7 days to accept.');
  } catch(err) {
    console.error(err);
    alert('Error sending invite: ' + err.message);
  }
}
