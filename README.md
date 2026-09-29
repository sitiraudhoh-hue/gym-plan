# Gym Plan 12 Minggu

Aplikasi web (PWA) untuk menjalankan program **full body 3× seminggu** (Selasa · Kamis · Sabtu) dengan target turun berat badan. Bisa di-install di HP dan dipakai offline.

## Fitur

- **Beranda**: rekap hari ini (BB, langkah, kalori, protein, tidur, nyeri lutut sesi terakhir) dan grafik BB harian + rata-rata 7 hari.
- **Latihan**: log sesi per minggu (1–12) dan sesi (A/B/C). Isi beban, reps, RPE, dan nyeri lutut, lalu lihat catatan minggu lalu. Ada checklist pemanasan dan timer istirahat.
- **Harian**: log berat badan, langkah, kalori, protein, tidur, lingkar pinggang, dan catatan.
- **Panduan**: target kalori & protein (dihitung otomatis), aturan progresi, aturan lutut, program lengkap, dan nutrisi beserta contoh menu.
- **Setelan**: profil, backup/restore (.json), export CSV, dan reset.

Data hanya tersimpan di browser perangkat (localStorage), tidak dikirim ke server mana pun. **Lakukan export backup secara rutin.**

## Deploy ke GitHub Pages

1. Buat repository baru di GitHub (mis. `gym-plan`).
2. Upload semua isi folder ini ke root repository: `index.html`, `app.js`, `data.js`, `styles.css`, `sw.js`, `manifest.webmanifest`, `.nojekyll`, dan folder `icons/`.
   - Lewat web: **Add file → Upload files**, lalu seret semua file dan foldernya.
   - Lewat terminal:
     ```bash
     git init && git add . && git commit -m "Gym Plan v1"
     git branch -M main
     git remote add origin https://github.com/USERNAME/gym-plan.git
     git push -u origin main
     ```
3. Buka **Settings → Pages**. Pada *Source* pilih **Deploy from a branch**, lalu **main / (root)**, lalu **Save**.
4. Tunggu 1–2 menit. Aplikasinya akan tersedia di `https://USERNAME.github.io/gym-plan/`.

## Install di HP

- **Android (Chrome)**: buka link aplikasi, lalu menu ⋮ → *Install app* / *Add to Home screen*.
- **iPhone (Safari)**: buka link aplikasi, lalu tombol Share → *Add to Home Screen*.

> Di iPhone, data aplikasi yang di-install ke Home Screen terpisah dari data di tab Safari. Pakai salah satu saja secara konsisten.

## Mengubah program

- Latihan, set, dan tips ada di `data.js` (objek `PROGRAM`), panduan ada di `GUIDE`, dan contoh menu ada di `MENU`.
- Setelah mengubah file apa pun, naikkan `VERSION` di `sw.js` (mis. `gymplan-v1.0.2`) supaya HP mengambil versi terbaru.

## Catatan

Target kalori memakai rumus Mifflin-St Jeor × faktor aktivitas − defisit. Angka ini **estimasi** (bisa meleset ±10%), jadi sesuaikan dari tren BB 2–3 minggu. Angka kalori makanan di contoh menu adalah perkiraan kasar. Aplikasi ini berisi panduan umum, bukan saran medis.
