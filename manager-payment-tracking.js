<script>
firebase.auth().onAuthStateChanged(async (user) => {
  if (!user) return;
  const uid = user.uid;

  // Step 1: Get manager's houses
  const housesSnap = await db.collection("houses").where("ownerId", "==", uid).get();
  const houseIds = housesSnap.docs.map(doc => doc.id);

  if (!houseIds.length) {
    document.getElementById("manager-payments").innerHTML = "<p>No houses found for this manager.</p>";
    return;
  }

  // Step 2: Get all residents from these houses
  const resSnap = await db.collection("residents").where("houseId", "in", houseIds).get();
  const paymentsContainer = document.getElementById("manager-payments");
  paymentsContainer.innerHTML = "<h3>Resident Payments</h3>";

  if (resSnap.empty) {
    paymentsContainer.innerHTML += "<p>No residents found.</p>";
    return;
  }

  for (const resDoc of resSnap.docs) {
    const resId = resDoc.id;
    const resData = resDoc.data();
    const paySnap = await db.collection("residents").doc(resId).collection("payments").orderBy("date", "desc").get();

    paySnap.forEach(payDoc => {
      const pay = payDoc.data();
      const payRow = document.createElement("div");
      payRow.style.borderBottom = "1px solid #ccc";
      payRow.style.padding = "8px 0";
      payRow.innerHTML = `
        <strong>${resData.name}</strong> (${resData.houseId})<br>
        $${pay.amount} - ${pay.type} - ${pay.status}<br>
        ${pay.date?.toDate().toLocaleDateString() || "No date"}
      `;
      paymentsContainer.appendChild(payRow);
    });
  }
});
</script>