import { auth, db } from "./firebase-config.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

const form = document.getElementById("loginForm");
const msg = document.getElementById("loginMessage");

form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  msg.textContent = "Memproses login...";

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const snap = await getDoc(doc(db, "users", cred.user.uid));

    if (!snap.exists()) throw new Error("Profil pengguna tidak ditemukan.");

    const data = snap.data();
    if (String(data.status || "Aktif").toLowerCase() !== "aktif") {
      throw new Error("Akun tidak aktif.");
    }

    const role = String(data.role || data.peran || "").toLowerCase();
    localStorage.setItem("sipervisi_user", JSON.stringify({
      uid: cred.user.uid,
      email: data.email || email,
      nama: data.nama || email,
      role,
      peran: role,
      referensi_id: data.referensi_id || ""
    }));

    if (role === "admin") location.href = "dashboard.html";
    else if (role === "supervisor") location.href = "pages/dashboard-supervisor.html";
    else if (role === "guru") location.href = "pages/dashboard-guru.html";
    else throw new Error("Role akun tidak dikenali.");
  } catch (err) {
    console.error(err);
    msg.textContent = err.message || "Login gagal.";
  }
});
