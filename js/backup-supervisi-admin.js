import { db } from "./firebase-config.js";
import { collection, getDocs, getDoc, doc } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";
import { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_BUCKET } from "./supabase-config.js";

const $ = id => document.getElementById(id);
let rowsCache = [];

function esc(v=""){
  return String(v ?? "").replace(/[&<>"']/g,m=>({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[m]));
}
function nl(v=""){ return esc(v).replace(/\n/g,"<br>"); }
function fmtDate(v=""){
  if(!v) return "-";
  const p=String(v).split("-");
  return p.length===3 ? `${p[2]}-${p[1]}-${p[0]}` : v;
}
function safeName(v="dokumen"){
  return String(v).replace(/[\\/:*?"<>|]+/g,"-").replace(/\s+/g,"_");
}

async function createSignedUrl(path, expiresIn=3600){
  if(!path) return "";
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/sign/${SUPABASE_BUCKET}/${encodeURI(path)}`,{
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

function docCss(){
  return `<style>
    @page{size:A4;margin:13mm}
    body{font-family:Arial,sans-serif;color:#111;font-size:10.5pt;line-height:1.35}
    h1{text-align:center;font-size:16pt;margin:0 0 14px}
    h2{font-size:13pt;margin:22px 0 9px}
    h3{font-size:11.5pt;margin:15px 0 8px}
    table{width:100%;border-collapse:collapse;margin-bottom:10px}
    th,td{border:1px solid #222;padding:5px;vertical-align:top}
    th{background:#eee}
    .meta td{border:0;padding:2px 4px}
    .group td{background:#e9eef6;font-weight:700}
    .summary p{margin:7px 0}
    .photo{page-break-inside:avoid;margin:0 0 22px}
    .photo img{max-width:100%;max-height:540px;display:block;margin:0 auto 7px;border:1px solid #bbb}
    .signature{display:flex;justify-content:flex-end;margin-top:32px;page-break-inside:avoid}
    .signature>div{width:270px}.sigspace{height:68px}
    .teacher-package{page-break-after:always}
    .teacher-package:last-child{page-break-after:auto}
    .cover{border:2px solid #17375e;padding:22px;border-radius:8px;margin-bottom:18px}
    .cover h1{color:#17375e}
    .muted{color:#555}
    @media print{.teacher-package{page-break-after:always}}
  </style>`;
}

function metaTable(r){
  return `<table class="meta">
    <tr><td>Nama Guru</td><td>: ${esc(r.guru_nama)}</td></tr>
    <tr><td>Supervisor</td><td>: ${esc(r.supervisor_nama)}</td></tr>
    <tr><td>Tanggal</td><td>: ${esc(fmtDate(r.tanggal))}</td></tr>
    <tr><td>Mata Pelajaran/Layanan</td><td>: ${esc(r.mapel||"-")}</td></tr>
    <tr><td>Kelas</td><td>: ${esc(r.kelas||"-")}</td></tr>
    <tr><td>Materi/Topik</td><td>: ${esc(r.materi||"-")}</td></tr>
    <tr><td>Status</td><td>: ${esc(r.status||"-")}</td></tr>
  </table>`;
}

function signature(r){
  return `<div class="signature"><div>
    <p>Lubuklinggau, ................................ 2026</p>
    <p>Supervisor,</p>
    <div class="sigspace"></div>
    <p><b>${esc(r.supervisor_nama)}</b></p>
    <p>NIP. ${esc(r.supervisor_nip||"................................................")}</p>
  </div></div>`;
}

function perencanaanSection(p){
  if(!p) return "";
  let last="", body="";
  for(const x of (p.items||[])){
    if(x.kelompok!==last){
      body+=`<tr class="group"><td colspan="4">${esc(x.kelompok||"")}</td></tr>`;
      last=x.kelompok;
    }
    body+=`<tr><td>${x.no||""}</td><td>${esc(x.aspek||"")}</td><td>${nl(x.umpan_balik||"")}</td><td>${x.skor||""}</td></tr>`;
  }
  return `<h2>A. Umpan Balik Perencanaan Pembelajaran</h2>
    <p>Skala: 1 = hampir tidak ada; 2 = sedikit dan lemah; 3 = cukup; 4 = memadai.</p>
    <table><thead><tr><th>No</th><th>Aspek yang diamati</th><th>Umpan Balik</th><th>Skala</th></tr></thead><tbody>${body}</tbody></table>
    <div class="summary">
      <p><b>Total Skor:</b> ${p.total_skor??"-"} / ${p.skor_maksimal??"-"} &nbsp; <b>Nilai:</b> ${Number(p.nilai||0).toFixed(2)}</p>
      <p><b>Kelebihan:</b><br>${nl(p.kelebihan||"-")}</p>
      <p><b>Hal yang perlu ditingkatkan:</b><br>${nl(p.perlu_ditingkatkan||"-")}</p>
      <p><b>Rekomendasi:</b><br>${nl(p.rekomendasi||"-")}</p>
    </div>`;
}

function observasiSection(o){
  if(!o) return "";
  let last="",body="";
  for(const x of (o.items||[])){
    if(x.kelompok!==last){
      body+=`<tr class="group"><td colspan="4">${esc(x.kelompok||"")}</td></tr>`;
      last=x.kelompok;
    }
    body+=`<tr><td>${x.no||""}</td><td>${esc(x.aspek||"")}</td><td>${nl(x.bukti||"")}</td><td>${nl(x.catatan||"")}</td></tr>`;
  }
  return `<h2>B. Observasi Implementasi dan Refleksi</h2>
    <table><thead><tr><th>No</th><th>Aspek yang diamati</th><th>Bukti Pembelajaran</th><th>Catatan</th></tr></thead><tbody>${body}</tbody></table>
    <div class="summary">
      <h3>Refleksi</h3>
      <p><b>Pelajaran yang diperoleh dan faktor pendukung:</b><br>${nl(o.pelajaran||"-")}</p>
      <p><b>Hal yang belum memuaskan dan faktor penghambat:</b><br>${nl(o.belum_memuaskan||"-")}</p>
      <p><b>Rencana tindak lanjut:</b><br>${nl(o.tindak_lanjut||"-")}</p>
    </div>`;
}

function bkSection(b){
  if(!b) return "";
  let last="",body="";
  for(const x of (b.items||[])){
    if(x.kelompok!==last){
      body+=`<tr class="group"><td colspan="4">${esc(x.kelompok||"")}</td></tr>`;
      last=x.kelompok;
    }
    body+=`<tr><td>${x.no||""}</td><td>${esc(x.aspek||"")}</td><td>${x.skor??""}</td><td>${nl(x.catatan||"")}</td></tr>`;
  }
  return `<h2>A. Hasil Supervisi Guru BK</h2>
    <table><thead><tr><th>No</th><th>Aspek</th><th>Skor</th><th>Bukti/Catatan</th></tr></thead><tbody>${body}</tbody></table>
    <div class="summary">
      <p><b>Nilai Akhir:</b> ${Number(b.nilai_akhir||0).toFixed(2)} &nbsp; <b>Kategori:</b> ${esc(b.kategori||"-")}</p>
      <p><b>Rekomendasi kepada Guru:</b><br>${nl(b.rekomendasi_guru||"-")}</p>
      <p><b>Rekomendasi kepada Kepala:</b><br>${nl(b.rekomendasi_kepala||"-")}</p>
      <p><b>Catatan:</b><br>${nl(b.catatan||"-")}</p>
    </div>`;
}

async function dokumentasiSection(items=[]){
  if(!items.length) return "";
  let html=`<h2>C. Lampiran Dokumentasi Supervisi</h2>`;
  for(let i=0;i<items.length;i++){
    const x=items[i];
    let url=x.url||"";
    if(!url && x.storage_provider==="supabase" && x.storage_path){
      url=await createSignedUrl(x.storage_path,3600);
    }
    html+=`<div class="photo">
      ${url?`<img src="${esc(url)}" alt="Dokumentasi ${i+1}">`:""}
      <p><b>Foto ${i+1} — ${esc(x.kategori||"Dokumentasi")}</b><br>${nl(x.keterangan||"")}</p>
    </div>`;
  }
  return html;
}

async function packageHtml(r){
  const h=r.hasil||{};
  return `<section class="teacher-package">
    <div class="cover">
      <h1>PAKET HASIL SUPERVISI AKADEMIK</h1>
      ${metaTable(r)}
    </div>
    ${h.bk ? bkSection(h.bk) : perencanaanSection(h.perencanaan)+observasiSection(h.observasi)}
    ${await dokumentasiSection(Array.isArray(h.dokumentasi)?h.dokumentasi:[])}
    ${signature(r)}
  </section>`;
}

async function fullDocumentHtml(list,title="BACKUP HASIL SUPERVISI"){
  let body="";
  for(const r of list) body += await packageHtml(r);
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title>${docCss()}</head><body>${body||"<p>Belum ada hasil supervisi.</p>"}</body></html>`;
}

function printHtml(html,title){
  const frame=document.createElement("iframe");
  frame.style.cssText="position:fixed;right:0;bottom:0;width:1px;height:1px;border:0;opacity:0";
  document.body.appendChild(frame);
  const d=frame.contentWindow.document;
  d.open();d.write(html);d.close();d.title=title;
  const imgs=[...d.images];
  Promise.all(imgs.map(img=>img.complete?Promise.resolve():new Promise(res=>{
    img.onload=res;img.onerror=res;
  }))).finally(()=>{
    setTimeout(()=>{
      frame.contentWindow.focus();
      frame.contentWindow.print();
      setTimeout(()=>frame.remove(),5000);
    },700);
  });
}

async function loadData(){
  const [jSnap,hSnap] = await Promise.all([
    getDocs(collection(db,"jadwal")),
    getDocs(collection(db,"supervisi"))
  ]);
  const hasilMap=new Map(hSnap.docs.map(d=>[d.id,{id:d.id,...d.data()}]));
  const rows=[];
  for(const jd of jSnap.docs){
    const j={id:jd.id,...jd.data()};
    const hasil=hasilMap.get(j.id);
    if(!hasil) continue;
    const [g,s]=await Promise.all([
      getDoc(doc(db,"guru",j.guru_id)),
      getDoc(doc(db,"supervisors",j.supervisor_id))
    ]);
    rows.push({
      ...j,
      guru_nama:g.exists()?g.data().nama:j.guru_id,
      supervisor_nama:s.exists()?s.data().nama:j.supervisor_id,
      supervisor_nip:s.exists()?(s.data().nip||""): "",
      hasil
    });
  }
  rows.sort((a,b)=>String(b.tanggal||"").localeCompare(String(a.tanggal||"")));
  rowsCache=rows;
  return rows;
}

function render(rows){
  $("totalHasil").textContent=rows.length;
  $("totalSelesai").textContent=rows.filter(r=>String(r.status||"").toLowerCase()==="selesai").length;
  $("totalDokumentasi").textContent=rows.reduce((n,r)=>n+(Array.isArray(r.hasil?.dokumentasi)?r.hasil.dokumentasi.length:0),0);

  $("backupBody").innerHTML=rows.length?rows.map((r,i)=>`
    <tr>
      <td>${i+1}</td>
      <td>${fmtDate(r.tanggal)}</td>
      <td>${esc(r.guru_nama)}</td>
      <td>${esc(r.supervisor_nama)}</td>
      <td>${esc(r.mapel||"-")}</td>
      <td>${r.hasil?.bk?"Guru BK":"Pembelajaran"}</td>
      <td><span class="badge">${esc(r.status||r.hasil?.status||"-")}</span></td>
      <td>${Array.isArray(r.hasil?.dokumentasi)?r.hasil.dokumentasi.length:0}</td>
      <td><button class="btn btn-small btn-primary-lite btn-print-one" data-id="${esc(r.id)}">Cetak/PDF Paket</button></td>
    </tr>`).join("") :
    '<tr><td colspan="9">Belum ada hasil supervisi yang tersimpan.</td></tr>';

  document.querySelectorAll(".btn-print-one").forEach(btn=>btn.addEventListener("click",async()=>{
    const r=rowsCache.find(x=>x.id===btn.dataset.id);
    if(!r)return;
    btn.disabled=true;
    const old=btn.textContent;btn.textContent="Menyiapkan...";
    try{
      const html=await fullDocumentHtml([r],`Hasil Supervisi ${r.guru_nama}`);
      printHtml(html,`Hasil Supervisi ${r.guru_nama}`);
    }finally{
      setTimeout(()=>{btn.disabled=false;btn.textContent=old;},1200);
    }
  }));
}

function applyFilter(){
  const q=String($("searchBackup").value||"").toLowerCase().trim();
  const status=$("filterStatus").value;
  const rows=rowsCache.filter(r=>{
    const text=`${r.guru_nama} ${r.supervisor_nama} ${r.mapel||""}`.toLowerCase();
    const okQ=!q||text.includes(q);
    const okStatus=!status||String(r.status||r.hasil?.status||"").toLowerCase()===status.toLowerCase();
    return okQ&&okStatus;
  });
  render(rows);
}

$("searchBackup")?.addEventListener("input",applyFilter);
$("filterStatus")?.addEventListener("change",applyFilter);

$("btnPrintAll")?.addEventListener("click",async()=>{
  const selesai=rowsCache.filter(r=>String(r.status||r.hasil?.status||"").toLowerCase()==="selesai");
  if(!selesai.length) return alert("Belum ada supervisi berstatus Selesai.");
  const btn=$("btnPrintAll");btn.disabled=true;
  const old=btn.textContent;btn.textContent="Menyiapkan semua hasil...";
  try{
    const html=await fullDocumentHtml(selesai,"Backup Semua Hasil Supervisi Selesai");
    printHtml(html,"Backup Semua Hasil Supervisi");
  }finally{
    setTimeout(()=>{btn.disabled=false;btn.textContent=old;},1500);
  }
});

(async()=>{
  try{
    const rows=await loadData();
    render(rows);
  }catch(e){
    console.error(e);
    $("backupMessage").textContent="Gagal memuat backup supervisi: "+e.message;
  }
})();
