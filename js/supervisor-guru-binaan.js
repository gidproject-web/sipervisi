import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import { collection,query,where,getDocs,getDoc,doc } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";
onAuthStateChanged(auth,async u=>{if(!u)return;const us=await getDoc(doc(db,"users",u.uid));if(!us.exists())return;const sid=us.data().referensi_id;
const s=await getDocs(query(collection(db,"penugasan"),where("supervisor_id","==",sid)));const rows=s.docs.map(d=>d.data()).filter(x=>String(x.status||"Aktif").toLowerCase()==="aktif");const out=[];
for(const p of rows){const g=await getDoc(doc(db,"guru",p.guru_id));if(g.exists())out.push({id:p.guru_id,...g.data()})}
out.sort((a,b)=>String(a.nama||"").localeCompare(String(b.nama||""),"id"));
document.getElementById("guruBinaanBody").innerHTML=out.length?out.map((g,i)=>`<tr><td>${i+1}</td><td>${g.id}</td><td>${g.nama||""}</td><td>${g.mapel||""}</td><td>${g.email||""}</td><td><span class="badge">${g.status||"Aktif"}</span></td></tr>`).join(""):'<tr><td colspan="6">Belum ada guru binaan.</td></tr>';});
