
document.addEventListener("DOMContentLoaded", async () => {
  const auth = firebase.auth();
  const db = firebase.firestore();
  const functions = firebase.app().functions("us-central1");

  const billingSection = document.getElementById("billing-section");

  auth.onAuthStateChanged(async (user) => {
    if (!user) {
      billingSection.innerHTML = "<p>Please log in to view billing options.</p>";
      return;
    }

    const residentId = user.email.replace(/[^a-zA-Z0-9]/g, "_");
    const docRef = db.collection("residents").doc(residentId);
    const doc = await docRef.get();

    if (!doc.exists) {
      billingSection.innerHTML = "<p>No resident data found.</p>";
      return;
    }

    const data = doc.data();

    if (data.status !== "approved") {
      billingSection.innerHTML = "<p>Your account is not yet approved for billing.</p>";
      return;
    }

    if (data.billingLink) {
      billingSection.innerHTML = \`
        <p>✅ Auto-billing has already been set up.</p>
        <a href="\${data.billingLink}" target="_blank" class="btn">Go to Payment Portal</a>
      \`;
      return;
    }

    billingSection.innerHTML = \`
      <p><strong>Monthly Rent:</strong> $${data.rentAmount}</p>
      <p><strong>Billing Frequency:</strong> ${data.frequency}</p>
      <p>💡 <strong>We recommend ACH to lower your total fees.</strong></p>
      <label><input type="radio" name="payMethod" value="ach" checked> Pay by ACH (🏦 Bank Transfer)</label><br>
      <label><input type="radio" name="payMethod" value="card"> Pay by Card (💳 Credit/Debit)</label><br><br>
      <button id="setupBillingBtn" class="btn">Set Up Auto-Billing</button>
    \`;

    document.getElementById("setupBillingBtn").addEventListener("click", async () => {
      const method = document.querySelector('input[name="payMethod"]:checked').value;

      try {
        const createSubscription = functions.httpsCallable("createSubscription");
        const result = await createSubscription({ email: user.email, method });
        window.location.href = result.data.url;
      } catch (err) {
        alert("Error setting up billing: " + err.message);
      }
    });
  });
});
