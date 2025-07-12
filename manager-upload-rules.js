<script>
document.getElementById("upload-rules-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const file = document.getElementById("rules-file").files[0];
  if (!file) return alert("Please choose a file.");

  const user = firebase.auth().currentUser;
  if (!user) return alert("Not logged in");

  const houseId = document.getElementById("upload-house-id").value;
  const storageRef = firebase.storage().ref();
  const fileRef = storageRef.child(`house_rules/${houseId}/${file.name}`);

  try {
    await fileRef.put(file);
    const fileURL = await fileRef.getDownloadURL();

    await db.collection("houses").doc(houseId).update({
      rulesURL: fileURL
    });

    alert("✅ File uploaded and saved successfully!");
  } catch (err) {
    console.error(err);
    alert("❌ Upload failed: " + err.message);
  }
});
</script>