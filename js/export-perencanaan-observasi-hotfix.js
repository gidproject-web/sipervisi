
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
  function text(id){ return $(id)?.textContent?.trim() ?? ""; }

  function meta(title){
    return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title>
    <style>
      @page{size:A4;margin:14mm}
      body{font-family:Arial,sans-serif;color:#111;font-size:11pt;line-height:1.35}
      h1{text-align:center;font-size:16pt;margin:0 0 18px}
      h2{font-size:13pt;margin:20px 0 10px}
      table{width:100%;border-collapse:collapse}
      th,td{border:1px solid #222;padding:6px;vertical-align:top}
      th{background:#eee}
      .meta td{border:0;padding:2px 4px}
      .group td{background:#e8eef7;font-weight:700}
      .summary{margin-top:14px}
      .summary p{margin:8px 0}
    </style></head><body>
    <h1>${esc(title)}</h1>
    <table class="meta">
      <tr><td>Nama Guru</td><td>: ${esc(text("infoGuru"))}</td></tr>
      <tr><td>Mata Pelajaran/Layanan</td><td>: ${esc(text("infoMapel"))}</td></tr>
      <tr><td>Kelas</td><td>: ${esc(text("infoKelas"))}</td></tr>
      <tr><td>Tanggal</td><td>: ${esc(text("infoTanggal"))}</td></tr>
      <tr><td>Supervisor</td><td>: ${esc(text("infoSupervisor"))}</td></tr>
    </table><br>`;
  }

  function readPerencanaan(){
    const rows = [];
    const body = $("perencanaanBody");
    if(!body) return rows;

    let currentGroup = "";
    [...body.querySelectorAll("tr")].forEach(tr=>{
      if(tr.classList.contains("group-row")){
        currentGroup = tr.textContent.trim();
        rows.push({group:currentGroup});
        return;
      }
      const cells = tr.querySelectorAll("td");
      if(cells.length < 4) return;
      const no = cells[0].textContent.trim();
      const aspek = cells[1].textContent.trim();
      const ta = tr.querySelector("textarea");
      const sel = tr.querySelector("select");
      rows.push({no,aspek,umpan:ta?.value||"",skor:sel?.value||""});
    });
    return rows;
  }

  function readObservasi(){
    const rows = [];
    const body = $("observasiBody");
    if(!body) return rows;

    [...body.querySelectorAll("tr")].forEach(tr=>{
      if(tr.classList.contains("group-row")){
        rows.push({group:tr.textContent.trim()});
        return;
      }
      const cells = tr.querySelectorAll("td");
      if(cells.length < 4) return;
      const no = cells[0].textContent.trim();
      const aspek = cells[1].textContent.trim();
      const areas = tr.querySelectorAll("textarea");
      rows.push({
        no, aspek,
        bukti: areas[0]?.value||"",
        catatan: areas[1]?.value||""
      });
    });
    return rows;
  }

  function perencanaanHtml(){
    const rows = readPerencanaan();
    let total=0, count=0;
    let body="";
    rows.forEach(r=>{
      if(r.group){
        body += `<tr class="group"><td colspan="4">${esc(r.group)}</td></tr>`;
      }else{
        const n=Number(r.skor||0); total+=n; if(r.skor) count++;
        body += `<tr><td>${esc(r.no)}</td><td>${esc(r.aspek)}</td><td>${nl(r.umpan)}</td><td style="text-align:center">${esc(r.skor)}</td></tr>`;
      }
    });
    const max = rows.filter(x=>!x.group).length*4;
    const nilai = max ? (total/max*100) : 0;

    return meta("INSTRUMEN UMPAN BALIK PERENCANAAN PEMBELAJARAN")+
    `<p>Skala: 1 = hampir tidak ada; 2 = sedikit dan lemah; 3 = cukup; 4 = memadai.</p>
    <table><thead><tr><th>No</th><th>Aspek yang diamati</th><th>Umpan balik</th><th>Skala</th></tr></thead><tbody>${body}</tbody></table>
    <div class="summary">
      <p><b>Total Skor:</b> ${total} / ${max} &nbsp;&nbsp; <b>Nilai:</b> ${nilai.toFixed(2)}</p>
      <p><b>Kelebihan Perencanaan Pembelajaran:</b><br>${nl(val("p_kelebihan"))}</p>
      <p><b>Hal yang perlu ditingkatkan:</b><br>${nl(val("p_tingkatkan"))}</p>
      <p><b>Rekomendasi perbaikan sesuai prinsip PM:</b><br>${nl(val("p_rekomendasi"))}</p>
    </div></body></html>`;
  }

  function observasiHtml(){
    const rows=readObservasi();
    let body="";
    rows.forEach(r=>{
      if(r.group){
        body += `<tr class="group"><td colspan="4">${esc(r.group)}</td></tr>`;
      }else{
        body += `<tr><td>${esc(r.no)}</td><td>${esc(r.aspek)}</td><td>${nl(r.bukti)}</td><td>${nl(r.catatan)}</td></tr>`;
      }
    });

    return meta("INSTRUMEN OBSERVASI IMPLEMENTASI DAN REFLEKSI PERENCANAAN PEMBELAJARAN")+
    `<table><thead><tr><th>No</th><th>Aspek yang diamati</th><th>Bukti Pembelajaran</th><th>Catatan</th></tr></thead><tbody>${body}</tbody></table>
    <div class="summary">
      <h2>Refleksi</h2>
      <p><b>Pelajaran yang diperoleh dan faktor pendukung:</b><br>${nl(val("o_pelajaran"))}</p>
      <p><b>Hal yang belum memuaskan dan faktor penghambat:</b><br>${nl(val("o_belum"))}</p>
      <p><b>Rencana tindak lanjut:</b><br>${nl(val("o_tindak"))}</p>
    </div></body></html>`;
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
    },500);
  }

  function intercept(id,handler){
    const el=$(id);
    if(!el) return;
    el.setAttribute("type","button");
    el.addEventListener("click",e=>{
      e.preventDefault();
      e.stopImmediatePropagation();
      try{ handler(); }
      catch(err){
        console.error(err);
        alert("Ekspor gagal: "+err.message);
      }
    },true);
  }

  document.addEventListener("DOMContentLoaded",()=>{
    intercept("btnDocPerencanaan",()=>downloadWord(`Perencanaan_${text("infoGuru")||"Guru"}.doc`,perencanaanHtml()));
    intercept("btnPdfPerencanaan",()=>printHtml(perencanaanHtml(),"Perencanaan Pembelajaran"));
    intercept("btnDocObservasi",()=>downloadWord(`Observasi_Refleksi_${text("infoGuru")||"Guru"}.doc`,observasiHtml()));
    intercept("btnPdfObservasi",()=>printHtml(observasiHtml(),"Observasi Implementasi dan Refleksi"));
  });
})();
