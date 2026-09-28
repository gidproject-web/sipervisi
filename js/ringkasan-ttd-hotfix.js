
(function(){
  "use strict";
  const $ = id => document.getElementById(id);

  function esc(v=""){
    return String(v ?? "").replace(/[&<>"']/g, m => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
    }[m]));
  }
  function nl(v=""){ return esc(v).replace(/\n/g,"<br>"); }
  function val(id){ return $(id)?.value ?? ""; }
  function txt(id){ return $(id)?.textContent?.trim() ?? ""; }

  function supervisorName(){
    return txt("infoSupervisor") || "Supervisor";
  }
  function guruName(){
    return txt("infoGuru") || "Guru";
  }

  function signatureBlock(){
    const sup = supervisorName();
    return `
      <div class="signature-wrap">
        <div class="signature-box">
          <p>Lubuklinggau, ................................ 2026</p>
          <p>Mengetahui,<br>Supervisor,</p>
          <div class="signature-space"></div>
          <p class="signature-name"><b>${esc(sup)}</b></p>
          <p>NIP. ....................................................</p>
        </div>
      </div>`;
  }

  function baseCss(){
    return `
      <style>
        @page{size:A4;margin:14mm}
        body{font-family:Arial,sans-serif;color:#111;font-size:11pt;line-height:1.35}
        h1{text-align:center;font-size:16pt;margin:0 0 18px}
        h2{font-size:13pt;margin:20px 0 10px}
        h3{font-size:12pt;margin:15px 0 8px}
        table{width:100%;border-collapse:collapse}
        th,td{border:1px solid #222;padding:6px;vertical-align:top}
        th{background:#eee}
        .meta td{border:0;padding:2px 4px}
        .group td{background:#e8eef7;font-weight:700}
        .summary{margin-top:14px}
        .summary p{margin:8px 0}
        .signature-wrap{display:flex;justify-content:flex-end;margin-top:34px;page-break-inside:avoid}
        .signature-box{width:280px;text-align:left}
        .signature-space{height:70px}
        .signature-name{margin-bottom:2px}
      </style>`;
  }

  function header(title){
    return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title>${baseCss()}</head><body>
      <h1>${esc(title)}</h1>
      <table class="meta">
        <tr><td>Nama Guru</td><td>: ${esc(guruName())}</td></tr>
        <tr><td>Mata Pelajaran/Layanan</td><td>: ${esc(txt("infoMapel"))}</td></tr>
        <tr><td>Kelas</td><td>: ${esc(txt("infoKelas"))}</td></tr>
        <tr><td>Tanggal</td><td>: ${esc(txt("infoTanggal"))}</td></tr>
        <tr><td>Supervisor</td><td>: ${esc(supervisorName())}</td></tr>
      </table><br>`;
  }

  function readPerencanaan(){
    const rows=[];
    const body=$("perencanaanBody");
    if(!body) return rows;
    [...body.querySelectorAll("tr")].forEach(tr=>{
      if(tr.classList.contains("group-row")){
        rows.push({group:tr.textContent.trim()});
        return;
      }
      const tds=tr.querySelectorAll("td");
      if(tds.length<4) return;
      rows.push({
        no:tds[0].textContent.trim(),
        aspek:tds[1].textContent.trim(),
        umpan:tr.querySelector("textarea")?.value||"",
        skor:tr.querySelector("select")?.value||""
      });
    });
    return rows;
  }

  function readObservasi(){
    const rows=[];
    const body=$("observasiBody");
    if(!body) return rows;
    [...body.querySelectorAll("tr")].forEach(tr=>{
      if(tr.classList.contains("group-row")){
        rows.push({group:tr.textContent.trim()});
        return;
      }
      const tds=tr.querySelectorAll("td");
      if(tds.length<4) return;
      const tas=tr.querySelectorAll("textarea");
      rows.push({
        no:tds[0].textContent.trim(),
        aspek:tds[1].textContent.trim(),
        bukti:tas[0]?.value||"",
        catatan:tas[1]?.value||""
      });
    });
    return rows;
  }

  function readBK(){
    const rows=[];
    const body=$("bkBody");
    if(!body) return rows;
    [...body.querySelectorAll("tr")].forEach(tr=>{
      if(tr.classList.contains("group-row")){
        rows.push({group:tr.textContent.trim()});
        return;
      }
      const tds=tr.querySelectorAll("td");
      if(tds.length<4) return;
      rows.push({
        no:tds[0].textContent.trim(),
        aspek:tds[1].textContent.trim(),
        skor:tr.querySelector('input[type="number"]')?.value||"",
        catatan:tr.querySelector("textarea")?.value||""
      });
    });
    return rows;
  }

  function perencanaanHtml(){
    const rows=readPerencanaan();
    let total=0, max=0, body="";
    rows.forEach(r=>{
      if(r.group){
        body+=`<tr class="group"><td colspan="4">${esc(r.group)}</td></tr>`;
      }else{
        const n=Number(r.skor||0); total+=n; max+=4;
        body+=`<tr><td>${esc(r.no)}</td><td>${esc(r.aspek)}</td><td>${nl(r.umpan)}</td><td style="text-align:center">${esc(r.skor)}</td></tr>`;
      }
    });
    const nilai=max?total/max*100:0;
    return header("INSTRUMEN UMPAN BALIK PERENCANAAN PEMBELAJARAN")+
      `<p>Skala: 1 = hampir tidak ada; 2 = sedikit dan lemah; 3 = cukup; 4 = memadai.</p>
       <table><thead><tr><th>No</th><th>Aspek yang diamati</th><th>Umpan balik</th><th>Skala</th></tr></thead><tbody>${body}</tbody></table>
       <div class="summary">
         <p><b>Total Skor:</b> ${total} / ${max} &nbsp;&nbsp; <b>Nilai:</b> ${nilai.toFixed(2)}</p>
         <p><b>Kelebihan Perencanaan Pembelajaran:</b><br>${nl(val("p_kelebihan"))}</p>
         <p><b>Hal yang perlu ditingkatkan:</b><br>${nl(val("p_tingkatkan"))}</p>
         <p><b>Rekomendasi perbaikan sesuai prinsip PM:</b><br>${nl(val("p_rekomendasi"))}</p>
       </div>${signatureBlock()}</body></html>`;
  }

  function observasiHtml(){
    const rows=readObservasi();
    let body="";
    rows.forEach(r=>{
      if(r.group){
        body+=`<tr class="group"><td colspan="4">${esc(r.group)}</td></tr>`;
      }else{
        body+=`<tr><td>${esc(r.no)}</td><td>${esc(r.aspek)}</td><td>${nl(r.bukti)}</td><td>${nl(r.catatan)}</td></tr>`;
      }
    });
    return header("INSTRUMEN OBSERVASI IMPLEMENTASI DAN REFLEKSI PERENCANAAN PEMBELAJARAN")+
      `<table><thead><tr><th>No</th><th>Aspek yang diamati</th><th>Bukti Pembelajaran</th><th>Catatan</th></tr></thead><tbody>${body}</tbody></table>
       <div class="summary">
         <h2>Refleksi</h2>
         <p><b>Pelajaran yang diperoleh dan faktor pendukung:</b><br>${nl(val("o_pelajaran"))}</p>
         <p><b>Hal yang belum memuaskan dan faktor penghambat:</b><br>${nl(val("o_belum"))}</p>
         <p><b>Rencana tindak lanjut:</b><br>${nl(val("o_tindak"))}</p>
       </div>${signatureBlock()}</body></html>`;
  }

  function bkHtml(){
    const rows=readBK();
    let body="",sum=0,count=0;
    rows.forEach(r=>{
      if(r.group){
        body+=`<tr class="group"><td colspan="4">${esc(r.group)}</td></tr>`;
      }else{
        const n=Number(r.skor||0);
        if(r.skor!==""){sum+=n;count++;}
        body+=`<tr><td>${esc(r.no)}</td><td>${esc(r.aspek)}</td><td>${esc(r.skor)}</td><td>${nl(r.catatan)}</td></tr>`;
      }
    });
    const avg=count?sum/count:0;
    const kat=avg>=91?"Sangat Memuaskan":avg>=81?"Memuaskan":avg>=71?"Cukup Memuaskan":"Tidak Memuaskan";
    return header("INSTRUMEN SUPERVISI GURU BK")+
      `<table><thead><tr><th>No</th><th>Aspek Evaluasi</th><th>Skor</th><th>Bukti Fisik / Catatan</th></tr></thead><tbody>${body}</tbody></table>
       <div class="summary">
         <p><b>Nilai Akhir:</b> ${avg.toFixed(2)} &nbsp;&nbsp; <b>Kategori:</b> ${esc(kat)}</p>
         <p><b>Rekomendasi kepada Guru:</b><br>${nl(val("bk_rek_guru"))}</p>
         <p><b>Rekomendasi kepada Kepala:</b><br>${nl(val("bk_rek_kepala"))}</p>
         <p><b>Catatan:</b><br>${nl(val("bk_catatan_umum"))}</p>
       </div>${signatureBlock()}</body></html>`;
  }

  function ringkasanHtml(){
    const isBK = $("panelBK") && getComputedStyle($("panelBK")).display!=="none";
    if(isBK){
      const rows=readBK().filter(x=>!x.group);
      const scores=rows.map(x=>Number(x.skor||0)).filter((_,i)=>rows[i].skor!=="");
      const avg=scores.length?scores.reduce((a,b)=>a+b,0)/scores.length:0;
      const kat=avg>=91?"Sangat Memuaskan":avg>=81?"Memuaskan":avg>=71?"Cukup Memuaskan":"Tidak Memuaskan";
      return header("RINGKASAN HASIL SUPERVISI GURU BK")+
        `<div class="summary">
          <p><b>Nilai Akhir:</b> ${avg.toFixed(2)}</p>
          <p><b>Kategori:</b> ${esc(kat)}</p>
          <p><b>Rekomendasi kepada Guru:</b><br>${nl(val("bk_rek_guru"))}</p>
          <p><b>Rekomendasi kepada Kepala:</b><br>${nl(val("bk_rek_kepala"))}</p>
          <p><b>Catatan:</b><br>${nl(val("bk_catatan_umum"))}</p>
        </div>${signatureBlock()}</body></html>`;
    }

    const pRows=readPerencanaan().filter(x=>!x.group);
    let total=0,max=0;
    pRows.forEach(r=>{ total+=Number(r.skor||0); max+=4; });
    const nilai=max?total/max*100:0;

    return header("RINGKASAN HASIL SUPERVISI AKADEMIK")+
      `<div class="summary">
        <h2>A. Perencanaan Pembelajaran</h2>
        <p><b>Nilai Perencanaan:</b> ${nilai.toFixed(2)}</p>
        <p><b>Kelebihan:</b><br>${nl(val("p_kelebihan"))}</p>
        <p><b>Hal yang perlu ditingkatkan:</b><br>${nl(val("p_tingkatkan"))}</p>
        <p><b>Rekomendasi:</b><br>${nl(val("p_rekomendasi"))}</p>

        <h2>B. Observasi Implementasi dan Refleksi</h2>
        <p><b>Pelajaran yang diperoleh dan faktor pendukung:</b><br>${nl(val("o_pelajaran"))}</p>
        <p><b>Hal yang belum memuaskan dan faktor penghambat:</b><br>${nl(val("o_belum"))}</p>
        <p><b>Rencana tindak lanjut:</b><br>${nl(val("o_tindak"))}</p>
      </div>${signatureBlock()}</body></html>`;
  }

  function safeName(v){
    return String(v||"dokumen").replace(/[\\/:*?"<>|]+/g,"-").replace(/\s+/g,"_");
  }
  function downloadWord(name,html){
    const blob=new Blob(["\ufeff",html],{type:"application/msword;charset=utf-8"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;
    a.download=safeName(name);
    a.style.display="none";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),3000);
  }
  function printHtml(html,title){
    const frame=document.createElement("iframe");
    frame.style.cssText="position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden";
    document.body.appendChild(frame);
    const d=frame.contentWindow.document;
    d.open(); d.write(html); d.close();
    d.title=title;
    setTimeout(()=>{
      frame.contentWindow.focus();
      frame.contentWindow.print();
      setTimeout(()=>frame.remove(),3000);
    },600);
  }
  function intercept(id,handler){
    const el=$(id);
    if(!el) return;
    el.setAttribute("type","button");
    el.addEventListener("click",e=>{
      e.preventDefault();
      e.stopImmediatePropagation();
      try{ handler(); }catch(err){console.error(err);alert("Ekspor gagal: "+err.message);}
    },true);
  }

  document.addEventListener("DOMContentLoaded",()=>{
    // Bagian 1
    intercept("btnDocPerencanaan",()=>downloadWord(`Perencanaan_${guruName()}.doc`,perencanaanHtml()));
    intercept("btnPdfPerencanaan",()=>printHtml(perencanaanHtml(),"Perencanaan Pembelajaran"));

    // Bagian 2
    intercept("btnDocObservasi",()=>downloadWord(`Observasi_Refleksi_${guruName()}.doc`,observasiHtml()));
    intercept("btnPdfObservasi",()=>printHtml(observasiHtml(),"Observasi Implementasi dan Refleksi"));

    // BK
    intercept("btnDocBK",()=>downloadWord(`Supervisi_BK_${guruName()}.doc`,bkHtml()));
    intercept("btnPdfBK",()=>printHtml(bkHtml(),"Supervisi Guru BK"));

    // Ringkasan bawah
    intercept("btnDocRingkasan",()=>downloadWord(`Ringkasan_Supervisi_${guruName()}.doc`,ringkasanHtml()));
    intercept("btnPdfRingkasan",()=>printHtml(ringkasanHtml(),"Ringkasan Hasil Supervisi"));
  });
})();
