import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import { doc,getDoc,collection,query,where,getDocs } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";
const $=id=>document.getElementById(id);
const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
onAuthStateChanged(auth, async user=>{
  if(!user) return;
  try{
    $("statusDashboardSupervisor").textContent="Memuat data...";
    const u=await getDoc(doc(db,"users",user.uid)); if(!u.exists()) throw new Error("Profil tidak ditemukan.");
    const p=u.data(), sid=p.referensi_id;
    const s=await getDoc(doc(db,"supervisors",sid));
    const sn=s.exists()?s.data():{};
    $("namaSupervisorDashboard").textContent=sn.nama||p.nama||user.email;
    $("idSupervisorDashboard").textContent=sid||"-";
    const q=query(collection(db,"penugasan"),where("supervisor_id","==",sid));
    const ps=await getDocs(q);
    const akt=ps.docs.map(d=>({id:d.id,...d.data()})).filter(x=>String(x.status||"Aktif").toLowerCase()==="aktif");
    const list=[];
    for(const a of akt){const g=await getDoc(doc(db,"guru",a.guru_id));if(g.exists())list.push({guru_id:a.guru_id,...g.data()})}
    list.sort((a,b)=>String(a.nama||"").localeCompare(String(b.nama||""),"id"));
    $("totalGuruBinaan").textContent=list.length;
    $("daftarGuruBinaan").innerHTML=list.length?list.map((g,i)=>`<div class="guru-binaan-item"><div class="guru-binaan-number">${i+1}</div><div class="guru-binaan-info"><strong>${esc(g.nama||g.guru_id)}</strong><div>${esc(g.mapel||"Mata pelajaran belum diisi")}</div><small>ID Guru: ${esc(g.guru_id)}</small></div></div>`).join(""):`<div class="empty-state">Belum ada guru binaan aktif.</div>`;
    $("statusDashboardSupervisor").textContent="Data berhasil dimuat.";
  }catch(e){console.error(e);$("statusDashboardSupervisor").textContent="Gagal memuat data: "+e.message}
});
