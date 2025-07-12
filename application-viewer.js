<script>
  async function loadApplications() {
    const appList = document.getElementById("application-list");
    appList.innerHTML = "Loading...";

    const user = firebase.auth().currentUser;
    if (!user) {
      appList.innerHTML = "❌ Not logged in.";
      return;
    }

    try {
      // Step 1: Get all house IDs for this manager
      const housesSnap = await db.collection("houses").where("managerId", "==", user.uid).get();
      const houseIds = housesSnap.docs.map(doc => doc.id);

      if (houseIds.length === 0) {
        appList.innerHTML = "No houses found for this manager.";
        return;
      }

      // Step 2: Get all applications linked to these houses
      const appsSnap = await db.collection("applications")
        .where("houseId", "in", houseIds)
        .orderBy("submittedAt", "desc")
        .get();

      if (appsSnap.empty) {
        appList.innerHTML = "No applications yet.";
        return;
      }

      let html = "<ul style='list-style:none;padding:0;'>";
      appsSnap.forEach(doc => {
        const data = doc.data();
        html += `
          <li style="border:1px solid #ccc; border-radius:8px; margin:10px; padding:15px;">
            <strong>${data.name}</strong><br>
            Email: ${data.email}<br>
            Phone: ${data.phone}<br>
            Status: <strong>${data.status}</strong><br>
            Submitted: ${new Date(data.submittedAt.toDate()).toLocaleString()}<br><br>
            <button onclick="updateStatus('${doc.id}', 'approved')" style="margin-right:10px;">✅ Approve</button>
            <button onclick="updateStatus('${doc.id}', 'rejected')">❌ Reject</button>
          </li>`;
      });
      html += "</ul>";
      appList.innerHTML = html;
    } catch (err) {
      appList.innerHTML = "❌ Error loading applications: " + err.message;
    }
  }

  async function updateStatus(appId, status) {
    try {
      await db.collection("applications").doc(appId).update({ status });
      loadApplications(); // refresh
    } catch (err) {
      alert("Error updating status: " + err.message);
    }
  }

  firebase.auth().onAuthStateChanged(user => {
    if (user) loadApplications();
  });
</script>