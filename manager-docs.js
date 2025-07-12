<script>
  async function uploadDocument() {
    const fileInput = document.getElementById("doc-file");
    const nameInput = document.getElementById("doc-name");
    const statusBox = document.getElementById("upload-status");

    const file = fileInput.files[0];
    const docName = nameInput.value.trim();

    if (!file || !docName) {
      statusBox.innerText = "⚠️ Please provide both name and file.";
      return;
    }

    const user = firebase.auth().currentUser;
    if (!user) {
      statusBox.innerText = "❌ Not logged in.";
      return;
    }

    try {
      // Get manager's house (assumes one house per manager for now)
      const houseSnap = await db.collection("houses").where("managerId", "==", user.uid).limit(1).get();
      if (houseSnap.empty) {
        statusBox.innerText = "❌ No house assigned to this manager.";
        return;
      }

      const houseId = houseSnap.docs[0].id;
      const storageRef = firebase.storage().ref();
      const fileRef = storageRef.child(`documents/${houseId}/${file.name}`);
      await fileRef.put(file);
      const url = await fileRef.getDownloadURL();

      await db.collection("documents").add({
        houseId,
        name: docName,
        url,
        uploadedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      statusBox.innerText = "✅ Document uploaded successfully!";
      fileInput.value = "";
      nameInput.value = "";
    } catch (err) {
      statusBox.innerText = "❌ Upload error: " + err.message;
    }
  }

  document.getElementById("upload-doc-btn").addEventListener("click", uploadDocument);
</script>