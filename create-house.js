<script>
  async function createHouse() {
    const houseName = document.getElementById("house-name").value.trim();
    const status = document.getElementById("house-status");

    if (!houseName) {
      status.innerText = "⚠️ House name is required.";
      return;
    }

    const user = firebase.auth().currentUser;
    if (!user) {
      status.innerText = "❌ Not logged in.";
      return;
    }

    try {
      const newHouse = {
        name: houseName,
        ownerId: user.uid,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      await db.collection("houses").add(newHouse);
      status.innerText = "✅ House created!";
      document.getElementById("house-name").value = "";
    } catch (err) {
      status.innerText = "❌ Error creating house: " + err.message;
    }
  }

  document.getElementById("create-house-btn").addEventListener("click", createHouse);
</script>