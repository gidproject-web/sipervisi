import { db } from "./firebase-config.js";
import { collection,getDocs,getDoc,doc } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";
const $=id=>document.getElementById(id);
(async()=>{try{
  const snap=await getDocs(collection(db,"jadwal"));
  const rows=snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>String(a.tanggal||"").localeCompare(String(b.tanggal||"")));
  const out=[];
  for(const r of rows){
    const [s,g]=await Promise.all([getDoc(doc(db,"supervisors",r.supervisor_id)),getDoc(doc(db,"guru",r.guru_id))]);
    out.push({...r,supervisor_nama:s.exists()?s.data().nama:r.supervisor_id,guru_nama:g.exists()?g.data().nama:r.guru_id});
  }
  $("totalJadwalAdmin").textContent=out.length;
  $("jadwalAdminBody").innerHTML=out.length?out.map((r,i)=>`<tr><td>${i+1}</td><td>${r.tanggal||""}</td><td>${r.jam||""}</td><td>${r.supervisor_nama}</td><td>${r.guru_nama}</td><td>${r.kelas||""}</td><td>${r.mapel||""}</td><td>${r.jenis_instrumen==="bk"?"Guru BK":"Pembelajaran"}</td><td><span class="badge">${r.status||"Terjadwal"}</span></td></tr>`).join(""):'<tr><td colspan="9">Belum ada jadwal.</td></tr>';
}catch(e){console.error(e);$("jadwalAdminBody").innerHTML=`<tr><td colspan="9">${e.message}</td></tr>`;}})();
