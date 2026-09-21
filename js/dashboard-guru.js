import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import { doc,getDoc,collection,query,where,getDocs } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";
const $=id=>document.getElementById(id);
const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
onAuthStateChanged(auth, async user=>{
  if(!user)return;
  try{
    $("statusDashboardGuru").textContent="Memuat data...";
    const u=await getDoc(doc(db,"users",user.uid)); if(!u.exists()) throw new Error("Profil tidak ditemukan.");
    const p=u.data(), gid=p.referensi_id;
    const g=await getDoc(doc(db,"guru",gid)), gd=g.exists()?g.data():{};
    $("namaGuruDashboard").textContent=gd.nama||p.nama||user.email;
    $("idGuruDashboard").textContent=gid||"-"; $("mapelGuruDashboard").textContent=gd.mapel||"Belum diisi";
    const q=query(collection(db,"penugasan"),where("guru_id","==",gid)); const ps=await getDocs(q);
    const arr=ps.docs.map(d=>({id:d.id,...d.data()})).filter(x=>String(x.status||"Aktif").toLowerCase()==="aktif");
    if(!arr.length){$("namaSupervisor").textContent="Belum ada supervisor";$("infoSupervisor").innerHTML='<div class="empty-state">Belum ada penugasan aktif.</div>'}
    else{const a=arr[0], s=await getDoc(doc(db,"supervisors",a.supervisor_id)); const sd=s.exists()?s.data():{};
      $("namaSupervisor").textContent=sd.nama||a.supervisor_id;
      $("infoSupervisor").innerHTML=`<div class="supervisor-info-card"><strong>${esc(sd.nama||a.supervisor_id)}</strong><div>${esc(sd.jabatan||"Supervisor Akademik")}</div><small>${esc(a.tahun_pelajaran||"")} ${a.semester?"• "+esc(a.semester):""}</small></div>`;
    }
    $("statusDashboardGuru").textContent="Data berhasil dimuat.";
  }catch(e){console.error(e);$("statusDashboardGuru").textContent="Gagal memuat data: "+e.message}
});
