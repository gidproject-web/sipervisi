
import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";
import { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_BUCKET } from "./supabase-config.js";

const $ = id => document.getElementById(id);
const jadwalId = new URLSearchParams(location.search).get("jadwal_id");

function esc(v=""){
  return String(v ?? "").replace(/[&<>"']/g,m=>({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[m]));
}

function storageHeaders(extra={}){
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    ...extra
  };
}

async function createSignedUrl(path,expiresIn=3600){
  const url=`${SUPABASE_URL}/storage/v1/object/sign/${SUPABASE_BUCKET}/${encodeURI(path)}`;
  const res=await fetch(url,{
    method:"POST",
    headers:storageHeaders({"Content-Type":"application/json"}),
    body:JSON.stringify({expiresIn})
  });
  if(!res.ok) throw new Error(await res.text());
  const data=await res.json();
  const signed=data.signedURL||data.signedUrl||"";
  return signed.startsWith("http") ? signed : `${SUPABASE_URL}/storage/v1${signed}`;
}

async function load(){
  if(!jadwalId) throw new Error("jadwal_id tidak ditemukan.");

  const j=await getDoc(doc(db,"jadwal",jadwalId));
  if(!j.exists()) throw new Error("Jadwal tidak ditemukan.");
  const jadwal={id:j.id,...j.data()};

  const s=await getDoc(doc(db,"supervisi",jadwalId));
  const supervisi=s.exists()?s.data():{};
  const dokumentasi=Array.isArray(supervisi.dokumentasi)?supervisi.dokumentasi:[];

  const [g,sp]=await Promise.all([
    jadwal.guru_id ? getDoc(doc(db,"guru",jadwal.guru_id)) : Promise.resolve(null),
    jadwal.supervisor_id ? getDoc(doc(db,"supervisors",jadwal.supervisor_id)) : Promise.resolve(null)
  ]);

  const guruNama=g?.exists()?g.data().nama:(jadwal.guru_id||"-");
  const supervisorNama=sp?.exists()?sp.data().nama:(jadwal.supervisor_id||"-");

  const photos=[];
  for(let i=0;i<dokumentasi.length;i++){
    const x=dokumentasi[i];
    let url="";
    try{ url=await createSignedUrl(x.storage_path,3600); }catch(e){ console.warn(e); }
    photos.push({
      no:i+1,
      url,
      kategori:x.kategori||"Dokumentasi",
      keterangan:x.keterangan||""
    });
  }

  render({jadwal,guruNama,supervisorNama,photos});
}

function photoCell(p){
  if(!p) return `<div class="photo-card empty"></div>`;
  return `
    <div class="photo-card">
      <div class="photo-frame">
        ${p.url
          ? `<img src="${esc(p.url)}" alt="Foto ${p.no}">`
          : `<div class="photo-missing">Foto tidak dapat dimuat</div>`}
      </div>
      <div class="caption">
        <b>Foto ${p.no} — ${esc(p.kategori)}</b>
        <span>${esc(p.keterangan)}</span>
      </div>
    </div>
  `;
}

function render({jadwal,guruNama,supervisorNama,photos}){
  const pages=[];
  for(let i=0;i<photos.length;i+=6){
    const chunk=photos.slice(i,i+6);
    while(chunk.length<6) chunk.push(null);

    pages.push(`
      <section class="sheet">
        <header class="doc-header">
          <h1>LAMPIRAN DOKUMENTASI SUPERVISI</h1>
          <div class="meta-grid">
            <div><b>Guru</b><span>: ${esc(guruNama)}</span></div>
            <div><b>Supervisor</b><span>: ${esc(supervisorNama)}</span></div>
            <div><b>Tanggal</b><span>: ${esc(jadwal.tanggal||"-")}</span></div>
            <div><b>Mapel/Layanan</b><span>: ${esc(jadwal.mapel||"-")}</span></div>
          </div>
        </header>

        <div class="photo-grid">
          ${chunk.map(photoCell).join("")}
        </div>
      </section>
    `);
  }

  $("printContent").innerHTML=pages.length
    ? pages.join("")
    : `<section class="sheet"><header class="doc-header"><h1>LAMPIRAN DOKUMENTASI SUPERVISI</h1></header><p>Belum ada dokumentasi.</p></section>`;

  $("loadingText").style.display="none";
  $("btnPrint").disabled=false;
}

$("btnPrint").addEventListener("click",()=>window.print());

onAuthStateChanged(auth,async user=>{
  if(!user){
    $("loadingText").textContent="Sesi login tidak ditemukan.";
    return;
  }
  try{
    await load();
  }catch(e){
    console.error(e);
    $("loadingText").textContent="Gagal memuat dokumentasi: "+e.message;
  }
});
