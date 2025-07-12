<script>
  async function loadMyHouses() {
    const container = document.getElementById("my-houses");
    container.innerHTML = "Loading houses...";

    const user = firebase.auth().currentUser;
    if (!user) {
      container.innerHTML = "❌ Not logged in.";
      return;
    }

    try {
      const snap = await db.collection("houses").where("ownerId", "==", user.uid).get();
      if (snap.empty) {
        container.innerHTML = "No houses found.";
        return;
      }

      let html = "<ul>";
      snap.forEach(doc => {
        const d = doc.data();
        html += `
          <li style="margin-bottom:1rem;">
            <strong>${d.name}</strong> (ID: ${doc.id})<br/>
            Rename: <input type="text" id="name-${doc.id}" value="${d.name}" style="padding:4px;width:200px;" />
            <button onclick="renameHouse('${doc.id}')">Update</button>
          </li>
        `;
      });
      html += "</ul>";
      container.innerHTML = html;
    } catch (err) {
      container.innerHTML = "❌ Error: " + err.message;
    }
  }

  async function renameHouse(houseId) {
    const input = document.getElementById("name-" + houseId);
    const newName = input.value.trim();
    if (!newName) return;

    try {
      await db.collection("houses").doc(houseId).update({ name: newName });
      alert("✅ Name updated!");
    } catch (err) {
      alert("❌ Error: " + err.message);
    }
  }

  document.getElementById("load-houses-btn").addEventListener("click", loadMyHouses);
</script>