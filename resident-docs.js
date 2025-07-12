<script>
  async function loadDocumentsTab() {
    const tab = document.getElementById("docs-tab");
    tab.innerHTML = "Loading documents...";

    const user = firebase.auth().currentUser;
    if (!user) {
      tab.innerHTML = "❌ Not logged in.";
      return;
    }

    try {
      const resDoc = await db.collection("residents").doc(user.uid).get();
      if (!resDoc.exists) {
        tab.innerHTML = "❌ Resident not found.";
        return;
      }

      const houseId = resDoc.data().houseId;
      const docsSnap = await db.collection("documents").where("houseId", "==", houseId).get();

      if (docsSnap.empty) {
        tab.innerHTML = "No documents found for your house.";
        return;
      }

      let html = "<ul>";
      docsSnap.forEach(doc => {
        const d = doc.data();
        html += `<li><a href="${d.url}" target="_blank">${d.name}</a></li>`;
      });
      html += "</ul>";
      tab.innerHTML = html;
    } catch (err) {
      tab.innerHTML = "❌ Error loading documents: " + err.message;
    }
  }

  document.getElementById("show-docs").addEventListener("click", () => {
    document.getElementById("resident-dashboard").style.display = "none";
    document.getElementById("docs-tab").style.display = "block";
    loadDocumentsTab();
  });

  document.getElementById("show-dashboard").addEventListener("click", () => {
    document.getElementById("docs-tab").style.display = "none";
    document.getElementById("resident-dashboard").style.display = "block";
  });
</script>