export function esc(v=""){
 return String(v??"").replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}
export function tanggal(v){if(!v)return '-';const p=String(v).split('-');return p.length===3?`${p[2]}-${p[1]}-${p[0]}`:String(v);}
const css=`<style>@page{size:A4 landscape;margin:13mm}body{font:10pt Arial,sans-serif;color:#111}h1{font-size:16pt;text-align:center;margin:0 0 4px}h2{font-size:11pt;text-align:center;font-weight:normal;margin:0 0 18px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #333;padding:6px;vertical-align:top}th{background:#eaf0f8}small{color:#555}.sig{display:flex;justify-content:flex-end;margin-top:32px;page-break-inside:avoid}.sig>div{min-width:260px}.space{height:65px}.break{page-break-after:always}.break:last-child{page-break-after:auto}</style>`;
function groupHtml(rows,header,sign){
 const body=rows.map((r,i)=>`<tr><td>${i+1}</td><td>${esc(tanggal(r.tanggal))}</td><td>${esc(r.jam||'-')}</td><td>${esc(r.guru_nama||r.guru_id||'-')}</td><td>${esc(r.kelas||'-')}</td><td>${esc(r.mapel||'-')}</td><td>${esc(r.materi||'-')}</td><td>${esc(r.jenis_instrumen==='bk'?'Guru BK':'Pembelajaran')}</td><td>${esc(r.status||'Terjadwal')}</td></tr>`).join('');
 return `<section class="break"><h1>JADWAL SUPERVISI AKADEMIK</h1><h2>SMA NEGERI 4 LUBUKLINGGAU • Tahun Pelajaran ${esc(rows[0]?.tahun_pelajaran||'2026/2027')}<br>${esc(header)}</h2><table><thead><tr><th>No</th><th>Tanggal</th><th>Jam</th><th>Guru</th><th>Kelas</th><th>Mapel/Layanan</th><th>Materi/Topik</th><th>Instrumen</th><th>Status</th></tr></thead><tbody>${body||'<tr><td colspan="9">Belum ada jadwal.</td></tr>'}</tbody></table><p><small>Jumlah jadwal: ${rows.length}</small></p><div class="sig"><div>Lubuklinggau, ...........................<br>Mengetahui,<br>Supervisor,<div class="space"></div><b>${esc(sign||'-')}</b></div></div></section>`;
}
export function makeHtml(groups){
 return `<!doctype html><html lang="id"><head><meta charset="utf-8"><title>Jadwal Supervisi SMANPA</title>${css}</head><body>${groups.map(g=>groupHtml(g.rows,g.header,g.sign)).join('')}</body></html>`;
}
export function word(html,name){const blob=new Blob(['\ufeff',html],{type:'application/msword;charset=utf-8'});const u=URL.createObjectURL(blob);const a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),3000);}
export function cetak(html){
 // Blank window is opened directly from click to avoid popup blocking after async queries.
 const w=window.open('','_blank');if(!w){alert('Izinkan pop-up untuk mencetak jadwal.');return;}
 w.document.open();w.document.write(html);w.document.close();w.focus();setTimeout(()=>w.print(),550);
}
export function slug(v){return String(v||'jadwal').replace(/[\\/:*?"<>|]+/g,'-').replace(/\s+/g,'_');}
