import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";
onAuthStateChanged(auth, async user=>{
  if(!user) return location.href="../index.html";
  const s=await getDoc(doc(db,"users",user.uid));
  if(!s.exists() || String(s.data().role||"").toLowerCase()!=="admin") location.href="../index.html";
});
