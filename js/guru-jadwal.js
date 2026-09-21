import { auth,db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import { collection,query,where,getDocs,getDoc,doc } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";
onAuthStateChanged(auth,async u=>{if(!u)return;const us=await getDoc(doc(db,"users",u.uid));if(!us.exists())return;
const gid=us.data().referensi_id;const s=await getDocs(query(collection(db,"jadwal"),where("guru_id","==",gid)));
const rows=s.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>String(a.tanggal||"").localeCompare(String(b.tanggal||"")));const out=[];
for(const r of rows){const sp=await getDoc(doc(db,"supervisors",r.supervisor_id));out.push({...r,supervisor_nama:sp.exists()?sp.data().nama:r.supervisor_id})}
document.getElementById("jadwalGuruBody").innerHTML=out.length?out.map((r,i)=>`<tr><td>${i+1}</td><td>${r.tanggal||""}</td><td>${r.jam||""}</td><td>${r.supervisor_nama}</td><td>${r.kelas||""}</td><td>${r.mapel||""}</td><td>${r.materi||""}</td><td><span class="badge">${r.status||"Terjadwal"}</span></td></tr>`).join(""):'<tr><td colspan="8">Belum ada jadwal supervisi.</td></tr>';});
