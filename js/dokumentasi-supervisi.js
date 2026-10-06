
import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import { doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_BUCKET } from "./supabase-config.js";

console.info("SIPERVISI Dokumentasi V19 aktif");

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession:false, autoRefreshToken:false, detectSessionInUrl:false }
});

const $ = id => document.getElementById(id);
const jadwalId = new URLSearchParams(location.search).get("jadwal_id");
const MAX_PHOTOS = 10;

let currentUser = null;
let userProfile = null;
let jadwal = null;
let dokumentasi = [];
let contextReady = false;

function esc(v=""){
  return String(v ?? "").replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[m]));
}
function norm(v){ return String(v ?? "").trim().toUpperCase(); }
function safeName(v="foto"){
  return String(v).toLowerCase()
    .replace(/[^a-z0-9._-]+/g,"-")
    .replace(/-+/g,"-")
    .replace(/^-|-$/g,"")
    .slice(0,80) || "foto";
}
function formatBytes(bytes=0){
  if(bytes < 1024) return bytes+" B";
  if(bytes < 1024*1024) return (bytes/1024).toFixed(1)+" KB";
  return (bytes/(1024*1024)).toFixed(1)+" MB";
}
function showMessage(message,isError=false){
  const el=$("dokumentasiMessage");
  if(!el) return;
  el.textContent=message || "";
  el.style.color=isError ? "#b42318" : "#25633e";
}
function galleryMessage(message){
  const box=$("dokumentasiGallery");
  if(box) box.innerHTML=`<div class="doc-empty">${esc(message)}</div>`;
}

async function compressImage(file){
  if(!file?.type?.startsWith("image/")){
    throw new Error(`${file?.name || "File"} bukan gambar.`);
  }
  const dataUrl=await new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onload=()=>resolve(reader.result);
    reader.onerror=()=>reject(new Error("File foto tidak dapat dibaca."));
    reader.readAsDataURL(file);
  });
  const img=await new Promise((resolve,reject)=>{
    const im=new Image();
    im.onload=()=>resolve(im);
    im.onerror=()=>reject(new Error("Foto tidak dapat dibuka browser."));
    im.src=dataUrl;
  });
  const iw=img.naturalWidth||img.width, ih=img.naturalHeight||img.height;
  const maxSide=1600;
  const scale=Math.min(1,maxSide/Math.max(iw,ih));
  const canvas=document.createElement("canvas");
  canvas.width=Math.max(1,Math.round(iw*scale));
  canvas.height=Math.max(1,Math.round(ih*scale));
  canvas.getContext("2d").drawImage(img,0,0,canvas.width,canvas.height);
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,"image/jpeg",0.82));
  if(!blob) throw new Error("Gagal mengompres foto.");
  return blob;
}

async function testSupabase(){
  try{
    // list() cukup untuk memastikan browser dapat menjangkau Storage.
    const { error } = await supabase.storage.from(SUPABASE_BUCKET).list("", { limit:1 });
    if(error){
      return {ok:false, message:`Supabase terjangkau, tetapi Storage menolak akses: ${error.message}`};
    }
    return {ok:true, message:"Supabase Storage terhubung."};
  }catch(e){
    return {ok:false, message:`Browser tidak dapat menjangkau Supabase: ${e?.message || e}`};
  }
}

async function loadContext(){
  if(!currentUser) throw new Error("Sesi login belum tersedia.");
  if(!jadwalId) throw new Error("jadwal_id tidak ditemukan pada alamat halaman.");

  const [us,j] = await Promise.all([
    getDoc(doc(db,"users",currentUser.uid)),
    getDoc(doc(db,"jadwal",jadwalId))
  ]);

  if(!us.exists()) throw new Error("Profil pengguna tidak ditemukan di collection users.");
  if(!j.exists()) throw new Error("Jadwal supervisi tidak ditemukan.");

  userProfile={uid:currentUser.uid,...us.data()};
  jadwal={id:j.id,...j.data()};

  const role=String(userProfile.role||userProfile.peran||"").trim().toLowerCase();
  if(role!=="supervisor" && role!=="admin"){
    throw new Error(`Akun ini berperan "${role || "-"}". Upload dokumentasi hanya untuk Supervisor/Admin.`);
  }

  // Normalisasi ID agar beda huruf besar/kecil/spasi tidak mematikan upload.
  if(role==="supervisor" && norm(jadwal.supervisor_id)!==norm(userProfile.referensi_id)){
    throw new Error(
      `Jadwal ini tercatat untuk supervisor ${jadwal.supervisor_id || "-"}, `+
      `sedangkan akun ini memiliki referensi ${userProfile.referensi_id || "-"}.`
    );
  }

  const s=await getDoc(doc(db,"supervisi",jadwalId));
  dokumentasi=s.exists() && Array.isArray(s.data().dokumentasi)
    ? s.data().dokumentasi
    : [];

  contextReady=true;
}

async function saveMetadata(){
  await setDoc(doc(db,"supervisi",jadwalId),{
    jadwal_id:jadwalId,
    guru_id:jadwal.guru_id,
    supervisor_id:jadwal.supervisor_id,
    dokumentasi,
    updated_at:serverTimestamp()
  },{merge:true});
}

async function signedUrl(path){
  const {data,error}=await supabase.storage.from(SUPABASE_BUCKET).createSignedUrl(path,3600);
  if(error) throw error;
  return data?.signedUrl || "";
}

async function render(){
  const count=$("jumlahDokumentasi");
  if(count) count.textContent=`${dokumentasi.length} / ${MAX_PHOTOS}`;

  const box=$("dokumentasiGallery");
  if(!box) return;
  if(!dokumentasi.length){
    box.innerHTML='<div class="doc-empty">Belum ada foto dokumentasi.</div>';
    return;
  }

  box.innerHTML=dokumentasi.map((x,i)=>`
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
      const url=await signedUrl(dokumentasi[i].storage_path);
      const ph=$("docCard"+i)?.querySelector(".doc-img-placeholder");
      if(ph) ph.outerHTML=`<a href="${esc(url)}" target="_blank" rel="noopener"><img src="${esc(url)}" alt="Dokumentasi ${i+1}" loading="lazy"></a>`;
    }catch(e){
      const ph=$("docCard"+i)?.querySelector(".doc-img-placeholder");
      if(ph) ph.textContent="Foto gagal dimuat";
    }
  }

  document.querySelectorAll(".doc-save").forEach(btn=>btn.addEventListener("click",async()=>{
    try{
      const i=Number(btn.dataset.index);
      dokumentasi[i].kategori=document.querySelector(`.doc-category[data-index="${i}"]`).value;
      dokumentasi[i].keterangan=document.querySelector(`.doc-caption[data-index="${i}"]`).value.trim();
      await saveMetadata();
      showMessage("Keterangan foto berhasil disimpan.");
    }catch(e){
      showMessage("Gagal menyimpan keterangan: "+e.message,true);
    }
  }));

  document.querySelectorAll(".doc-delete").forEach(btn=>btn.addEventListener("click",async()=>{
    const i=Number(btn.dataset.index);
    const item=dokumentasi[i];
    if(!confirm(`Hapus Foto ${i+1}?`)) return;
    try{
      if(item.storage_path){
        const {error}=await supabase.storage.from(SUPABASE_BUCKET).remove([item.storage_path]);
        if(error) throw error;
      }
      dokumentasi.splice(i,1);
      await saveMetadata();
      await render();
      showMessage("Foto dokumentasi dihapus.");
    }catch(e){
      showMessage("Gagal menghapus foto: "+e.message,true);
    }
  }));
}

async function uploadPhotos(){
  const btn=$("btnUploadDokumentasi");
  const input=$("dokumentasiFiles");
  const files=[...(input?.files||[])];

  if(!files.length){
    alert("Pilih minimal satu foto.");
    return;
  }

  if(btn) btn.disabled=true;

  try{
    // Selalu muat ulang konteks ketika tombol diklik.
    if(!contextReady) await loadContext();

    const test=await testSupabase();
    if(!test.ok) throw new Error(test.message);

    if(dokumentasi.length+files.length>MAX_PHOTOS){
      throw new Error(`Maksimal ${MAX_PHOTOS} foto. Saat ini sudah ada ${dokumentasi.length}.`);
    }

    const kategori=$("dokumentasiKategori")?.value || "Saat Pembelajaran";
    const keterangan=$("dokumentasiKeterangan")?.value.trim() || "";

    for(let i=0;i<files.length;i++){
      const file=files[i];
      showMessage(`Memproses foto ${i+1}/${files.length}: ${file.name}...`);
      const blob=await compressImage(file);

      const stamp=`${Date.now()}_${i}`;
      const path=`${jadwalId}/dokumentasi/${stamp}_${safeName(file.name.replace(/\.[^.]+$/,""))}.jpg`;

      showMessage(`Mengunggah foto ${i+1}/${files.length} ke Supabase...`);
      const {error}=await supabase.storage
        .from(SUPABASE_BUCKET)
        .upload(path,blob,{
          contentType:"image/jpeg",
          upsert:false,
          cacheControl:"3600"
        });

      if(error) throw new Error(`Supabase: ${error.message}`);

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
    }

    if(input) input.value="";
    if($("dokumentasiKeterangan")) $("dokumentasiKeterangan").value="";
    await render();
    showMessage("Foto dokumentasi berhasil diunggah.");
  }catch(e){
    console.error("UPLOAD FOTO V19",e);
    showMessage("Upload foto gagal: "+(e?.message||e),true);
  }finally{
    if(btn) btn.disabled=false;
  }
}

async function printDokumentasi(){
  if(!contextReady) await loadContext();
  const items=[];
  for(let i=0;i<dokumentasi.length;i++){
    let url="";
    try{url=await signedUrl(dokumentasi[i].storage_path)}catch{}
    const x=dokumentasi[i];
    items.push(`<div class="photo">${url?`<img src="${esc(url)}">`:""}<p><b>Foto ${i+1} — ${esc(x.kategori||"Dokumentasi")}</b><br>${esc(x.keterangan||"")}</p></div>`);
  }
  const html=`<!doctype html><html><head><meta charset="utf-8"><title>Dokumentasi Supervisi</title>
  <style>body{font-family:Arial;margin:30px}.photo{page-break-inside:avoid;margin-bottom:24px}.photo img{max-width:100%;max-height:560px;display:block;margin:auto}</style>
  </head><body><h1>LAMPIRAN DOKUMENTASI SUPERVISI</h1>${items.join("")||"<p>Belum ada dokumentasi.</p>"}</body></html>`;
  const w=window.open("","_blank");
  if(!w) throw new Error("Pop-up diblokir browser.");
  w.document.write(html); w.document.close(); w.focus();
  setTimeout(()=>w.print(),700);
}

$("btnUploadDokumentasi")?.addEventListener("click",uploadPhotos);
$("btnCetakDokumentasi")?.addEventListener("click",async()=>{
  try{await printDokumentasi()}
  catch(e){showMessage("Gagal menyiapkan dokumentasi: "+e.message,true)}
});

galleryMessage("Menyiapkan dokumentasi...");
showMessage("Pengecekan dokumentasi V19...");

onAuthStateChanged(auth,async user=>{
  currentUser=user;
  if(!user){
    galleryMessage("Menunggu sesi login...");
    showMessage("Sesi login belum tersedia.",true);
    return;
  }

  try{
    await loadContext();
    await render();
    const test=await testSupabase();
    showMessage(test.message,!test.ok);
  }catch(e){
    console.error("INIT DOKUMENTASI V19",e);
    contextReady=false;
    galleryMessage("Dokumentasi belum dimuat. Tombol Unggah Foto tetap aktif untuk mencoba ulang.");
    showMessage("Pemeriksaan awal gagal: "+e.message,true);
    // sengaja tidak menonaktifkan tombol upload
  }
});
