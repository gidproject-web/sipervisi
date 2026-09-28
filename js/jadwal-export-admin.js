import {auth,db} from './firebase-config.js';
import {onAuthStateChanged} from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js';
import {doc,getDoc,collection,getDocs} from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js';
import {makeHtml,word,cetak,slug,esc} from './jadwal-export-helper.js';
const $=id=>document.getElementById(id);let rows=[],supNames=new Map();
function selected(){return $('jadwalExportAdminSupervisor').value;}
function groups(){const id=selected();if(id){return [{header:`Supervisor: ${supNames.get(id)||id}`,sign:supNames.get(id)||id,rows:rows.filter(r=>r.supervisor_id===id)}];}
 return [...supNames].map(([sid,name])=>({header:`Supervisor: ${name}`,sign:name,rows:rows.filter(r=>r.supervisor_id===sid)})).filter(g=>g.rows.length);
}
function buttons(v){['btnJadwalWordAdmin','btnJadwalPrintAdmin'].forEach(id=>{if($(id))$(id).disabled=v;});}
async function load(user){
 const u=await getDoc(doc(db,'users',user.uid));if(!u.exists()||u.data().role!=='admin')throw Error('Akses khusus admin.');
 const [ss,jj,gg]=await Promise.all([getDocs(collection(db,'supervisors')),getDocs(collection(db,'jadwal')),getDocs(collection(db,'guru'))]);
 supNames=new Map(ss.docs.map(d=>[d.id,d.data().nama||d.id]));
 const guruNames=new Map(gg.docs.map(d=>[d.id,d.data().nama||d.id]));
 rows=jj.docs.map(d=>({id:d.id,...d.data(),guru_nama:guruNames.get(d.data().guru_id)||d.data().guru_id}));
 rows.sort((a,b)=>String(a.tanggal||'').localeCompare(String(b.tanggal||''))||String(a.jam||'').localeCompare(String(b.jam||'')));
 const sel=$('jadwalExportAdminSupervisor');sel.innerHTML='<option value="">Semua Supervisor (keseluruhan)</option>'+[...supNames].sort((a,b)=>a[1].localeCompare(b[1],'id')).map(([id,name])=>`<option value="${esc(id)}">${esc(name)}</option>`).join('');
 $('jadwalExportAdminInfo').textContent=`${rows.length} jadwal • ${supNames.size} supervisor`;buttons(false);
}
$('btnJadwalWordAdmin')?.addEventListener('click',()=>{const gs=groups();if(!gs.length)return alert('Belum ada jadwal.');word(makeHtml(gs),selected()?`Jadwal_${slug(supNames.get(selected()))}.doc`:'Jadwal_Semua_Supervisor.doc');});
$('btnJadwalPrintAdmin')?.addEventListener('click',()=>{const gs=groups();if(!gs.length)return alert('Belum ada jadwal.');cetak(makeHtml(gs));});
onAuthStateChanged(auth,async u=>{buttons(true);if(!u)return;try{await load(u);}catch(e){console.error(e);$('jadwalExportAdminInfo').textContent=e.message;}});
