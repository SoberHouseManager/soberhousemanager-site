<script>
  async function loadApplications() {
    const container = document.getElementById("application-list");
    container.innerHTML = "Loading applications...";

    const user = firebase.auth().currentUser;
    if (!user) {
      container.innerHTML = "❌ Not logged in.";
      return;
    }

    try {
      const houseSnap = await db.collection("houses").where("ownerId", "==", user.uid).get();
      if (houseSnap.empty) {
        container.innerHTML = "No houses found for your account.";
        return;
      }

      const houseIds = houseSnap.docs.map(doc => doc.id);
      const houseMap = {};
      houseSnap.forEach(doc => { houseMap[doc.id] = doc.data().name });

      const appSnap = await db.collection("applications")
        .where("houseId", "in", houseIds)
        .orderBy("createdAt", "desc")
        .get();

      if (appSnap.empty) {
        container.innerHTML = "No applications found.";
        return;
      }

      let html = "<ul>";
      appSnap.forEach(doc => {
        const d = doc.data();
        const houseName = houseMap[d.houseId] || "Unknown";
        html += `
          <li style="margin-bottom:1rem;padding:1rem;border:1px solid #ccc;border-radius:6px;">
            <strong>${d.name}</strong> (${d.email}, ${d.phone})<br/>
            <em>House:</em> ${houseName}<br/>
            <em>Message:</em> ${d.message}<br/>
            <small>Submitted: ${d.createdAt?.toDate().toLocaleString() || "Unknown"}</small>
          </li>
        `;
      });
      html += "</ul>";
      container.innerHTML = html;

    } catch (err) {
      container.innerHTML = "❌ Error loading applications: " + err.message;
    }
  }

  document.getElementById("load-applications-btn").addEventListener("click", loadApplications);
</script>