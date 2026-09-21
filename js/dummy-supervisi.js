
const $ = id => document.getElementById(id);

function setValue(id, value){
  const el=$(id);
  if(el) el.value=value;
}
function dispatchChange(el){
  if(!el) return;
  el.dispatchEvent(new Event("change",{bubbles:true}));
  el.dispatchEvent(new Event("input",{bubbles:true}));
}
function fillPembelajaran(){
  for(let i=0;i<15;i++){
    const fb=$("p_fb_"+i);
    const sc=$("p_score_"+i);
    if(fb) fb.value = [
      "Perencanaan sudah tergambar dengan baik dan relevan dengan tujuan pembelajaran.",
      "Komponen sudah sesuai, namun dapat dibuat lebih spesifik pada konteks kelas.",
      "Praktik yang direncanakan sudah mendukung pembelajaran aktif dan bermakna.",
      "Sudah baik. Perlu konsistensi pada keterkaitan langkah, asesmen, dan tujuan."
    ][i%4];
    if(sc){
      sc.value = (i%3===0 ? "4" : "3");
      dispatchChange(sc);
    }
  }

  setValue("p_kelebihan",
    "Perencanaan pembelajaran tersusun sistematis, tujuan pembelajaran jelas, aktivitas murid tergambar, dan asesmen telah mengarah pada ketercapaian tujuan pembelajaran.");
  setValue("p_tingkatkan",
    "Perlu memperkuat diferensiasi sesuai karakteristik murid, memperjelas bukti asesmen formatif, serta memberi ruang refleksi murid yang lebih terstruktur.");
  setValue("p_rekomendasi",
    "Pertahankan keselarasan tujuan, aktivitas, dan asesmen. Tambahkan variasi aktivitas kontekstual, umpan balik formatif, serta refleksi yang membantu murid memahami proses belajarnya.");

  for(let i=0;i<15;i++){
    const bukti=$("o_bukti_"+i);
    const cat=$("o_catatan_"+i);
    if(bukti) bukti.value = [
      "Terlihat dari kegiatan pembuka, penyampaian tujuan, dan aktivitas belajar murid.",
      "Terlihat saat murid berdiskusi, mengerjakan tugas, dan menyampaikan hasil.",
      "Terlihat dari penggunaan media dan interaksi guru-murid selama pembelajaran."
    ][i%3];
    if(cat) cat.value = [
      "Pelaksanaan sudah sesuai dengan perencanaan.",
      "Sudah baik, perlu penguatan pada pemerataan keterlibatan murid.",
      "Kegiatan berlangsung kondusif dan memberi ruang partisipasi murid."
    ][i%3];
  }

  setValue("o_pelajaran",
    "Pembelajaran berjalan lebih efektif ketika tujuan disampaikan dengan jelas, aktivitas dibuat kontekstual, dan murid diberi kesempatan aktif untuk berdiskusi serta merefleksikan hasil belajar.");
  setValue("o_belum",
    "Belum semua murid terlibat secara merata. Waktu refleksi di akhir pembelajaran juga masih terbatas sehingga sebagian murid belum menyampaikan pemaknaan belajarnya.");
  setValue("o_tindak",
    "Pada pertemuan berikutnya guru akan menggunakan strategi pembagian peran dalam kelompok, asesmen formatif singkat, dan menyediakan waktu refleksi terstruktur pada akhir pembelajaran.");
}

function fillBK(){
  const scoreInputs=[...document.querySelectorAll('[id^="bk_score_"]')];
  scoreInputs.forEach((el,i)=>{
    const scores=[92,88,90,86,94,89,91,87];
    el.value=String(scores[i%scores.length]);
    dispatchChange(el);
  });

  const notes=[...document.querySelectorAll('[id^="bk_catatan_"]')];
  notes.forEach((el,i)=>{
    el.value=[
      "Dokumen tersedia dan dapat ditunjukkan saat supervisi.",
      "Pelaksanaan sudah berjalan sesuai program yang direncanakan.",
      "Administrasi cukup lengkap dan terdokumentasi.",
      "Perlu penguatan pada konsistensi tindak lanjut dan dokumentasi."
    ][i%4];
  });

  setValue("bk_rek_guru",
    "Pertahankan layanan yang sudah berjalan baik. Lengkapi dokumentasi, evaluasi setiap layanan, dan perkuat tindak lanjut berdasarkan kebutuhan peserta didik.");
  setValue("bk_rek_kepala",
    "Sekolah dapat terus mendukung layanan BK melalui penguatan sarana, waktu layanan, kolaborasi, dan pengembangan profesional guru BK.");
  setValue("bk_catatan_umum",
    "Secara umum pelaksanaan layanan BK berjalan baik dan perlu dilanjutkan dengan penguatan dokumentasi serta tindak lanjut.");
}

function isBKMode(){
  const panel=$("panelBK");
  return panel && getComputedStyle(panel).display!=="none";
}

function fillDummy(){
  if(isBKMode()) fillBK();
  else fillPembelajaran();

  const docCat=$("dokumentasiKategori");
  if(docCat) docCat.value="Saat Pembelajaran";
  setValue("dokumentasiKeterangan","Data uji: dokumentasi kegiatan supervisi untuk pengujian aplikasi.");

  const box=$("dummyStatus");
  if(box){
    box.textContent="Data dummy sudah diisikan. Silakan cek isian, lalu klik Simpan Bagian 1 / Simpan Bagian 2 (atau Simpan Instrumen BK). Setelah itu Anda bisa klik Tandai Supervisi Selesai.";
    box.style.color="#25633e";
  }
  window.scrollTo({top:document.querySelector("#panelBK")?.style.display==="none" ? 0 : 0,behavior:"smooth"});
}

function clearDummy(){
  if(!confirm("Kosongkan isian dummy pada form yang sedang terbuka?")) return;

  document.querySelectorAll('textarea[id^="p_"], textarea[id^="o_"], textarea[id^="bk_"]').forEach(el=>el.value="");
  document.querySelectorAll('select[id^="p_score_"]').forEach(el=>{el.value="";dispatchChange(el);});
  document.querySelectorAll('input[id^="bk_score_"]').forEach(el=>{el.value="";dispatchChange(el);});
  setValue("dokumentasiKeterangan","");

  const box=$("dummyStatus");
  if(box){
    box.textContent="Isian dummy pada form telah dikosongkan.";
    box.style.color="#6d7a8d";
  }
}

document.addEventListener("DOMContentLoaded",()=>{
  $("btnIsiDummy")?.addEventListener("click",fillDummy);
  $("btnKosongkanDummy")?.addEventListener("click",clearDummy);
});
