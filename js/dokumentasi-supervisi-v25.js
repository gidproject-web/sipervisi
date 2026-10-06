console.info("SIPERVISI V25 - dokumentasi 6 foto per halaman final aktif");
console.info("SIPERVISI V24 - cetak dokumentasi tabel 6 foto per halaman aktif");
import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import { doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";
import { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_BUCKET } from "./supabase-config.js";

const $ = id => document.getElementById(id);
const jadwalId = new URLSearchParams(location.search).get("jadwal_id");

let userProfile = null;
let jadwal = null;
let dokumentasi = [];
const MAX_PHOTOS = 10;

function esc(v=""){
  return String(v ?? "").replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[m]));
}
function safeName(v="foto"){
  return String(v).toLowerCase()
    .replace(/[^a-z0-9._-]+/g,"-")
    .replace(/-+/g,"-")
    .replace(/^-|-$/g,"")
    .slice(0,80) || "foto";
}
function formatBytes(bytes=0){
  if(bytes < 1024) return bytes + " B";
  if(bytes < 1024*1024) return (bytes/1024).toFixed(1)+" KB";
  return (bytes/(1024*1024)).toFixed(1)+" MB";
}
async function compressImage(file){
  if(!file.type.startsWith("image/")) throw new Error(`${file.name} bukan file gambar.`);
  const bitmap = await createImageBitmap(file);
  const maxSide = 1800;
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();
  const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/jpeg", .84));
  if(!blob) throw new Error(`Gagal memproses ${file.name}.`);
  return blob;
}

function storageHeaders(extra={}){
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    ...extra
  };
}

async function uploadToSupabase(path, blob){
  const url = `${SUPABASE_URL}/storage/v1/object/${SUPABASE_BUCKET}/${encodeURI(path)}`;
  const res = await fetch(url,{
    method:"POST",
    headers: storageHeaders({
      "Content-Type":"image/jpeg",
      "x-upsert":"false"
    }),
    body:blob
  });
  if(!res.ok){
    const msg = await res.text();
    throw new Error(`Supabase upload gagal (${res.status}): ${msg}`);
  }
  return await res.json();
}

async function deleteFromSupabase(path){
  const url = `${SUPABASE_URL}/storage/v1/object/${SUPABASE_BUCKET}/${encodeURI(path)}`;
  const res = await fetch(url,{
    method:"DELETE",
    headers: storageHeaders()
  });
  if(!res.ok && res.status!==404){
    const msg=await res.text();
    throw new Error(`Gagal menghapus file (${res.status}): ${msg}`);
  }
}

async function createSignedUrl(path, expiresIn=3600){
  const url = `${SUPABASE_URL}/storage/v1/object/sign/${SUPABASE_BUCKET}/${encodeURI(path)}`;
  const res = await fetch(url,{
    method:"POST",
    headers: storageHeaders({"Content-Type":"application/json"}),
    body:JSON.stringify({expiresIn})
  });
  if(!res.ok){
    const msg=await res.text();
    throw new Error(`Gagal membuat URL foto (${res.status}): ${msg}`);
  }
  const data=await res.json();
  const signed=data.signedURL || data.signedUrl;
  if(!signed) throw new Error("Signed URL tidak diterima dari Supabase.");
  return signed.startsWith("http") ? signed : `${SUPABASE_URL}/storage/v1${signed}`;
}

async function saveMetadata(){
  await setDoc(doc(db,"supervisi",jadwalId),{
    jadwal_id: jadwalId,
    guru_id: jadwal.guru_id,
    supervisor_id: jadwal.supervisor_id,
    dokumentasi,
    updated_at: serverTimestamp()
  },{merge:true});
}

async function render(){
  $("jumlahDokumentasi").textContent = `${dokumentasi.length} / ${MAX_PHOTOS}`;
  const box = $("dokumentasiGallery");
  if(!dokumentasi.length){
    box.innerHTML = `<div class="doc-empty">Belum ada foto dokumentasi.</div>`;
    return;
  }

  box.innerHTML = dokumentasi.map((x,i)=>`
    <article class="doc-card" id="docCard${i}">
      <div class="doc-img-placeholder">Memuat foto...</div>
      <div class="doc-card-body">
        <div class="doc-photo-number">Foto ${i+1}</div>
        <label>Kategori</label>
        <select class="input doc-category" data-index="${i}">
          ${["Sebelum Supervisi","Saat Pembelajaran","Setelah / Refleksi","Lainnya"].map(v =>
            `<option ${x.kategori===v?"selected":""}>${v}</option>`).join("")}
        </select>
        <label>Keterangan</label>
        <textarea class="input doc-caption" data-index="${i}" rows="3">${esc(x.keterangan||"")}</textarea>
        <div class="doc-meta">${esc(x.nama_file||"foto.jpg")} • ${formatBytes(x.ukuran||0)}</div>
        <div class="button-row">
          <button type="button" class="btn btn-small btn-secondary doc-save" data-index="${i}">Simpan Keterangan</button>
          <button type="button" class="btn btn-small btn-danger doc-delete" data-index="${i}">Hapus</button>
        </div>
      </div>
    </article>
  `).join("");

  for(let i=0;i<dokumentasi.length;i++){
    try{
      const url = await createSignedUrl(dokumentasi[i].storage_path,3600);
      const card=$("docCard"+i);
      const ph=card.querySelector(".doc-img-placeholder");
      ph.outerHTML=`<a href="${esc(url)}" target="_blank" rel="noopener"><img src="${esc(url)}" alt="Dokumentasi supervisi ${i+1}" loading="lazy"></a>`;
    }catch(e){
      console.error(e);
      $("docCard"+i).querySelector(".doc-img-placeholder").textContent="Foto gagal dimuat";
    }
  }

  document.querySelectorAll(".doc-save").forEach(btn => btn.addEventListener("click", async ()=>{
    const i = Number(btn.dataset.index);
    dokumentasi[i].kategori = document.querySelector(`.doc-category[data-index="${i}"]`).value;
    dokumentasi[i].keterangan = document.querySelector(`.doc-caption[data-index="${i}"]`).value.trim();
    await saveMetadata();
    showMessage("Keterangan foto berhasil disimpan.", false);
  }));

  document.querySelectorAll(".doc-delete").forEach(btn => btn.addEventListener("click", async ()=>{
    const i = Number(btn.dataset.index);
    const item = dokumentasi[i];
    if(!confirm(`Hapus Foto ${i+1}?`)) return;
    try{
      if(item.storage_path) await deleteFromSupabase(item.storage_path);
      dokumentasi.splice(i,1);
      await saveMetadata();
      await render();
      showMessage("Foto dokumentasi dihapus.", false);
    }catch(e){
      console.error(e);
      showMessage("Gagal menghapus foto: "+e.message,true);
    }
  }));
}

function showMessage(message,isError=false){
  const el=$("dokumentasiMessage");
  el.textContent=message;
  el.style.color=isError?"#b42318":"#25633e";
}

async function uploadPhotos(){
  const input = $("dokumentasiFiles");
  const files = [...(input.files||[])];
  if(!files.length) return alert("Pilih minimal satu foto.");
  if(dokumentasi.length + files.length > MAX_PHOTOS){
    return alert(`Maksimal ${MAX_PHOTOS} foto per kegiatan supervisi. Saat ini sudah ada ${dokumentasi.length}.`);
  }
  const kategori = $("dokumentasiKategori").value;
  const keterangan = $("dokumentasiKeterangan").value.trim();
  const btn = $("btnUploadDokumentasi");
  btn.disabled = true;

  try{
    for(let i=0;i<files.length;i++){
      const file=files[i];
      showMessage(`Mengunggah ${i+1} dari ${files.length}: ${file.name} ...`,false);
      const blob = await compressImage(file);
      const stamp = Date.now()+"_"+i;
      const path = `${jadwalId}/dokumentasi/${stamp}_${safeName(file.name.replace(/\.[^.]+$/,""))}.jpg`;
      await uploadToSupabase(path,blob);
      dokumentasi.push({
        id:"DOC"+stamp,
        kategori,
        keterangan,
        nama_file:file.name,
        ukuran:blob.size,
        storage_path:path,
        storage_provider:"supabase",
        uploaded_at:new Date().toISOString()
      });
      await saveMetadata();
      await render();
    }
    input.value="";
    $("dokumentasiKeterangan").value="";
    showMessage("Foto dokumentasi berhasil diunggah ke Supabase.",false);
  }catch(e){
    console.error(e);
    showMessage("Upload gagal: "+e.message,true);
  }finally{
    btn.disabled=false;
  }
}


async function dokumentasiPrintHtml(){
  const photoItems=[];

  for(let i=0;i<dokumentasi.length;i++){
    const x=dokumentasi[i];
    let url="";
    try{
      url=await createSignedUrl(x.storage_path,3600);
    }catch(e){
      console.warn("Gagal membuat signed URL foto",i+1,e);
    }

    photoItems.push({
      no:i+1,
      url,
      kategori:x.kategori||"Dokumentasi",
      keterangan:x.keterangan||""
    });
  }

  const pages=[];
  for(let i=0;i<photoItems.length;i+=6){
    const six=photoItems.slice(i,i+6);
    while(six.length<6) six.push(null);

    const cell = (p)=>{
      if(!p) return `<td class="photo-cell empty"></td>`;
      return `
        <td class="photo-cell">
          <div class="photo-box">
            ${p.url
              ? `<img src="${esc(p.url)}" alt="Foto ${p.no}">`
              : `<div class="no-photo">Foto tidak dapat dimuat</div>`}
          </div>
          <div class="caption">
            <b>Foto ${p.no} — ${esc(p.kategori)}</b>
            <div>${esc(p.keterangan)}</div>
          </div>
        </td>
      `;
    };

    pages.push(`
      <section class="sheet">
        <div class="header">
          <h1>LAMPIRAN DOKUMENTASI SUPERVISI</h1>
          <table class="meta">
            <tr>
              <td class="label">Guru</td>
              <td>: ${esc($("infoGuru")?.textContent||jadwal.guru_id||"-")}</td>
              <td class="label">Supervisor</td>
              <td>: ${esc($("infoSupervisor")?.textContent||jadwal.supervisor_id||"-")}</td>
            </tr>
            <tr>
              <td class="label">Tanggal</td>
              <td>: ${esc($("infoTanggal")?.textContent||jadwal.tanggal||"-")}</td>
              <td class="label">Mapel/Layanan</td>
              <td>: ${esc(jadwal.mapel||"-")}</td>
            </tr>
          </table>
        </div>

        <table class="photo-table">
          <tbody>
            <tr>${cell(six[0])}${cell(six[1])}</tr>
            <tr>${cell(six[2])}${cell(six[3])}</tr>
            <tr>${cell(six[4])}${cell(six[5])}</tr>
          </tbody>
        </table>
      </section>
    `);
  }

  return `<!doctype html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>Dokumentasi Supervisi</title>
    <style>
      @page{size:A4 portrait;margin:6mm}
      *{box-sizing:border-box}
      html,body{
        margin:0;
        padding:0;
        font-family:Arial,sans-serif;
        color:#111;
        background:#fff;
      }
      .sheet{
        width:198mm;
        height:285mm;
        overflow:hidden;
        page-break-after:always;
        break-after:page;
      }
      .sheet:last-child{
        page-break-after:auto;
        break-after:auto;
      }
      .header{
        height:25mm;
        overflow:hidden;
      }
      h1{
        text-align:center;
        margin:0 0 2.5mm;
        font-size:13pt;
        line-height:1;
      }
      .meta{
        width:100%;
        border-collapse:collapse;
        font-size:8pt;
        line-height:1.1;
      }
      .meta td{
        border:none;
        padding:.4mm 1mm;
        vertical-align:top;
      }
      .meta .label{
        width:20mm;
        font-weight:700;
        white-space:nowrap;
      }
      .photo-table{
        width:100%;
        height:256mm;
        table-layout:fixed;
        border-collapse:separate;
        border-spacing:3mm 3mm;
      }
      .photo-table tr{
        height:82mm;
      }
      .photo-cell{
        width:50%;
        height:82mm;
        border:.3mm solid #d8dde3;
        border-radius:1.5mm;
        padding:2mm;
        vertical-align:top;
        overflow:hidden;
        page-break-inside:avoid;
        break-inside:avoid;
      }
      .photo-cell.empty{
        border-color:transparent;
      }
      .photo-box{
        width:100%;
        height:62mm;
        overflow:hidden;
        background:#f4f5f6;
        display:flex;
        align-items:center;
        justify-content:center;
      }
      .photo-box img{
        width:100%;
        height:100%;
        object-fit:cover;
        display:block;
      }
      .caption{
        height:14mm;
        overflow:hidden;
        padding-top:1.5mm;
        font-size:7.6pt;
        line-height:1.12;
      }
      .caption b{
        display:block;
        margin-bottom:.6mm;
        font-size:7.9pt;
      }
      .no-photo{
        color:#777;
        font-size:8pt;
      }
      @media print{
        html,body{width:210mm}
        .sheet{margin:0}
      }
    </style>
  </head>
  <body>
    ${pages.join("") || `
      <section class="sheet">
        <div class="header">
          <h1>LAMPIRAN DOKUMENTASI SUPERVISI</h1>
        </div>
        <p>Belum ada dokumentasi.</p>
      </section>`}
  </body>
  </html>`;
}

$("btnUploadDokumentasi")?.addEventListener("click",uploadPhotos);
$("btnCetakDokumentasi")?.addEventListener("click",async()=>{
  const html=await dokumentasiPrintHtml();
  const w=window.open("","_blank");
  w.document.write(html);
  w.document.close();w.focus();
  setTimeout(()=>w.print(),1200);
});

onAuthStateChanged(auth,async user=>{
  if(!user)return;
  try{
    if(!jadwalId) throw new Error("jadwal_id tidak ditemukan.");
    const us=await getDoc(doc(db,"users",user.uid));
    if(!us.exists()) throw new Error("Profil pengguna tidak ditemukan.");
    userProfile={uid:user.uid,...us.data()};
    if(String(userProfile.role||userProfile.peran||"").toLowerCase()!=="supervisor"){
      throw new Error("Dokumentasi hanya dapat dikelola supervisor.");
    }

    const j=await getDoc(doc(db,"jadwal",jadwalId));
    if(!j.exists()) throw new Error("Jadwal supervisi tidak ditemukan.");
    jadwal={id:j.id,...j.data()};
    if(jadwal.supervisor_id!==userProfile.referensi_id){
      throw new Error("Jadwal ini bukan milik supervisor yang sedang login.");
    }

    const s=await getDoc(doc(db,"supervisi",jadwalId));
    dokumentasi=s.exists() && Array.isArray(s.data().dokumentasi) ? s.data().dokumentasi : [];
    await render();
  }catch(e){
    console.error(e);
    showMessage(e.message,true);
    $("btnUploadDokumentasi").disabled=true;
  }
});
