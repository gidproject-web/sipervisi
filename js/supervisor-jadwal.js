import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import {
  collection, query, where, getDocs, getDoc, doc, setDoc, deleteDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

const $ = id => document.getElementById(id);
let supervisorId = "";
let penugasanMap = new Map();
let jadwalCache = new Map();

function esc(v=""){return String(v).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));}

async function loadGuruBinaan(){
  const snap = await getDocs(query(collection(db,"penugasan"), where("supervisor_id","==",supervisorId)));
  const rows = snap.docs.map(d=>({id:d.id,...d.data()}))
    .filter(x=>String(x.status||"Aktif").toLowerCase()==="aktif");
  const out=[];
  for(const p of rows){
    const g=await getDoc(doc(db,"guru",p.guru_id));
    if(g.exists()) out.push({...p,guru_nama:g.data().nama||p.guru_id,mapel:g.data().mapel||""});
  }
  out.sort((a,b)=>a.guru_nama.localeCompare(b.guru_nama,"id"));
  penugasanMap = new Map(out.map(x=>[x.id,x]));
  $("penugasan_id").innerHTML = '<option value="">Pilih guru binaan</option>' +
    out.map(x=>`<option value="${esc(x.id)}">${esc(x.guru_nama)}</option>`).join("");
}

$("penugasan_id")?.addEventListener("change",()=>{
  const p=penugasanMap.get($("penugasan_id").value);
  if(p && !$("mapel").value) $("mapel").value=p.mapel||"";
});

function resetForm(){
  $("jadwalForm").reset();
  $("jadwal_id").value="";
  $("btnSimpan").textContent="Simpan Jadwal";
  $("btnBatalEdit").style.display="none";
}

$("btnBatalEdit")?.addEventListener("click", resetForm);

$("jadwalForm")?.addEventListener("submit",async e=>{
  e.preventDefault();
  const p=penugasanMap.get($("penugasan_id").value);
  if(!p) return alert("Pilih guru binaan.");
  const id=$("jadwal_id").value||("JDW"+Date.now());
  await setDoc(doc(db,"jadwal",id),{
    jadwal_id:id,
    penugasan_id:p.id,
    supervisor_id:supervisorId,
    guru_id:p.guru_id,
    tahun_pelajaran:p.tahun_pelajaran||"2026/2027",
    semester:p.semester||"Ganjil",
    tanggal:$("tanggal").value,
    jam:$("jam").value,
    kelas:$("kelas").value.trim(),
    mapel:$("mapel").value.trim(),
    materi:$("materi").value.trim(),
    jenis_instrumen:$("jenis_instrumen").value,
    status:"Terjadwal",
    updated_at:serverTimestamp()
  },{merge:true});
  resetForm();
  await loadJadwal();
});

async function loadJadwal(){
  const snap=await getDocs(query(collection(db,"jadwal"),where("supervisor_id","==",supervisorId)));
  const rows=snap.docs.map(d=>({id:d.id,...d.data()}))
    .sort((a,b)=>String(a.tanggal||"").localeCompare(String(b.tanggal||"")));
  jadwalCache=new Map(rows.map(x=>[x.id,x]));
  const out=[];
  for(const r of rows){
    const g=await getDoc(doc(db,"guru",r.guru_id));
    out.push({...r,guru_nama:g.exists()?g.data().nama:r.guru_id});
  }
  $("totalJadwalSupervisor").textContent=out.length;
  $("jadwalSupervisorBody").innerHTML=out.length?out.map((r,i)=>`
    <tr>
      <td>${i+1}</td><td>${esc(r.tanggal||"")}</td><td>${esc(r.jam||"")}</td>
      <td>${esc(r.guru_nama)}</td><td>${esc(r.kelas||"")}</td><td>${esc(r.mapel||"")}</td>
      <td>${esc(r.jenis_instrumen==="bk"?"Guru BK":"Pembelajaran")}</td>
      <td><span class="badge">${esc(r.status||"Terjadwal")}</span></td>
      <td class="action-cell">
        <button class="btn btn-small btn-edit" data-id="${esc(r.id)}">Edit</button>
        <a class="btn btn-small btn-primary-lite" href="supervisi-form.html?jadwal_id=${encodeURIComponent(r.id)}">Isi Supervisi</a>
        <button class="btn btn-small btn-danger btn-hapus" data-id="${esc(r.id)}">Hapus</button>
      </td>
    </tr>`).join(""):'<tr><td colspan="9"><div class="empty-state">Belum ada jadwal. Buat jadwal pertama untuk guru binaan.</div></td></tr>';

  document.querySelectorAll(".btn-edit").forEach(b=>b.onclick=()=>{
    const r=jadwalCache.get(b.dataset.id); if(!r)return;
    $("jadwal_id").value=r.id;
    $("penugasan_id").value=r.penugasan_id||"";
    $("tanggal").value=r.tanggal||"";
    $("jam").value=r.jam||"";
    $("kelas").value=r.kelas||"";
    $("mapel").value=r.mapel||"";
    $("materi").value=r.materi||"";
    $("jenis_instrumen").value=r.jenis_instrumen||"pembelajaran";
    $("btnSimpan").textContent="Perbarui Jadwal";
    $("btnBatalEdit").style.display="inline-block";
    window.scrollTo({top:0,behavior:"smooth"});
  });

  document.querySelectorAll(".btn-hapus").forEach(b=>b.onclick=async()=>{
    if(!confirm("Hapus jadwal ini?"))return;
    await deleteDoc(doc(db,"jadwal",b.dataset.id));
    await loadJadwal();
  });
}

onAuthStateChanged(auth,async user=>{
  if(!user)return;
  try{
    const us=await getDoc(doc(db,"users",user.uid));
    if(!us.exists()) throw new Error("Profil supervisor tidak ditemukan.");
    supervisorId=us.data().referensi_id;
    await loadGuruBinaan();
    await loadJadwal();
  }catch(e){console.error(e);$("jadwalSupervisorMessage").textContent="Gagal memuat: "+e.message;}
});
