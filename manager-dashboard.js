// manager-dashboard.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore, collection, query, where, getDocs, addDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const app = initializeApp({
  apiKey: "AIzaSyAFUOYQoC4et7H4oTmyjo3sBs_rI5eNgOg",
  authDomain: "soberhousemanager-3371d.firebaseapp.com",
  projectId: "soberhousemanager-3371d",
  storageBucket: "soberhousemanager-3371d.appspot.com",
  messagingSenderId: "823636408266",
  appId: "1:823636408266:web:6f953b2ffacc187f2fdd36"
});
const auth = getAuth(app);
const db = getFirestore(app);

const houseList = document.getElementById("house-list");
const residentList = document.getElementById("resident-list");
const logoutBtn = document.getElementById("logoutBtn");
const houseForm = document.getElementById("house-form");
const houseFilter = document.getElementById("houseFilter");
const statusFilter = document.getElementById("statusFilter");
const searchInput = document.getElementById("searchResident");

const tabs = document.querySelectorAll('.tab-button');
const contents = document.querySelectorAll('.tab-content');

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

onAuthStateChanged(auth, user => {
  if (!user) {
    window.location.href = "/login.html";
    return;
  }
  initManagerDashboard(user);
});

async function initManagerDashboard(user) {
  showLoading();
  try {
    // Fetch houses
    const houseSnap = await getDocs(
      query(collection(db, "houses"), where('managerEmail', '==', user.email))
    );

    // Render Houses
    houseList.innerHTML = "";
    if (houseSnap.empty) {
      houseList.innerHTML = `<p class="italic">No houses found.</p>`;
    } else {
      const houseIds = [], houseMap = {}, residentData = [];
      for (const hDoc of houseSnap.docs) {
        const h = hDoc.data(), id = hDoc.id;
        houseIds.push(id); houseMap[id] = h.houseName;

        // fetch residents for badge counts
        const resSnap = await getDocs(
          query(collection(db, "users"), where('houseId', '==', id))
        );
        let pastDue = 0, total = 0;
        resSnap.forEach(r => {
          total++;
          if (r.data().balanceDue > 0) pastDue++;
          residentData.push({ ...r.data(), id: r.id });
        });

        const badgeCls = pastDue > 0 ? "badge-danger" : "badge-success";
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
          <h3 class="text-lg font-bold mb-2">${h.houseName}</h3>
          <p><strong>Location:</strong> ${h.location}</p>
          <p><strong>Beds:</strong> ${h.numberOfBeds}</p>
          <p><strong>Residents:</strong> ${total}</p>
          <p><span class="badge ${badgeCls}">${pastDue} Past Due</span></p>
          <div class="card-buttons">
            <button onclick="filterResidentsByHouse('${id}')">View Residents</button>
            <button onclick="openInviteResidentModal('${id}')">Invite Resident</button>
            <button onclick="editHouse('${id}')">Edit House</button>
          </div>
        `;
        houseList.appendChild(card);
      }

      // populate house filter
      houseFilter.innerHTML += houseIds
        .map(id => `<option value="${id}">${houseMap[id]}</option>`)
        .join('');
      
      // Residents logic
      function renderResidents() {
        residentList.innerHTML = "";
        const sVal = statusFilter.value, hVal = houseFilter.value, qVal = searchInput.value.toLowerCase();
        residentData.forEach(r => {
          const name = r.fullName || r.email;
          const isPD = r.balanceDue > 0;
          if ((sVal!=="all" && (isPD? sVal!=="pastdue" : sVal!=="current")) ||
              (hVal!=="all" && r.houseId !== hVal) ||
              !name.toLowerCase().includes(qVal)) return;
          const cls = isPD ? "badge-danger" : "badge-success";
          const div = document.createElement('div');
          div.className = 'card';
          div.innerHTML = `
            <p><strong>${name}</strong> <span class="badge ${cls}">${isPD?"Past Due":"Current"}</span></p>
            <p>House: ${houseMap[r.houseId]||"N/A"}</p>
            <p>Email: ${r.email}</p>
            <p>Phone: ${r.phone}</p>
            <button onclick="window.location.href='resident-details.html?residentId=${r.id}'">Details</button>
          `;
          residentList.appendChild(div);
        });
      }
      statusFilter.addEventListener('change', renderResidents);
      houseFilter.addEventListener('change', renderResidents);
      searchInput.addEventListener('input', renderResidents);
      window.filterResidentsByHouse = id => {
        document.querySelector('[data-tab="residents-tab"]').click();
        houseFilter.value = id; renderResidents();
      };

      // House form
      if (houseForm) {
        houseForm.addEventListener('submit', async e => {
          e.preventDefault();
          const name = houseForm['house-name'].value.trim();
          const loc = houseForm['location'].value.trim();
          const beds = parseInt(houseForm['beds'].value,10);
          if (!name||!loc||!beds) { showToast('Fill all fields.', 'error'); return; }
          await addDoc(collection(db,'houses'), {
            houseName:name, location:loc, numberOfBeds:beds,
            managerEmail: auth.currentUser.email,
            createdAt: new Date().toISOString()
          });
          showToast('House created successfully!', 'success');
          location.reload();
        });
      }
    }
  } catch (err) {
    console.error(err);
    showToast('Error loading dashboard.', 'error');
  } finally {
    hideLoading();
  }
}

// Invite and edit placeholders
function openInviteResidentModal(houseId) {
  const email = prompt('Enter resident email to invite:');
  if (!email) return;
  addDoc(collection(db,'houses',houseId,'invites'), {
    email, created:Date.now(), expires:Date.now()+7*24*60*60*1000
  })
  .then(() => showToast('Invite sent! They have 7 days to accept.', 'success'))
  .catch(err => showToast('Error sending invite: '+err.message,'error'));
}

function editHouse(houseId) {
  showToast('Edit House feature coming soon.', 'error');
}
