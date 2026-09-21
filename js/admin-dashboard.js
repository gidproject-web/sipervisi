import { db } from "./firebase-config.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";
const count = async name => (await getDocs(collection(db,name))).size;
(async()=>{
  try{
    document.getElementById("totalGuru").textContent = await count("guru");
    document.getElementById("totalSupervisor").textContent = await count("supervisors");
    document.getElementById("totalPenugasan").textContent = await count("penugasan");
  }catch(e){ console.error(e); }
})();
