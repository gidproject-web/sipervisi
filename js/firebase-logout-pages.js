import { auth } from "./firebase-config.js";
import { signOut } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
document.getElementById("logoutButton")?.addEventListener("click", async ()=>{
  await signOut(auth); localStorage.removeItem("sipervisi_user"); location.href="../index.html";
});
