import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import { collection, query, where, getDocs, getDoc, doc } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";
import { resolveGuruIdForUser, getGuruProfile } from "./dual-role-helper.js";

const $ = id => document.getElementById(id);

onAuthStateChanged(auth, async user => {
  if (!user) return;
  try {
    const us = await getDoc(doc(db, "users", user.uid));
    if (!us.exists()) throw new Error("Profil pengguna tidak ditemukan.");
    const profile = { uid:user.uid, ...us.data() };

    const guruId = await resolveGuruIdForUser(profile);
    if (!guruId) throw new Error("Akun ini belum terhubung dengan data guru yang disupervisi.");

    const guru = await getGuruProfile(guruId);
    $("namaGuruHasil").textContent = guru?.nama || guruId;
    $("idGuruHasil").textContent = guruId;

    const snap = await getDocs(query(collection(db, "jadwal"), where("guru_id", "==", guruId)));
    const rows = snap.docs.map(d=>({id:d.id,...d.data()}))
      .sort((a,b)=>String(b.tanggal||"").localeCompare(String(a.tanggal||"")));

    const out=[];
    for(const r of rows){
      const [s, sp] = await Promise.all([
        getDoc(doc(db,"supervisors",r.supervisor_id)),
        getDoc(doc(db,"supervisi",r.id))
      ]);
      out.push({
        ...r,
        supervisor_nama:s.exists()?s.data().nama:r.supervisor_id,
        ada_hasil:sp.exists(),
        hasil_status:sp.exists()?(sp.data().status||""):""
      });
    }

    $("hasilSayaBody").innerHTML = out.length ? out.map((r,i)=>{
      const available = r.ada_hasil;
      const action = available
        ? `<a class="btn btn-small btn-primary-lite" href="hasil-detail.html?jadwal_id=${encodeURIComponent(r.id)}">Lihat Hasil</a>`
        : `<span class="muted">Belum tersedia</span>`;
      return `<tr>
        <td>${i+1}</td><td>${r.tanggal||""}</td><td>${r.supervisor_nama}</td>
        <td>${r.mapel||""}</td><td>${r.kelas||""}</td>
        <td><span class="badge">${r.status||"Terjadwal"}</span></td><td>${action}</td>
      </tr>`;
    }).join("") : '<tr><td colspan="7">Belum ada data supervisi.</td></tr>';
  } catch(e) {
    console.error(e);
    $("hasilSayaMessage").textContent=e.message;
  }
});
