<script>
  async function showAppLinks() {
    const container = document.getElementById("application-links");
    container.innerHTML = "Loading links...";

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
        const id = doc.id;
        const name = doc.data().name;
        const link = `${window.location.origin}/apply.html?house=${id}`;
        html += `<li><strong>${name}</strong>: <a href="${link}" target="_blank">${link}</a></li>`;
      });
      html += "</ul>";
      container.innerHTML = html;
    } catch (err) {
      container.innerHTML = "❌ Error: " + err.message;
    }
  }

  document.getElementById("load-links-btn").addEventListener("click", showAppLinks);
</script>