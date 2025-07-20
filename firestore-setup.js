
/**
 * firestore-setup.js
 * One-time Firestore initialization and structure setup for SoberHouseManager
 */

import { initializeApp } from "firebase/app";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  addDoc
} from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "soberhousemanager-3371d.firebaseapp.com",
  projectId: "soberhousemanager-3371d",
  storageBucket: "soberhousemanager-3371d.appspot.com",
  messagingSenderId: "823636408266",
  appId: "1:823636408266:web:6f953b2ffacc187f2fdd36"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function setupStructure() {
  try {
    const houseId = "test-house-001";
    const houseRef = doc(db, "houses", houseId);
    const houseSnap = await getDoc(houseRef);

    if (!houseSnap.exists()) {
      await setDoc(houseRef, {
        name: "Test House",
        location: "Fort Worth, TX",
        managerId: "test-manager-uid",
        applicationLink: `https://yourdomain.com/apply?houseId=${houseId}`
      });
      console.log("🏠 House created");
    }

    // Add resident under house
    const residentId = "test-resident-001";
    const residentRef = doc(db, "houses", houseId, "residents", residentId);
    const residentSnap = await getDoc(residentRef);

    if (!residentSnap.exists()) {
      await setDoc(residentRef, {
        fullName: "John Doe",
        email: "test.resident@soberhouse.com",
        stripeCustomerId: "cus_test1234",
        paymentFrequency: "monthly",
        amountDue: 600,
        nextDueDate: new Date().toISOString(),
        pastDue: false,
        autoBillingEnabled: true
      });
      console.log("👤 Resident under house created");
    }

    // Also write to global residents collection
    const globalResidentRef = doc(db, "residents", residentId);
    const globalResidentSnap = await getDoc(globalResidentRef);

    if (!globalResidentSnap.exists()) {
      await setDoc(globalResidentRef, {
        fullName: "John Doe",
        email: "test.resident@soberhouse.com",
        stripeCustomerId: "cus_test1234",
        houseId: houseId,
        paymentFrequency: "monthly",
        nextDueDate: new Date().toISOString(),
        pastDue: false,
        autoBillingEnabled: true
      });
      console.log("🌍 Global resident created");
    }

    console.log("✅ Firestore structure initialized.");

  } catch (error) {
    console.error("❌ Error setting up Firestore:", error.message);
  }
}

setupStructure();
