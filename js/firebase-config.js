import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

// WAJIB: isi nilai di bawah dari Firebase Console:
// Project settings > General > Your apps > SDK setup and configuration > Config
const firebaseConfig = {
  apiKey: "AIzaSyCaIQOEfApHVpq1G9LCuLO_YpEUWLo1Iq4",
  authDomain: "smanpaprima-79e9c.firebaseapp.com",
  projectId: "smanpaprima-79e9c",
  storageBucket: "smanpaprima-79e9c.firebasestorage.app",
  messagingSenderId: "60953995031",
  appId: "1:60953995031:web:f67eebc704279c1f377952"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
