import { downloadWord, printPdf } from "./export-helper.js";
import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import {
  doc,getDoc,setDoc,updateDoc,serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

const PERENCANAAN = [{"group": "Keselarasan", "text": "Tujuan pembelajaran, langkah pembelajaran, dan asesmen pembelajaran sudah mengarah pada pencapaian Dimensi Profil Lulusan"}, {"group": "Keselarasan", "text": "Tujuan pembelajaran, langkah pembelajaran, dan asesmen pembelajaran sudah selaras"}, {"group": "Kerangka Pembelajaran", "text": "Praktik pedagogis yang dituliskan sudah tergambar pada langkah pembelajaran dan/atau asesmen pembelajaran"}, {"group": "Kerangka Pembelajaran", "text": "Lingkungan belajar yang dituliskan sudah tergambar pada langkah pembelajaran dan/atau asesmen pembelajaran"}, {"group": "Kerangka Pembelajaran", "text": "Kemitraan pembelajaran yang dituliskan sudah tergambar pada langkah pembelajaran dan/atau asesmen pembelajaran"}, {"group": "Kerangka Pembelajaran", "text": "Pemanfaatan digital yang dituliskan sudah tergambar pada langkah pembelajaran dan/atau asesmen pembelajaran"}, {"group": "Langkah Pembelajaran", "text": "Langkah pembelajaran dapat memfasilitasi murid untuk merasakan pengalaman belajar MEMAHAMI (terlibat aktif mengonstruksi pengetahuan agar dapat memahami secara mendalam konsep atau materi dari berbagai sumber dan konteks)."}, {"group": "Langkah Pembelajaran", "text": "Langkah pembelajaran dapat memfasilitasi murid untuk merasakan pengalaman belajar MENGAPLIKASI (mengaplikasi pemahaman secara kontekstual dalam kehidupan nyata sebagai bagian dari pendalaman pengetahuan)"}, {"group": "Langkah Pembelajaran", "text": "Langkah pembelajaran dapat memfasilitasi murid untuk merasakan pengalaman belajar MEREFLEKSI (mengevaluasi dan memaknai proses serta hasil dari tindakan atau praktik nyata yang telah mereka lakukan dan menentukan tindak lanjut ke depan; serta mengelola proses belajarnya secara mandiri)."}, {"group": "Langkah Pembelajaran", "text": "Langkah perencanaan pembelajaran dapat memfasilitasi tindakan saling MEMULIAKAN antara Guru-Murid, Murid-Guru, Murid-Murid yang tercermin dalam bahasa verbal dan nonverbal"}, {"group": "Langkah Pembelajaran", "text": "Prinsip pembelajaran mendalam berupa berkesadaran, bermakna, dan/atau menggembirakan sudah tergambar pada setiap pengalaman belajar di langkah pembelajaran"}, {"group": "Langkah Pembelajaran", "text": "Perencanaan pembelajaran sudah mengakomodir pengalaman belajar yang sesuai dengan karakteristik murid"}, {"group": "Asesmen", "text": "Perencanaan pembelajaran sudah memuat asesmen yang digunakan untuk memberikan umpan balik guna memperbaiki proses pembelajaran"}, {"group": "Asesmen", "text": "Perencanaan pembelajaran sudah memuat asesmen yang dapat mengukur ketercapaian tujuan pembelajaran sesuai karakteristik murid"}, {"group": "Asesmen", "text": "Asesmen sudah memiliki kriteria yang jelas dalam mengukur ketercapaian tujuan pembelajaran"}];
const OBSERVASI = [{"group": "Keselarasan", "text": "Tindakan implementasi perencanaan selaras dengan perencanaan pembelajaran pada awal pembelajaran, inti pembelajaran dalam proses memahami, mengaplikasi, dan merefleksi, serta penutupan pembelajaran"}, {"group": "Keselarasan", "text": "Upaya mencapai tujuan pembelajaran menuju pencapaian dimensi profil lulusan selaras dengan perencanaan pembelajaran"}, {"group": "Implementasi Kerangka Pembelajaran", "text": "Praktik pedagogis yang diimplementasikan sudah tergambar pada langkah pembelajaran dan/atau asesmen pembelajaran"}, {"group": "Implementasi Kerangka Pembelajaran", "text": "Lingkungan belajar yang diimplementasikan sudah tergambar pada langkah pembelajaran dan/atau asesmen pembelajaran"}, {"group": "Implementasi Kerangka Pembelajaran", "text": "Kemitraan pembelajaran yang diimplementasikan sudah tergambar pada langkah pembelajaran dan/atau asesmen pembelajaran"}, {"group": "Implementasi Kerangka Pembelajaran", "text": "Pemanfaatan digital yang diimplementasikan sudah tergambar pada langkah pembelajaran dan/atau asesmen pembelajaran"}, {"group": "Langkah Pembelajaran", "text": "Langkah pembelajaran yang dilakukan sesuai perencanaan dapat memfasilitasi tindakan saling MEMULIAKAN antara Guru-Murid, Murid-Guru, Murid-Murid yang tercermin dalam bahasa verbal dan nonverbal"}, {"group": "Langkah Pembelajaran", "text": "Langkah pembelajaran sudah memfasilitasi murid untuk merasakan pengalaman belajar MEMAHAMI (terlibat aktif mengonstruksi pengetahuan agar dapat memahami secara mendalam konsep atau materi dari berbagai sumber dan konteks)."}, {"group": "Langkah Pembelajaran", "text": "Langkah pembelajaran sudah memfasilitasi murid untuk merasakan pengalaman belajar MENGAPLIKASI (mengaplikasi pemahaman secara kontekstual dalam kehidupan nyata sebagai bagian dari pendalaman pengetahuan)"}, {"group": "Langkah Pembelajaran", "text": "Langkah pembelajaran sudah memfasilitasi murid untuk merasakan pengalaman belajar MEREFLEKSI (mengevaluasi dan memaknai proses serta hasil dari tindakan atau praktik nyata yang telah mereka lakukan dan menentukan tindak lanjut ke depan; serta mengelola proses belajarnya secara mandiri)."}, {"group": "Langkah Pembelajaran", "text": "Prinsip pembelajaran mendalam berupa berkesadaran, bermakna, dan/atau menggembirakan sudah tergambar pada setiap pengalaman belajar di langkah pembelajaran yang diimplementasikan."}, {"group": "Langkah Pembelajaran", "text": "Praktik pembelajaran sudah mengakomodir pengalaman belajar yang sesuai dengan karakteristik murid (umur, tingkat perkembangan, kemampuan, bakat dan minat, gaya belajar, dll.)"}, {"group": "Asesmen", "text": "Praktik Pembelajaran sudah melakukan asesmen untuk memberikan umpan balik guna memperbaiki proses pembelajaran."}, {"group": "Asesmen", "text": "Praktik Pembelajaran sudah melakukan asesmen untuk mengukur ketercapaian tujuan pembelajaran sesuai karakteristik murid."}, {"group": "Asesmen", "text": "Asesmen sudah dilakukan berdasarkan kriteria yang jelas dalam mengukur ketercapaian tujuan pembelajaran."}];
const BK = [{"group": "A. Persiapan Penyusunan Program BK", "text": "Tersedia ruang BK (min. 8x8 m) dengan fasilitas: ruang staf, ruang konseling individu, ruang bimbingan/konseling kelompok, ruang tamu, tempat data/dokumen dan tempat pustaka/buku"}, {"group": "A. Persiapan Penyusunan Program BK", "text": "Mengampu minimal 5 kelas dibuktikan dengan SK Pembagian Tugas"}, {"group": "A. Persiapan Penyusunan Program BK", "text": "Melakukan kegiatan asesmen kebutuhan layanan dibuktikan dengan deskripsi kebutuhan siswa"}, {"group": "B. Penyusunan Program BK", "text": "Menyusun Program Tahunan sesuai dengan POP BK 2016 dan disahkan oleh kepala sekolah"}, {"group": "B. Penyusunan Program BK", "text": "Menyusun visi misi layanan BK di sekolah sesuai kebutuhan dan mendukung tercapainya visi misi sekolah"}, {"group": "B. Penyusunan Program BK", "text": "Menyusun Program Semester sesuai dengan POP BK 2016"}, {"group": "B. Penyusunan Program BK", "text": "Mensosialisasikan program BK kepada warga sekolah"}, {"group": "C. Melaksanakan Kegiatan BK - Layanan Dasar", "text": "Melaksanakan bimbingan klasikal dan/atau bimbingan kelompok di kelas secara rutin dan terjadwal"}, {"group": "C. Melaksanakan Kegiatan BK - Layanan Dasar", "text": "Melakukan evaluasi setelah melaksanakan layanan klasikal"}, {"group": "C. Melaksanakan Kegiatan BK - Layanan Dasar", "text": "Menyelenggarakan layanan dasar menggunakan media (contoh: papan bimbingan, poster, leaflet, kotak aspirasi/kotak masalah, media sosial, dll.)"}, {"group": "C. Melaksanakan Kegiatan BK - Layanan Peminatan dan Perencanaan Individual", "text": "Melaksanakan layanan peminatan dan perencanaan individual: Peminatan dan Lintas Minat, Penempatan Ekstrakurikuler, merencanakan arah karier dan studi lanjut (dibuktikan dengan angket)"}, {"group": "C. Melaksanakan Kegiatan BK - Layanan Responsif", "text": "Melaksanakan layanan responsif (konseling, alih tangan kasus, konsultasi, advokasi, kunjungan rumah, konferensi kasus, mediasi) dibuktikan dengan RPL, Evaluasi, Laporan"}, {"group": "D. Dukungan Sistem - Kegiatan Administrasi", "text": "Catatan Kumulatif (Data Siswa, Rekap Kehadiran, Data Hasil Asesmen Tes maupun Non Tes, dll.)"}, {"group": "D. Dukungan Sistem - Kegiatan Administrasi", "text": "Mengadministrasi tamu yang hadir"}, {"group": "D. Dukungan Sistem - Kegiatan Administrasi", "text": "Menyusun Laporan di akhir tahun pelajaran"}, {"group": "D. Dukungan Sistem - Kegiatan Administrasi", "text": "Memiliki Catatan Anekdot/Catatan Kejadian"}, {"group": "D. Dukungan Sistem - Kegiatan Administrasi", "text": "Mendokumentasikan kegiatan harian dalam bentuk jurnal harian"}, {"group": "D. Dukungan Sistem - Kegiatan Kolaborasi", "text": "Menjalin komunikasi dan bekerja sama dengan pihak-pihak lain (guru mapel, wali kelas, orang tua, pihak lainnya)"}, {"group": "D. Dukungan Sistem - Kegiatan Tambahan dan Pengembangan Profesi", "text": "Hadir dan berada di sekolah sesuai dengan ketentuan dan peraturan yang berlaku"}, {"group": "D. Dukungan Sistem - Kegiatan Tambahan dan Pengembangan Profesi", "text": "Memiliki daftar siswa yang menjadi ampuannya"}, {"group": "D. Dukungan Sistem - Kegiatan Tambahan dan Pengembangan Profesi", "text": "Memiliki buku/media layanan BK yang memadai, baik berupa sarana biblioedukasi/konseling dan/atau sarana sinema edukasi maupun sinema terapi"}, {"group": "D. Dukungan Sistem - Kegiatan Tambahan dan Pengembangan Profesi", "text": "Mengikuti kegiatan MGBK, Workshop dan kegiatan ilmiah lainnya (Dokumen Pengembangan Diri)"}, {"group": "D. Dukungan Sistem - Kegiatan Tambahan dan Pengembangan Profesi", "text": "Menyusun dan mempublikasikan hasil karya ilmiah"}, {"group": "D. Dukungan Sistem - Kegiatan Tambahan dan Pengembangan Profesi", "text": "Membuat/menghasilkan produk inovatif guna meningkatkan layanan BK kepada siswa"}];
const $=id=>document.getElementById(id);
const params=new URLSearchParams(location.search);
const jadwalId=params.get("jadwal_id");
let jadwal=null, guru=null, supervisor=null, dataSupervisi={};
let currentUid="";

function esc(v=""){return String(v).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));}
function nl(v=""){return esc(v).replace(/\n/g,"<br>");}
function formatDate(v){if(!v)return "-";const p=v.split("-");return p.length===3?`${p[2]}-${p[1]}-${p[0]}`:v;}

function renderIdentity(){
  $("infoGuru").textContent=guru?.nama||jadwal.guru_id;
  $("infoSupervisor").textContent=supervisor?.nama||jadwal.supervisor_id;
  $("infoTanggal").textContent=formatDate(jadwal.tanggal);
  $("infoKelas").textContent=jadwal.kelas||"-";
  $("infoMapel").textContent=jadwal.mapel||"-";
  $("infoMateri").textContent=jadwal.materi||"-";
  $("infoStatus").textContent=jadwal.status||"Terjadwal";
  $("judulInstrumen").textContent=jadwal.jenis_instrumen==="bk"?"Instrumen Supervisi Guru BK":"Instrumen Supervisi Pembelajaran";
}

function groupRows(items, maker){
  let last="",html="";
  items.forEach((it,i)=>{
    if(it.group!==last){html+=`<tr class="group-row"><td colspan="4">${esc(it.group)}</td></tr>`;last=it.group;}
    html+=maker(it,i);
  });
  return html;
}

function renderPerencanaan(){
  const saved=dataSupervisi.perencanaan||{};
  const values=saved.items||[];
  $("perencanaanBody").innerHTML=groupRows(PERENCANAAN,(it,i)=>{
    const v=values[i]||{};
    return `<tr>
      <td class="num">${i+1}</td>
      <td>${esc(it.text)}</td>
      <td><textarea class="input small-area" id="p_fb_${i}" placeholder="Umpan balik supervisor">${esc(v.umpan_balik||"")}</textarea></td>
      <td><select class="input score-select" id="p_score_${i}">
        <option value="">-</option>${[1,2,3,4].map(n=>`<option value="${n}" ${String(v.skor||"")===String(n)?"selected":""}>${n}</option>`).join("")}
      </select></td>
    </tr>`;
  });
  $("p_kelebihan").value=saved.kelebihan||"";
  $("p_tingkatkan").value=saved.perlu_ditingkatkan||"";
  $("p_rekomendasi").value=saved.rekomendasi||"";
  updatePerencanaanScore();
  document.querySelectorAll(".score-select").forEach(x=>x.addEventListener("change",updatePerencanaanScore));
}

function collectPerencanaan(){
  const items=PERENCANAAN.map((it,i)=>({
    no:i+1,aspek:it.text,kelompok:it.group,
    umpan_balik:$("p_fb_"+i).value.trim(),
    skor:Number($("p_score_"+i).value||0)
  }));
  const total=items.reduce((a,b)=>a+b.skor,0);
  const nilai=Math.round((total/(PERENCANAAN.length*4))*10000)/100;
  return {
    items,total_skor:total,skor_maksimal:PERENCANAAN.length*4,nilai,
    kelebihan:$("p_kelebihan").value.trim(),
    perlu_ditingkatkan:$("p_tingkatkan").value.trim(),
    rekomendasi:$("p_rekomendasi").value.trim()
  };
}
function updatePerencanaanScore(){
  const vals=PERENCANAAN.map((_,i)=>Number($("p_score_"+i)?.value||0));
  const total=vals.reduce((a,b)=>a+b,0);
  const nilai=Math.round((total/(PERENCANAAN.length*4))*10000)/100;
  $("pTotal").textContent=total+" / "+(PERENCANAAN.length*4);
  $("pNilai").textContent=nilai.toFixed(2);
}

function renderObservasi(){
  const saved=dataSupervisi.observasi||{};
  const values=saved.items||[];
  $("observasiBody").innerHTML=groupRows(OBSERVASI,(it,i)=>{
    const v=values[i]||{};
    return `<tr>
      <td class="num">${i+1}</td><td>${esc(it.text)}</td>
      <td><textarea class="input small-area" id="o_bukti_${i}" placeholder="Bukti pembelajaran">${esc(v.bukti||"")}</textarea></td>
      <td><textarea class="input small-area" id="o_catatan_${i}" placeholder="Catatan supervisor">${esc(v.catatan||"")}</textarea></td>
    </tr>`;
  });
  $("o_pelajaran").value=saved.pelajaran||"";
  $("o_belum").value=saved.belum_memuaskan||"";
  $("o_tindak").value=saved.tindak_lanjut||"";
}
function collectObservasi(){
  return {
    items:OBSERVASI.map((it,i)=>({no:i+1,aspek:it.text,kelompok:it.group,bukti:$("o_bukti_"+i).value.trim(),catatan:$("o_catatan_"+i).value.trim()})),
    pelajaran:$("o_pelajaran").value.trim(),
    belum_memuaskan:$("o_belum").value.trim(),
    tindak_lanjut:$("o_tindak").value.trim()
  };
}

function categoryBK(n){
  if(n>=91)return "Sangat Memuaskan";
  if(n>=81)return "Memuaskan";
  if(n>=71)return "Cukup Memuaskan";
  return "Tidak Memuaskan";
}
function renderBK(){
  const saved=dataSupervisi.bk||{};
  const values=saved.items||[];
  $("bkBody").innerHTML=groupRows(BK,(it,i)=>{
    const v=values[i]||{};
    return `<tr>
      <td class="num">${i+1}</td><td>${esc(it.text)}</td>
      <td><input class="input bk-score" id="bk_score_${i}" type="number" min="0" max="100" value="${esc(v.skor??"")}" placeholder="0-100"></td>
      <td><textarea class="input small-area" id="bk_catatan_${i}" placeholder="Bukti fisik / catatan">${esc(v.catatan||"")}</textarea></td>
    </tr>`;
  });
  $("bk_rek_guru").value=saved.rekomendasi_guru||"";
  $("bk_rek_kepala").value=saved.rekomendasi_kepala||"";
  $("bk_catatan_umum").value=saved.catatan||"";
  updateBKScore();
  document.querySelectorAll(".bk-score").forEach(x=>x.addEventListener("input",updateBKScore));
}
function collectBK(){
  const items=BK.map((it,i)=>({
    no:i+1,aspek:it.text,kelompok:it.group,
    skor:Number($("bk_score_"+i).value||0),
    catatan:$("bk_catatan_"+i).value.trim()
  }));
  const filled=items.filter(x=>Number.isFinite(x.skor));
  const avg=items.length?Math.round((items.reduce((a,b)=>a+b.skor,0)/items.length)*100)/100:0;
  return {items,nilai_akhir:avg,kategori:categoryBK(avg),rekomendasi_guru:$("bk_rek_guru").value.trim(),rekomendasi_kepala:$("bk_rek_kepala").value.trim(),catatan:$("bk_catatan_umum").value.trim()};
}
function updateBKScore(){
  const vals=BK.map((_,i)=>Number($("bk_score_"+i)?.value||0));
  const avg=vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:0;
  $("bkNilai").textContent=avg.toFixed(2);
  $("bkKategori").textContent=categoryBK(avg);
}

async function saveSection(section){
  const payload=section==="perencanaan"?collectPerencanaan():section==="observasi"?collectObservasi():collectBK();
  await setDoc(doc(db,"supervisi",jadwalId),{
    jadwal_id:jadwalId,
    penugasan_id:jadwal.penugasan_id||"",
    supervisor_id:jadwal.supervisor_id,
    guru_id:jadwal.guru_id,
    jenis_instrumen:jadwal.jenis_instrumen||"pembelajaran",
    [section]:{...payload,disimpan_pada:new Date().toISOString()},
    updated_at:serverTimestamp()
  },{merge:true});
  dataSupervisi[section]={...payload,disimpan_pada:new Date().toISOString()};
  if(String(jadwal.status||"").toLowerCase()==="terjadwal"){
    await updateDoc(doc(db,"jadwal",jadwalId),{status:"Proses",updated_at:serverTimestamp()});
    jadwal.status="Proses";$("infoStatus").textContent="Proses";
  }
  alert("Bagian "+section+" berhasil disimpan.");
}

async function finalize(){
  if(jadwal.jenis_instrumen==="bk"){
    const d=collectBK();
    const missing=d.items.some(x=>!Number.isFinite(x.skor)||x.skor<0||x.skor>100);
    if(missing)return alert("Lengkapi skor 0-100 seluruh aspek BK terlebih dahulu.");
    await saveSection("bk");
  }else{
    const p=collectPerencanaan();
    if(p.items.some(x=>!x.skor))return alert("Lengkapi skor 1-4 seluruh aspek Perencanaan Pembelajaran.");
    const o=collectObservasi();
    if(!o.pelajaran||!o.belum_memuaskan||!o.tindak_lanjut)return alert("Lengkapi tiga bagian Refleksi dan Tindak Lanjut.");
    await saveSection("perencanaan");
    await saveSection("observasi");
  }
  await updateDoc(doc(db,"jadwal",jadwalId),{status:"Selesai",updated_at:serverTimestamp()});
  await setDoc(doc(db,"supervisi",jadwalId),{status:"Selesai",selesai_pada:serverTimestamp()},{merge:true});
  jadwal.status="Selesai";$("infoStatus").textContent="Selesai";
  alert("Supervisi ditandai SELESAI.");
}

function docHead(title){
 return `<!doctype html><html><head><meta charset="utf-8"><style>
 body{font-family:Arial,sans-serif;font-size:11pt;line-height:1.35}h1{font-size:16pt;text-align:center}
 table{width:100%;border-collapse:collapse}th,td{border:1px solid #222;padding:6px;vertical-align:top}th{background:#eee}
 .meta td{border:0;padding:2px 4px}.group{font-weight:bold;background:#e9eef7}
 </style></head><body><h1>${esc(title)}</h1>
 <table class="meta"><tr><td>Nama Guru</td><td>: ${esc(guru?.nama||"")}</td></tr>
 <tr><td>Mata Pelajaran</td><td>: ${esc(jadwal?.mapel||"")}</td></tr>
 <tr><td>Kelas</td><td>: ${esc(jadwal?.kelas||"")}</td></tr>
 <tr><td>Tanggal</td><td>: ${esc(formatDate(jadwal?.tanggal||""))}</td></tr>
 <tr><td>Supervisor</td><td>: ${esc(supervisor?.nama||"")}</td></tr></table><br>`;
}
function downloadDoc(filename,html){
  return downloadWord(filename,html);
}
function printHtml(html,title="Dokumen Supervisi"){
  return printPdf(html,title);
}

function perencanaanHtml(){
 const d=collectPerencanaan(); let last="";
 let rows=d.items.map(x=>{let g="";if(x.kelompok!==last){g=`<tr><td colspan="4" class="group">${esc(x.kelompok)}</td></tr>`;last=x.kelompok;}return g+`<tr><td>${x.no}</td><td>${esc(x.aspek)}</td><td>${nl(x.umpan_balik)}</td><td>${x.skor||""}</td></tr>`;}).join("");
 return docHead("INSTRUMEN UMPAN BALIK PERENCANAAN PEMBELAJARAN")+`<p>Skala: 1 = hampir tidak ada; 2 = sedikit dan lemah; 3 = cukup; 4 = memadai.</p><table><tr><th>No</th><th>Aspek yang diamati</th><th>Umpan balik</th><th>Skala</th></tr>${rows}</table>
 <p><b>Total Skor:</b> ${d.total_skor} / ${d.skor_maksimal} &nbsp; <b>Nilai:</b> ${d.nilai.toFixed(2)}</p>
 <p><b>Kelebihan Perencanaan Pembelajaran:</b><br>${nl(d.kelebihan)}</p>
 <p><b>Hal yang perlu ditingkatkan:</b><br>${nl(d.perlu_ditingkatkan)}</p>
 <p><b>Rekomendasi perbaikan sesuai prinsip PM:</b><br>${nl(d.rekomendasi)}</p></body></html>`;
}
function observasiHtml(){
 const d=collectObservasi();let last="";
 const rows=d.items.map(x=>{let g="";if(x.kelompok!==last){g=`<tr><td colspan="4" class="group">${esc(x.kelompok)}</td></tr>`;last=x.kelompok;}return g+`<tr><td>${x.no}</td><td>${esc(x.aspek)}</td><td>${nl(x.bukti)}</td><td>${nl(x.catatan)}</td></tr>`;}).join("");
 return docHead("INSTRUMEN OBSERVASI IMPLEMENTASI DAN REFLEKSI PERENCANAAN PEMBELAJARAN")+`<table><tr><th>No</th><th>Aspek yang diamati</th><th>Bukti Pembelajaran</th><th>Catatan</th></tr>${rows}</table>
 <h3>Refleksi</h3><p><b>Pelajaran yang diperoleh dan faktor pendukung:</b><br>${nl(d.pelajaran)}</p>
 <p><b>Hal yang belum memuaskan dan faktor penghambat:</b><br>${nl(d.belum_memuaskan)}</p>
 <p><b>Rencana tindak lanjut:</b><br>${nl(d.tindak_lanjut)}</p></body></html>`;
}
function bkHtml(){
 const d=collectBK();let last="";
 const rows=d.items.map(x=>{let g="";if(x.kelompok!==last){g=`<tr><td colspan="4" class="group">${esc(x.kelompok)}</td></tr>`;last=x.kelompok;}return g+`<tr><td>${x.no}</td><td>${esc(x.aspek)}</td><td>${x.skor}</td><td>${nl(x.catatan)}</td></tr>`;}).join("");
 return docHead("INSTRUMEN SUPERVISI GURU BK")+`<table><tr><th>No</th><th>Aspek Evaluasi</th><th>Skor</th><th>Bukti Fisik / Catatan</th></tr>${rows}</table>
 <p><b>Nilai Akhir:</b> ${d.nilai_akhir.toFixed(2)} &nbsp; <b>Kategori:</b> ${esc(d.kategori)}</p>
 <p><b>Rekomendasi kepada Guru:</b><br>${nl(d.rekomendasi_guru)}</p>
 <p><b>Rekomendasi kepada Kepala:</b><br>${nl(d.rekomendasi_kepala)}</p>
 <p><b>Catatan:</b><br>${nl(d.catatan)}</p></body></html>`;
}
function ringkasanHtml(){
 const p=dataSupervisi.perencanaan||collectPerencanaan();
 const o=dataSupervisi.observasi||collectObservasi();
 const b=dataSupervisi.bk||collectBK();
 return docHead("RINGKASAN HASIL SUPERVISI")+`<p><b>Status:</b> ${esc(jadwal.status||"")}</p>
 ${jadwal.jenis_instrumen==="bk"?`<p><b>Nilai Akhir BK:</b> ${Number(b.nilai_akhir||0).toFixed(2)} (${esc(b.kategori||"")})</p><p><b>Rekomendasi Guru:</b><br>${nl(b.rekomendasi_guru||"")}</p>`:
 `<p><b>Nilai Perencanaan:</b> ${Number(p.nilai||0).toFixed(2)}</p>
 <p><b>Kelebihan:</b><br>${nl(p.kelebihan||"")}</p><p><b>Hal yang perlu ditingkatkan:</b><br>${nl(p.perlu_ditingkatkan||"")}</p>
 <p><b>Rekomendasi:</b><br>${nl(p.rekomendasi||"")}</p><p><b>Rencana tindak lanjut:</b><br>${nl(o.tindak_lanjut||"")}</p>`}
 </body></html>`;
}

$("btnSavePerencanaan")?.addEventListener("click",()=>saveSection("perencanaan"));
$("btnSaveObservasi")?.addEventListener("click",()=>saveSection("observasi"));
$("btnSaveBK")?.addEventListener("click",()=>saveSection("bk"));
$("btnFinalize")?.addEventListener("click",finalize);
$("btnDocPerencanaan")?.addEventListener("click",()=>downloadDoc(`Perencanaan_${guru?.nama||jadwalId}.doc`,perencanaanHtml()));
$("btnPdfPerencanaan")?.addEventListener("click",()=>printHtml(perencanaanHtml(),"Perencanaan Pembelajaran"));
$("btnDocObservasi")?.addEventListener("click",()=>downloadDoc(`Observasi_Refleksi_${guru?.nama||jadwalId}.doc`,observasiHtml()));
$("btnPdfObservasi")?.addEventListener("click",()=>printHtml(observasiHtml(),"Observasi dan Refleksi"));
$("btnDocBK")?.addEventListener("click",()=>downloadDoc(`Supervisi_BK_${guru?.nama||jadwalId}.doc`,bkHtml()));
$("btnPdfBK")?.addEventListener("click",()=>printHtml(bkHtml(),"Supervisi Guru BK"));
$("btnDocRingkasan")?.addEventListener("click",()=>downloadDoc(`Ringkasan_Supervisi_${guru?.nama||jadwalId}.doc`,ringkasanHtml()));
$("btnPdfRingkasan")?.addEventListener("click",()=>printHtml(ringkasanHtml(),"Ringkasan Hasil Supervisi"));

async function load(){
 if(!jadwalId)throw new Error("jadwal_id tidak ditemukan.");
 const j=await getDoc(doc(db,"jadwal",jadwalId));if(!j.exists())throw new Error("Jadwal tidak ditemukan.");
 jadwal={id:j.id,...j.data()};
 const [g,s,sp]=await Promise.all([
  getDoc(doc(db,"guru",jadwal.guru_id)),
  getDoc(doc(db,"supervisors",jadwal.supervisor_id)),
  getDoc(doc(db,"supervisi",jadwalId))
 ]);
 guru=g.exists()?g.data():{};supervisor=s.exists()?s.data():{};dataSupervisi=sp.exists()?sp.data():{};
 renderIdentity();
 if(jadwal.jenis_instrumen==="bk"){
   $("panelPembelajaran").style.display="none";$("panelBK").style.display="block";renderBK();
 }else{
   $("panelPembelajaran").style.display="block";$("panelBK").style.display="none";renderPerencanaan();renderObservasi();
 }
}

onAuthStateChanged(auth,async u=>{
 if(!u)return;currentUid=u.uid;
 try{
   const us=await getDoc(doc(db,"users",u.uid));
   if(!us.exists()||String(us.data().role||"").toLowerCase()!=="supervisor")throw new Error("Halaman ini hanya untuk supervisor.");
   await load();
   if(us.data().referensi_id!==jadwal.supervisor_id)throw new Error("Jadwal ini bukan milik supervisor yang sedang login.");
 }catch(e){console.error(e);$("formMessage").textContent="Gagal memuat: "+e.message;}
});
