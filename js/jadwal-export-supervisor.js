import {auth,db} from './firebase-config.js';
import {onAuthStateChanged} from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js';
import {doc,getDoc,collection,query,where,getDocs} from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js';
import {makeHtml,word,cetak,slug} from './jadwal-export-helper.js';
let rows=[],name='';const $=id=>document.getElementById(id);
function disabled(v){['btnJadwalWordSupervisor','btnJadwalPrintSupervisor'].forEach(id=>{if($(id))$(id).disabled=v;});}
async function load(user){
 const u=await getDoc(doc(db,'users',user.uid));if(!u.exists()||u.data().role!=='supervisor')throw Error('Akses khusus supervisor.');
 const id=u.data().referensi_id;
 const [s,j]=await Promise.all([getDoc(doc(db,'supervisors',id)),getDocs(query(collection(db,'jadwal'),where('supervisor_id','==',id)))]);
 name=s.exists()?s.data().nama:id;
 rows=await Promise.all(j.docs.map(async d=>{const v={id:d.id,...d.data()};const g=await getDoc(doc(db,'guru',v.guru_id));return {...v,guru_nama:g.exists()?g.data().nama:v.guru_id};}));
 rows.sort((a,b)=>String(a.tanggal||'').localeCompare(String(b.tanggal||'')||String(a.jam||'').localeCompare(String(b.jam||'')));
 $('jadwalExportSupervisorInfo').textContent=`${name} • ${rows.length} jadwal`;
 disabled(false);
}
function group(){return [{header:`Supervisor: ${name}`,sign:name,rows}];}
$('btnJadwalWordSupervisor')?.addEventListener('click',()=>word(makeHtml(group()),`Jadwal_Supervisi_${slug(name)}.doc`));
$('btnJadwalPrintSupervisor')?.addEventListener('click',()=>cetak(makeHtml(group())));
onAuthStateChanged(auth,async u=>{disabled(true);if(!u)return;try{await load(u);}catch(e){console.error(e);$('jadwalExportSupervisorInfo').textContent=e.message;}});
// Update export cache after supervisor creates/edits/deletes jadwal.
window.addEventListener('sipervisi:jadwal-changed',()=>{if(auth.currentUser)load(auth.currentUser).catch(console.error);});
