import { auth,db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import { collection,query,where,getDocs,getDoc,doc } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";
const $=id=>document.getElementById(id);
onAuthStateChanged(auth,async u=>{if(!u)return;const us=await getDoc(doc(db,"users",u.uid));if(!us.exists())return;
const sid=us.data().referensi_id;const s=await getDocs(query(collection(db,"jadwal"),where("supervisor_id","==",sid)));
const rows=s.docs.map(d=>({id:d.id,...d.data()}));const selesai=rows.filter(x=>String(x.status||"").toLowerCase()==="selesai").length;
$("totalStatus").textContent=rows.length;$("selesaiStatus").textContent=selesai;$("prosesStatus").textContent=rows.length-selesai;
const out=[];for(const r of rows){const g=await getDoc(doc(db,"guru",r.guru_id));out.push({...r,guru_nama:g.exists()?g.data().nama:r.guru_id})}
$("statusSupervisorBody").innerHTML=out.length?out.map((r,i)=>`<tr><td>${i+1}</td><td>${r.tanggal||""}</td><td>${r.guru_nama}</td><td>${r.mapel||""}</td><td><span class="badge">${r.status||"Terjadwal"}</span></td><td><a class="btn btn-small btn-primary-lite" href="supervisi-form.html?jadwal_id=${encodeURIComponent(r.id)}">${String(r.status||"").toLowerCase()==="selesai"?"Lihat / Ekspor":"Isi / Lanjutkan"}</a></td></tr>`).join(""):'<tr><td colspan="6">Belum ada data.</td></tr>';});
