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
    $("namaGuruSaya").textContent = guru?.nama || guruId;
    $("idGuruSaya").textContent = guruId;

    const snap = await getDocs(query(collection(db, "jadwal"), where("guru_id", "==", guruId)));
    const rows = snap.docs.map(d => ({ id:d.id, ...d.data() }))
      .sort((a,b)=>String(a.tanggal||"").localeCompare(String(b.tanggal||"")));

    const out = [];
    for (const r of rows) {
      const s = await getDoc(doc(db, "supervisors", r.supervisor_id));
      out.push({...r, supervisor_nama:s.exists()?s.data().nama:r.supervisor_id});
    }

    $("jadwalSayaBody").innerHTML = out.length ? out.map((r,i)=>`
      <tr>
        <td>${i+1}</td>
        <td>${r.tanggal||""}</td>
        <td>${r.jam||""}</td>
        <td>${r.supervisor_nama}</td>
        <td>${r.kelas||""}</td>
        <td>${r.mapel||""}</td>
        <td>${r.materi||""}</td>
        <td><span class="badge">${r.status||"Terjadwal"}</span></td>
      </tr>`).join("") :
      '<tr><td colspan="8">Belum ada jadwal supervisi untuk Anda.</td></tr>';
  } catch(e) {
    console.error(e);
    $("jadwalSayaMessage").textContent = e.message;
  }
});
