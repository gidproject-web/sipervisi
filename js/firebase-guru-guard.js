import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";
onAuthStateChanged(auth, async user => {
  if (!user) return location.href = "../index.html";
  const snap = await getDoc(doc(db,"users",user.uid));
  const role = snap.exists() ? String(snap.data().role || "").toLowerCase() : "";
  if (role !== "guru") location.href = "../index.html";
});
