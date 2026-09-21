import { downloadWord, printPdf } from "./export-helper.js";
import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import { getDoc, doc } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";
import { resolveGuruIdForUser } from "./dual-role-helper.js";
import { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_BUCKET } from "./supabase-config.js";

const $=id=>document.getElementById(id);
const jadwalId=new URLSearchParams(location.search).get("jadwal_id");
let jadwal={}, hasil={}, guru={}, supervisor={};

function esc(v=""){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));}
function nl(v=""){return esc(v).replace(/\n/g,"<br>");}

async function createSupabaseSignedUrl(path, expiresIn=3600){
  if(!path) return "";
  const res=await fetch(`${SUPABASE_URL}/storage/v1/object/sign/${SUPABASE_BUCKET}/${encodeURI(path)}`,{
    method:"POST",
    headers:{
      apikey:SUPABASE_ANON_KEY,
      Authorization:`Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type":"application/json"
    },
    body:JSON.stringify({expiresIn})
  });
  if(!res.ok) return "";
  const d=await res.json();
  const signed=d.signedURL||d.signedUrl||"";
  return signed.startsWith("http")?signed:(signed?`${SUPABASE_URL}/storage/v1${signed}`:"");
}

function fmtDate(v=""){if(!v)return "-";const p=v.split("-");return p.length===3?`${p[2]}-${p[1]}-${p[0]}`:v;}

function renderPerencanaan(d){
  if(!d){$("bagianPerencanaan").style.display="none";return;}
  let last="";
  const rows=(d.items||[]).map(x=>{
    let g="";
    if(x.kelompok!==last){g=`<tr class="group-row"><td colspan="4">${esc(x.kelompok)}</td></tr>`;last=x.kelompok;}
    return g+`<tr><td>${x.no||""}</td><td>${esc(x.aspek)}</td><td>${nl(x.umpan_balik)}</td><td>${x.skor||""}</td></tr>`;
  }).join("");
  $("perencanaanReadBody").innerHTML=rows;
  $("nilaiPerencanaan").textContent=Number(d.nilai||0).toFixed(2);
  $("kelebihanRead").innerHTML=nl(d.kelebihan||"-");
  $("tingkatkanRead").innerHTML=nl(d.perlu_ditingkatkan||"-");
  $("rekomendasiRead").innerHTML=nl(d.rekomendasi||"-");
}

function renderObservasi(d){
  if(!d){$("bagianObservasi").style.display="none";return;}
  let last="";
  const rows=(d.items||[]).map(x=>{
    let g="";
    if(x.kelompok!==last){g=`<tr class="group-row"><td colspan="4">${esc(x.kelompok)}</td></tr>`;last=x.kelompok;}
    return g+`<tr><td>${x.no||""}</td><td>${esc(x.aspek)}</td><td>${nl(x.bukti)}</td><td>${nl(x.catatan)}</td></tr>`;
  }).join("");
  $("observasiReadBody").innerHTML=rows;
  $("pelajaranRead").innerHTML=nl(d.pelajaran||"-");
  $("belumRead").innerHTML=nl(d.belum_memuaskan||"-");
  $("tindakRead").innerHTML=nl(d.tindak_lanjut||"-");
}

function renderBK(d){
  if(!d){$("bagianBK").style.display="none";return;}
  let last="";
  const rows=(d.items||[]).map(x=>{
    let g="";
    if(x.kelompok!==last){g=`<tr class="group-row"><td colspan="4">${esc(x.kelompok)}</td></tr>`;last=x.kelompok;}
    return g+`<tr><td>${x.no||""}</td><td>${esc(x.aspek)}</td><td>${x.skor??""}</td><td>${nl(x.catatan)}</td></tr>`;
  }).join("");
  $("bkReadBody").innerHTML=rows;
  $("nilaiBKRead").textContent=Number(d.nilai_akhir||0).toFixed(2);
  $("kategoriBKRead").textContent=d.kategori||"-";
  $("rekGuruBKRead").innerHTML=nl(d.rekomendasi_guru||"-");
  $("rekKepalaBKRead").innerHTML=nl(d.rekomendasi_kepala||"-");
  $("catatanBKRead").innerHTML=nl(d.catatan||"-");
}


async function renderDokumentasi(items=[]){
  const section=$("bagianDokumentasi");
  const box=$("dokumentasiReadGallery");
  if(!items.length){
    section.style.display="none";
    return;
  }
  const cards=[];
  for(let i=0;i<items.length;i++){
    const x=items[i];
    let url=x.url||"";
    if(!url && x.storage_provider==="supabase" && x.storage_path){
      url=await createSupabaseSignedUrl(x.storage_path,3600);
    }
    cards.push(`
      <article class="doc-card">
        ${url?`<a href="${esc(url)}" target="_blank" rel="noopener"><img src="${esc(url)}" alt="Dokumentasi supervisi ${i+1}" loading="lazy"></a>`:""}
        <div class="doc-card-body">
          <div class="doc-photo-number">Foto ${i+1}</div>
          <strong>${esc(x.kategori||"Dokumentasi")}</strong>
          <p>${nl(x.keterangan||"")}</p>
        </div>
      </article>`);
  }
  box.innerHTML=cards.join("");
}

async function documentHtml(){
  const p=hasil.perencanaan, o=hasil.observasi, b=hasil.bk, d=Array.isArray(hasil.dokumentasi)?hasil.dokumentasi:[];
  const css=`<style>
  body{font-family:Arial,sans-serif;font-size:11pt;line-height:1.4}h1{text-align:center;font-size:16pt}
  h2{margin-top:24px;font-size:13pt}table{width:100%;border-collapse:collapse}th,td{border:1px solid #222;padding:6px;vertical-align:top}
  th,.group{background:#eee}.meta td{border:0;padding:2px 4px}
  </style>`;
  let html=`<!doctype html><html><head><meta charset="utf-8">${css}</head><body><h1>HASIL SUPERVISI AKADEMIK</h1>
  <table class="meta"><tr><td>Nama Guru</td><td>: ${esc(guru.nama||"")}</td></tr><tr><td>Supervisor</td><td>: ${esc(supervisor.nama||"")}</td></tr>
  <tr><td>Tanggal</td><td>: ${esc(fmtDate(jadwal.tanggal||""))}</td></tr><tr><td>Kelas</td><td>: ${esc(jadwal.kelas||"")}</td></tr>
  <tr><td>Mata Pelajaran/Layanan</td><td>: ${esc(jadwal.mapel||"")}</td></tr><tr><td>Materi/Topik</td><td>: ${esc(jadwal.materi||"")}</td></tr></table>`;

  if(p){
    let last="";
    html+=`<h2>Perencanaan Pembelajaran — Nilai ${Number(p.nilai||0).toFixed(2)}</h2><table><tr><th>No</th><th>Aspek</th><th>Umpan Balik</th><th>Skor</th></tr>`;
    for(const x of (p.items||[])){if(x.kelompok!==last){html+=`<tr><td colspan="4" class="group"><b>${esc(x.kelompok)}</b></td></tr>`;last=x.kelompok;}html+=`<tr><td>${x.no||""}</td><td>${esc(x.aspek)}</td><td>${nl(x.umpan_balik)}</td><td>${x.skor||""}</td></tr>`;}
    html+=`</table><p><b>Kelebihan:</b><br>${nl(p.kelebihan||"-")}</p><p><b>Hal yang perlu ditingkatkan:</b><br>${nl(p.perlu_ditingkatkan||"-")}</p><p><b>Rekomendasi:</b><br>${nl(p.rekomendasi||"-")}</p>`;
  }
  if(o){
    let last="";
    html+=`<h2>Observasi Implementasi dan Refleksi</h2><table><tr><th>No</th><th>Aspek</th><th>Bukti Pembelajaran</th><th>Catatan</th></tr>`;
    for(const x of (o.items||[])){if(x.kelompok!==last){html+=`<tr><td colspan="4" class="group"><b>${esc(x.kelompok)}</b></td></tr>`;last=x.kelompok;}html+=`<tr><td>${x.no||""}</td><td>${esc(x.aspek)}</td><td>${nl(x.bukti)}</td><td>${nl(x.catatan)}</td></tr>`;}
    html+=`</table><p><b>Pelajaran yang diperoleh:</b><br>${nl(o.pelajaran||"-")}</p><p><b>Hal yang belum memuaskan:</b><br>${nl(o.belum_memuaskan||"-")}</p><p><b>Rencana tindak lanjut:</b><br>${nl(o.tindak_lanjut||"-")}</p>`;
  }
  if(b){
    let last="";
    html+=`<h2>Supervisi Guru BK — Nilai ${Number(b.nilai_akhir||0).toFixed(2)} (${esc(b.kategori||"")})</h2><table><tr><th>No</th><th>Aspek</th><th>Skor</th><th>Catatan/Bukti</th></tr>`;
    for(const x of (b.items||[])){if(x.kelompok!==last){html+=`<tr><td colspan="4" class="group"><b>${esc(x.kelompok)}</b></td></tr>`;last=x.kelompok;}html+=`<tr><td>${x.no||""}</td><td>${esc(x.aspek)}</td><td>${x.skor??""}</td><td>${nl(x.catatan)}</td></tr>`;}
    html+=`</table><p><b>Rekomendasi kepada Guru:</b><br>${nl(b.rekomendasi_guru||"-")}</p><p><b>Rekomendasi kepada Kepala:</b><br>${nl(b.rekomendasi_kepala||"-")}</p><p><b>Catatan:</b><br>${nl(b.catatan||"-")}</p>`;
  }

  if(d.length){
    html+=`<h2>Lampiran Dokumentasi Supervisi</h2>`;
    for(let i=0;i<d.length;i++){
      const x=d[i];
      let fotoUrl=x.url||"";
      if(!fotoUrl && x.storage_provider==="supabase" && x.storage_path){
        fotoUrl=await createSupabaseSignedUrl(x.storage_path,3600);
      }
      html+=`<div style="page-break-inside:avoid;margin:0 0 22px">
        ${fotoUrl?`<img src="${esc(fotoUrl)}" style="max-width:100%;max-height:520px;display:block;margin:0 auto 8px">`:""}
        <p><b>Foto ${i+1} — ${esc(x.kategori||"Dokumentasi")}</b><br>${nl(x.keterangan||"")}</p>
      </div>`;
    }
  }

  return html+"</body></html>";
}

$("btnUnduhWord")?.addEventListener("click",async()=>{
  const btn=$("btnUnduhWord");
  btn.disabled=true;
  const old=btn.textContent;
  btn.textContent="Menyiapkan Word...";
  try{
    const html=await documentHtml();
    downloadWord(`Hasil_Supervisi_${guru.nama||jadwalId}.doc`,html);
  }finally{
    btn.disabled=false;
    btn.textContent=old;
  }
});
$("btnCetakPdf")?.addEventListener("click",async()=>{
  const btn=$("btnCetakPdf");
  btn.disabled=true;
  const old=btn.textContent;
  btn.textContent="Menyiapkan PDF...";
  try{
    const html=await documentHtml();
    printPdf(html,"Hasil Supervisi Akademik");
  }finally{
    setTimeout(()=>{btn.disabled=false;btn.textContent=old;},1200);
  }
});

onAuthStateChanged(auth, async user=>{
  if(!user)return;
  try{
    if(!jadwalId)throw new Error("jadwal_id tidak ditemukan.");
    const us=await getDoc(doc(db,"users",user.uid));if(!us.exists())throw new Error("Profil pengguna tidak ditemukan.");
    const guruId=await resolveGuruIdForUser({uid:user.uid,...us.data()});
    if(!guruId)throw new Error("Akun ini belum terhubung sebagai guru.");

    const [j,h]=await Promise.all([getDoc(doc(db,"jadwal",jadwalId)),getDoc(doc(db,"supervisi",jadwalId))]);
    if(!j.exists())throw new Error("Jadwal tidak ditemukan.");
    if(!h.exists())throw new Error("Hasil supervisi belum tersedia.");

    jadwal={id:j.id,...j.data()};
    if(jadwal.guru_id!==guruId)throw new Error("Anda tidak memiliki akses ke hasil supervisi ini.");
    hasil={id:h.id,...h.data()};

    const [g,s]=await Promise.all([getDoc(doc(db,"guru",jadwal.guru_id)),getDoc(doc(db,"supervisors",jadwal.supervisor_id))]);
    guru=g.exists()?g.data():{};supervisor=s.exists()?s.data():{};

    $("detailGuru").textContent=guru.nama||jadwal.guru_id;
    $("detailSupervisor").textContent=supervisor.nama||jadwal.supervisor_id;
    $("detailTanggal").textContent=fmtDate(jadwal.tanggal);
    $("detailKelas").textContent=jadwal.kelas||"-";
    $("detailMapel").textContent=jadwal.mapel||"-";
    $("detailMateri").textContent=jadwal.materi||"-";
    $("detailStatus").textContent=jadwal.status||hasil.status||"-";

    if(hasil.perencanaan)renderPerencanaan(hasil.perencanaan);else $("bagianPerencanaan").style.display="none";
    if(hasil.observasi)renderObservasi(hasil.observasi);else $("bagianObservasi").style.display="none";
    if(hasil.bk)renderBK(hasil.bk);else $("bagianBK").style.display="none";
    await renderDokumentasi(Array.isArray(hasil.dokumentasi)?hasil.dokumentasi:[]);
  }catch(e){console.error(e);$("detailMessage").textContent=e.message;}
});
