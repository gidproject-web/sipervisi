SIPERVISI SMANPA — FIREBASE
===========================

Project lengkap hasil rekonstruksi untuk laptop baru.

STRUKTUR:
index.html
dashboard.html
css/style.css
js/
pages/

FITUR YANG SUDAH TERHUBUNG:
1. Login Firebase Authentication.
2. Role admin / supervisor / guru.
3. Guard halaman berdasarkan role.
4. Logout.
5. Dashboard admin: jumlah guru, supervisor, penugasan.
6. Master Guru: baca collection guru.
7. Master Supervisor: baca collection supervisors.
8. Penugasan: baca relasi supervisors -> guru.
9. Dashboard Supervisor: tampil jumlah + daftar guru binaan.
10. Dashboard Guru: tampil supervisor berdasarkan penugasan.

PENTING — LANGKAH WAJIB SEBELUM DIPAKAI
---------------------------------------
Buka:
js/firebase-config.js

Isi nilai berikut dari Firebase Console:
- apiKey
- authDomain
- storageBucket
- messagingSenderId
- appId

projectId sudah diset:
smanpaprima-79e9c

Ambil config dari:
Firebase Console
> Project settings
> General
> Your apps
> SDK setup and configuration
> Config

JANGAN memakai service-account JSON pada website frontend.
Service-account hanya untuk script Admin SDK lokal yang sebelumnya dipakai untuk import massal.

CARA MENJALANKAN DI LAPTOP
--------------------------
Paling mudah dari VS Code dengan Live Server:
1. Open Folder project ini.
2. Pastikan firebase-config.js sudah diisi.
3. Klik kanan index.html > Open with Live Server.
4. Login dengan akun Firebase yang sudah dibuat.

COLLECTION FIRESTORE YANG DIPAKAI:
users
guru
supervisors
penugasan

CATATAN:
Halaman Jadwal Supervisi sudah disiapkan sebagai placeholder untuk tahap berikutnya.
