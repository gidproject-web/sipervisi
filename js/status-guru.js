import { auth,db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import { collection,query,where,getDocs,getDoc,doc } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";
onAuthStateChanged(auth,async u=>{if(!u)return;const us=await getDoc(doc(db,"users",u.uid));if(!us.exists())return;
const gid=us.data().referensi_id;const s=await getDocs(query(collection(db,"jadwal"),where("guru_id","==",gid)));
const rows=s.docs.map(d=>({id:d.id,...d.data()}));
document.getElementById("statusGuruBody").innerHTML=rows.length?rows.map((r,i)=>`<tr><td>${i+1}</td><td>${r.tanggal||""}</td><td>${r.mapel||""}</td><td>${r.kelas||""}</td><td><span class="badge">${r.status||"Terjadwal"}</span></td></tr>`).join(""):'<tr><td colspan="5">Belum ada data supervisi.</td></tr>';});
