
import { auth, db } from "./firebase-config.js";
import { doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";
import { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_BUCKET } from "./supabase-config.js";

console.info("SIPERVISI UPLOAD FOTO V17 AKTIF");

const $ = id => document.getElementById(id);
const jadwalId = new URLSearchParams(location.search).get("jadwal_id");
const MAX_PHOTOS = 10;

function show(message, error=false){
  const el = $("dokumentasiMessage");
  if(el){
    el.textContent = message;
    el.style.color = error ? "#b42318" : "#25633e";
  }
}

function safeName(name="foto"){
  return String(name)
    .normalize("NFKD")
    .replace(/[^\w.-]+/g,"_")
    .replace(/_+/g,"_")
    .replace(/^_+|_+$/g,"")
    .slice(0,80) || "foto";
}

function encodeStoragePath(path=""){
  return String(path).split("/").map(s=>encodeURIComponent(s)).join("/");
}

async function compressImage(file){
  if(!file || !file.type.startsWith("image/")){
    throw new Error("File yang dipilih bukan gambar.");
  }

  const dataUrl = await new Promise((resolve,reject)=>{
    const reader = new FileReader();
    reader.onload = ()=>resolve(reader.result);
    reader.onerror = ()=>reject(new Error("Foto tidak dapat dibaca."));
    reader.readAsDataURL(file);
  });

  const img = await new Promise((resolve,reject)=>{
    const image = new Image();
    image.onload = ()=>resolve(image);
    image.onerror = ()=>reject(new Error("Foto tidak dapat dibuka oleh browser."));
    image.src = dataUrl;
  });

  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const scale = Math.min(1, 1600 / Math.max(iw,ih));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(iw*scale));
  canvas.height = Math.max(1, Math.round(ih*scale));
  canvas.getContext("2d").drawImage(img,0,0,canvas.width,canvas.height);

  const blob = await new Promise(resolve=>canvas.toBlob(resolve,"image/jpeg",0.82));
  if(!blob) throw new Error("Foto gagal diproses.");
  return blob;
}

async function uploadBlob(path, blob){
  const url = `${SUPABASE_URL}/storage/v1/object/${encodeURIComponent(SUPABASE_BUCKET)}/${encodeStoragePath(path)}`;

  const controller = new AbortController();
  const timer = setTimeout(()=>controller.abort(), 30000);

  try{
    const res = await fetch(url,{
      method:"POST",
      mode:"cors",
      cache:"no-store",
      credentials:"omit",
      headers:{
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type":"image/jpeg",
        "x-upsert":"false"
      },
      body:blob,
      signal:controller.signal
    });

    const body = await res.text();

    if(!res.ok){
      throw new Error(`Supabase ${res.status}: ${body || "upload ditolak"}`);
    }

    try{return JSON.parse(body || "{}")}catch{return {}}
  }catch(e){
    if(e?.name === "AbortError"){
      throw new Error("Upload timeout. Coba jaringan lain.");
    }
    if(/Failed to fetch|NetworkError|Load failed/i.test(e?.message || "")){
      throw new Error("Tidak dapat terhubung ke Supabase. Coba ganti Wi-Fi/data seluler atau matikan VPN/Private DNS/ad-blocker.");
    }
    throw e;
  }finally{
    clearTimeout(timer);
  }
}

async function readCurrent(){
  if(!jadwalId) throw new Error("jadwal_id tidak ditemukan pada alamat halaman.");
  const snap = await getDoc(doc(db,"supervisi",jadwalId));
  const data = snap.exists() ? snap.data() : {};
  return Array.isArray(data.dokumentasi) ? data.dokumentasi : [];
}

async function saveCurrent(items){
  const j = await getDoc(doc(db,"jadwal",jadwalId));
  if(!j.exists()) throw new Error("Data jadwal tidak ditemukan.");

  const jadwal = j.data();
  await setDoc(doc(db,"supervisi",jadwalId),{
    jadwal_id: jadwalId,
    guru_id: jadwal.guru_id,
    supervisor_id: jadwal.supervisor_id,
    dokumentasi: items,
    updated_at: serverTimestamp()
  },{merge:true});
}

async function handleUpload(e){
  e.preventDefault();
  e.stopImmediatePropagation();

  const btn = $("btnUploadDokumentasi");
  const input = $("dokumentasiFiles");

  try{
    if(!auth.currentUser){
      throw new Error("Sesi login tidak ditemukan. Silakan login ulang.");
    }

    const files = [...(input?.files || [])];
    if(!files.length){
      show("Pilih minimal satu foto terlebih dahulu.", true);
      return;
    }

    btn.disabled = true;
    btn.textContent = "Mengunggah...";
    show("Menyiapkan upload foto...", false);

    let dokumentasi = await readCurrent();

    if(dokumentasi.length + files.length > MAX_PHOTOS){
      throw new Error(`Maksimal ${MAX_PHOTOS} foto. Saat ini sudah ada ${dokumentasi.length} foto.`);
    }

    const kategori = $("dokumentasiKategori")?.value || "Lainnya";
    const keterangan = $("dokumentasiKeterangan")?.value?.trim() || "";

    for(let i=0;i<files.length;i++){
      const file = files[i];
      show(`Memproses foto ${i+1} dari ${files.length}: ${file.name}`, false);

      const blob = await compressImage(file);
      const stamp = `${Date.now()}_${i}`;
      const base = safeName(file.name.replace(/\.[^.]+$/,""));
      const path = `${jadwalId}/dokumentasi/${stamp}_${base}.jpg`;

      show(`Mengunggah foto ${i+1} dari ${files.length}...`, false);
      await uploadBlob(path, blob);

      dokumentasi.push({
        id:`DOC${stamp}`,
        kategori,
        keterangan,
        nama_file:file.name,
        ukuran:blob.size,
        storage_path:path,
        storage_provider:"supabase",
        uploaded_at:new Date().toISOString()
      });

      await saveCurrent(dokumentasi);
    }

    input.value = "";
    if($("dokumentasiKeterangan")) $("dokumentasiKeterangan").value = "";

    show("Foto berhasil diunggah. Halaman akan dimuat ulang...", false);
    setTimeout(()=>location.reload(), 700);

  }catch(err){
    console.error("UPLOAD FOTO V17 ERROR",err);
    show(`Upload foto gagal [V17]: ${err.message}`, true);
  }finally{
    btn.disabled = false;
    btn.textContent = "Unggah Foto";
  }
}

function activate(){
  const btn = $("btnUploadDokumentasi");
  if(!btn) return;

  // Paksa tombol aktif; script lama kadang men-disable tombol saat init gagal.
  btn.disabled = false;
  btn.removeAttribute("disabled");
  btn.style.pointerEvents = "auto";
  btn.style.opacity = "1";

  // Capture phase supaya handler V17 berjalan lebih dulu daripada handler lama.
  btn.addEventListener("click", handleUpload, true);

  show("Upload foto siap digunakan [V17].", false);
}

if(document.readyState === "loading"){
  document.addEventListener("DOMContentLoaded", activate);
}else{
  activate();
}

// Jika script lama men-disable tombol setelah auth check, aktifkan kembali.
setInterval(()=>{
  const btn = $("btnUploadDokumentasi");
  if(btn && btn.disabled){
    btn.disabled = false;
    btn.removeAttribute("disabled");
  }
},1000);
