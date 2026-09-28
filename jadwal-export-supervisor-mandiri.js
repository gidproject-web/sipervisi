/* SIPERVISI V12: export the already rendered supervisor schedule.
   No extra Firebase queries and no dependency on jadwal-export-helper.js. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const clean = value => String(value ?? '').replace(/\s+/g,' ').trim();
  const safe = value => clean(value).replace(/[\\/:*?"<>|]/g,'-').replace(/\s+/g,'_') || 'Supervisor';
  const labels = ['No', 'Tanggal', 'Jam', 'Guru', 'Kelas', 'Mapel/Layanan', 'Instrumen', 'Status'];
  function getRows() {
    const body = $('jadwalSupervisorBody');
    if (!body) return [];
    return Array.from(body.querySelectorAll('tr')).map(tr => {
      const cells = Array.from(tr.querySelectorAll(':scope > td'));
      // Ignore the loading, empty, or error row (colspan=9).
      if (cells.length < 9) return null;
      return cells.slice(0,8).map(td => clean(td.innerText || td.textContent));
    }).filter(Boolean);
  }
  function supervisorName() {
    const stored = (() => { try { return JSON.parse(localStorage.getItem('sipervisi_user') || '{}'); } catch { return {}; } })();
    return clean(stored.nama || stored.name || stored.nama_lengkap || stored.displayName || stored.referensi_id || 'Supervisor');
  }
  function update() {
    const rows = getRows();
    const info = $('jadwalExportSupervisorInfo');
    if (info) info.textContent = `${supervisorName()} • ${rows.length} jadwal siap diekspor`;
    for (const id of ['btnJadwalWordSupervisor','btnJadwalPrintSupervisor']) {
      const b = $(id); if (b) b.disabled = rows.length === 0;
    }
  }
  function documentHtml(rows) {
    const name = supervisorName();
    const tableHead = labels.map(v=>`<th>${esc(v)}</th>`).join('');
    const tableBody = rows.map(r=>`<tr>${r.map(v=>`<td>${esc(v)}</td>`).join('')}</tr>`).join('');
    return `<!doctype html><html lang="id"><head><meta charset="utf-8"><title>Jadwal Supervisi - ${esc(name)}</title>
    <style>@page{size:A4 landscape;margin:13mm}body{font-family:Arial,sans-serif;color:#111;font-size:10pt}
    h1{text-align:center;font-size:16pt;margin:0 0 6px}h2{text-align:center;font-size:12pt;font-weight:normal;margin:0 0 20px}
    table{border-collapse:collapse;width:100%}th,td{border:1px solid #333;padding:7px 6px;vertical-align:top}th{background:#eaf0f8}
    .sign{margin:34px 0 0 auto;width:270px;page-break-inside:avoid}.space{height:72px}</style></head><body>
    <h1>JADWAL SUPERVISI AKADEMIK</h1><h2>SMA NEGERI 4 LUBUKLINGGAU<br>Supervisor: ${esc(name)}</h2>
    <table><thead><tr>${tableHead}</tr></thead><tbody>${tableBody}</tbody></table>
    <p>Jumlah jadwal: ${rows.length}</p><div class="sign">Lubuklinggau, ..............................<br>Mengetahui,<br>Supervisor,<div class="space"></div><b>${esc(name)}</b></div>
    </body></html>`;
  }
  function downloadWord() {
    const rows = getRows();
    if (!rows.length) { alert('Daftar jadwal belum tampil. Tunggu hingga jadwal dimuat.'); return; }
    const blob = new Blob(['\ufeff', documentHtml(rows)], {type:'application/msword;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a'); link.href=url; link.download=`Jadwal_Supervisi_${safe(supervisorName())}.doc`;
    document.body.appendChild(link); link.click(); link.remove();
    setTimeout(()=>URL.revokeObjectURL(url), 30000);
  }
  function printSchedule() {
    const rows = getRows();
    if (!rows.length) { alert('Daftar jadwal belum tampil. Tunggu hingga jadwal dimuat.'); return; }
    // Open synchronously from the click event; do not await anything before window.open.
    const w = window.open('', '_blank');
    if (!w) { alert('Browser memblokir pop-up. Izinkan pop-up untuk sipervisi.smanpa.id dan coba lagi.'); return; }
    w.document.open(); w.document.write(documentHtml(rows)); w.document.close();
    w.focus(); w.addEventListener('load', () => w.print(), {once:true});
    setTimeout(() => { try { w.focus(); w.print(); } catch(e) { console.error(e); } }, 500);
  }
  function init() {
    const body=$('jadwalSupervisorBody'), word=$('btnJadwalWordSupervisor'), print=$('btnJadwalPrintSupervisor');
    if (!body || !word || !print) { console.error('Elemen ekspor jadwal supervisor tidak ditemukan.'); return; }
    word.addEventListener('click', downloadWord);
    print.addEventListener('click', printSchedule);
    new MutationObserver(update).observe(body,{childList:true,subtree:true,characterData:true});
    update();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
})();
