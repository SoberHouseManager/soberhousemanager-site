<script>
  const urlParams = new URLSearchParams(window.location.search);
  const houseId = urlParams.get("house");

  if (houseId) {
    localStorage.setItem("houseId", houseId);
  }

  async function submitApplication(event) {
    event.preventDefault();

    const storedHouseId = localStorage.getItem("houseId");
    if (!storedHouseId) {
      alert("❌ House ID not found. Please use the proper application link.");
      return;
    }

    const name = document.getElementById("app-name").value.trim();
    const email = document.getElementById("app-email").value.trim();
    const phone = document.getElementById("app-phone").value.trim();
    const message = document.getElementById("app-message").value.trim();

    if (!name || !email || !phone || !message) {
      alert("⚠️ All fields are required.");
      return;
    }

    try {
      await db.collection("applications").add({
        houseId: storedHouseId,
        name,
        email,
        phone,
        message,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      alert("✅ Application submitted successfully.");
      document.getElementById("application-form").reset();
    } catch (err) {
      alert("❌ Error submitting application: " + err.message);
    }
  }

  document.getElementById("application-form").addEventListener("submit", submitApplication);
</script>