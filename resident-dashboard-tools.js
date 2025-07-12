<script>
  const db = firebase.firestore();
  const auth = firebase.auth();

  async function loadResidentDashboard() {
    const user = auth.currentUser;
    const dashboard = document.getElementById("resident-dashboard");
    if (!user) {
      dashboard.innerHTML = "❌ Not logged in.";
      return;
    }

    try {
      const resDoc = await db.collection("residents").doc(user.uid).get();
      if (!resDoc.exists) {
        dashboard.innerHTML = "Resident data not found.";
        return;
      }

      const data = resDoc.data();
      const { name, currentBalance } = data;

      let html = `<h2>Welcome, ${name}</h2>`;
      html += `<p><strong>Current Rent Balance:</strong> $${currentBalance.toFixed(2)}</p>`;
      html += `<button style="padding:0.5rem 1rem;background:#319795;color:white;border:none;border-radius:5px;">Pay Rent</button>`;
      html += "<h3 style='margin-top:2rem;'>Payment History</h3>";

      const paySnap = await db.collection("payments")
        .where("residentId", "==", user.uid)
        .orderBy("date", "desc")
        .get();

      if (paySnap.empty) {
        html += "<p>No payments found.</p>";
      } else {
        html += "<table style='width:100%;border-collapse:collapse;text-align:left;'>";
        html += "<tr style='background:#ddd;'><th>Date</th><th>Amount</th><th>Status</th></tr>";
        paySnap.forEach(doc => {
          const p = doc.data();
          html += `<tr>
            <td>${new Date(p.date.toDate()).toLocaleDateString()}</td>
            <td>$${p.amount.toFixed(2)}</td>
            <td>${p.status}</td>
          </tr>`;
        });
        html += "</table>";
      }

      dashboard.innerHTML = html;
    } catch (err) {
      dashboard.innerHTML = "❌ Error loading dashboard: " + err.message;
    }
  }

  firebase.auth().onAuthStateChanged(user => {
    if (user) loadResidentDashboard();
  });
</script>