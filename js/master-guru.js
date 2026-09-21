import { db } from "./firebase-config.js";
import { collection,getDocs,query,orderBy } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";
const tbody=document.getElementById("guruTableBody");
(async()=>{try{const s=await getDocs(collection(db,"guru"));const rows=s.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>String(a.nama||"").localeCompare(String(b.nama||""),"id"));tbody.innerHTML=rows.map((r,i)=>`<tr><td>${i+1}</td><td>${r.id}</td><td>${r.nama||""}</td><td>${r.email||""}</td><td>${r.mapel||""}</td><td><span class="badge">${r.status||"Aktif"}</span></td></tr>`).join("")}catch(e){tbody.innerHTML=`<tr><td colspan="6">${e.message}</td></tr>`}})();
