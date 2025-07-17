document.addEventListener("DOMContentLoaded", async () => {
  const auth = firebase.auth();
  const db = firebase.firestore();

  const appList = document.getElementById("application-list");

  auth.onAuthStateChanged(async (user) => {
    if (!user) {
      appList.innerHTML = "<p>Please log in to view applications.</p>";
      return;
    }

    const managerId = user.email;
    const housesRef = db.collection("houses").where("managerEmail", "==", managerId);
    const housesSnap = await housesRef.get();
    const houseIds = housesSnap.docs.map(doc => doc.id);

    if (houseIds.length === 0) {
      appList.innerHTML = "<p>You have no houses linked to your account.</p>";
      return;
    }

    const appsRef = db.collection("applications").where("houseId", "in", houseIds);
    const appsSnap = await appsRef.get();

    if (appsSnap.empty) {
      appList.innerHTML = "<p>No applications submitted yet.</p>";
      return;
    }

    appList.innerHTML = "";

    appsSnap.forEach((doc) => {
      const app = doc.data();
      const status = app.status || "pending";
      const statusBadge = {
        pending: "<span class='badge pending'>Pending</span>",
        approved: "<span class='badge approved'>Approved</span>",
        rejected: "<span class='badge rejected'>Rejected</span>"
      }[status];

      const card = document.createElement("div");
      card.classList.add("application-card");
      card.innerHTML = `
        <h3>${app.fullName}</h3>
        <p><strong>Email:</strong> ${app.email}</p>
        <p><strong>Phone:</strong> ${app.phone}</p>
        <p><strong>Status:</strong> ${statusBadge}</p>
        <div class="actions">
          <button class="approve-btn" data-id="${doc.id}" ${status === "approved" ? "disabled" : ""}>✅ Approve</button>
          <button class="reject-btn" data-id="${doc.id}" ${status === "rejected" ? "disabled" : ""}>❌ Reject</button>
        </div>
      `;
      appList.appendChild(card);
    });

    document.querySelectorAll(".approve-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-id");
        await db.collection("applications").doc(id).update({ status: "approved" });
        location.reload();
      });
    });

    document.querySelectorAll(".reject-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-id");
        await db.collection("applications").doc(id).update({ status: "rejected" });
        location.reload();
      });
    });
  });
});
