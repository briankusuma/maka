# MAKA Studio

Starter HTML, CSS, dan JavaScript vanilla dengan Vite, Lenis, GSAP, dan ScrollTrigger.
Swiper dipakai oleh modul `js/sections/projects.js`: core, FreeMode, A11y, Keyboard, Navigation, dan CSS terkait. Pada desktop lebar kedua grup tahun terlihat sekaligus; saat konten melebihi viewport, drag dan kontrol navigasi aktif.
Header dan hero mengikuti node Figma `3832:2416`, memakai foto/SVG asli serta font Inter dan Bricolage Grotesque lokal. Section lanjutan masih berupa kerangka awal. Desktop mengikuti referensi; mobile merupakan adaptasi karena belum ada frame mobile yang diberikan.

About mengikuti node `3832:2448`. Portfolio/services mengikuti node `3832:2459` dan berada sebelum statistik, dengan grup tahun Swiper, gambar besar/kecil/oval, serta dialog viewer. Statistik mengikuti node `3846:2702`, dengan foto full-width, tiga metrik, CTA, dan count-up GSAP. Social Proof di bawah statistik mengikuti node `3832:2530`, dengan accordion Orbitly terbuka saat awal, foto dan kutipan asli, navigasi keyboard, serta transisi tinggi yang memperbarui ScrollTrigger. Panel lainnya hanya memakai metadata proyek yang tersedia; kutipan tambahan belum diberikan.

## Menjalankan

Footer mengikuti node `3832:2631` dengan foto mata, ikon dan divider asli. Email/telepon serta anchor halaman sudah aktif. URL sosial, Careers, Blog, dan halaman legal belum diberikan sehingga ditampilkan sebagai teks, bukan tautan dengan tujuan rekaan.

Section Why Choose mengikuti node `3846:2799`, setelah Social Proof: grid tiga kolom, angka Bricolage Regular, dua gambar asli dan overlay. Link Read more menuju penjelasan Strategy-First di section yang sama. Mobile ditumpuk menjadi satu kolom.

```sh
npm install
npm run dev
```

Buka URL lokal yang ditampilkan terminal. Gunakan server Vite, karena JavaScript mengimpor dependency dari npm.

```sh
npm run build
npm run preview
```

Build produksi tersedia di `dist/`. Jangan mengedit `dist/` secara langsung.

## Struktur

```text
maka/
├── AGENTS.md
├── index.html           # Markup dan konten section
├── style.css            # Token, layout, komponen, responsive
├── script.js            # Entry point dan HMR cleanup
├── js/
│   ├── core/            # LandingPage, SmoothScroll, konfigurasi GSAP
│   └── interactions/    # Fungsi reveal dan marquee
├── assets/
│   ├── fonts/
│   ├── icons/
│   ├── images/
│   │   ├── hero/
│   │   ├── projects/
│   │   └── studio/
│   └── videos/
├── package.json
└── package-lock.json
```

## Memperbarui

Preloader berada di `js/sections/preloader.js`; objek `timing` mengatur tempo utamanya. Dua foto tetap di DOM hero dan ditempatkan ke staging melalui transform sesuai frame `3870:2925`, dengan sequence pose tetap berjalan dan urutan layer wordmark tidak berubah. Progres dua garis abu-abu transparan mengikuti decode sepuluh frame hero, logo, aset wordmark, dan kesiapan font. Setelah 100%, logo berputar 360° menuju navbar dan foto berpindah selama 4,2 detik; navigasi turun, display naik, dan divider hero terbentang. Resize, reduced motion, deep-link, kegagalan aset, atau timeout memulihkan halaman tanpa mengunci scroll. Buka URL utama tanpa hash untuk melihat intro dari awal.

Hero kanan menggunakan lima file `assets/images/hero/model-pose-sequence-5/pose-01.png` sampai `pose-05.png`. Loop 600ms per pose dikelola `js/interactions/hero-poses.js`, tanpa tombol Pause, berhenti di luar viewport/tab, dan menampilkan frame pertama untuk reduced motion. Durasi gaze statistik 1,2 detik masuk / 1,35 detik keluar; offset angka mengikuti titik tengah opacity background.

Efek gaze statistik berada di `js/interactions/statistics-gaze.js`: hover CTA kiri atau fokus keyboard menampilkan `assets/images/studio/maka-background-gaze.png`, lalu kembali ke foto default saat keluar. Transisi memakai crossfade dua gambar, bukan image sequence. Gambar di-decode sebelum dipakai dan cleanup membatalkan listener/tween serta callback async yang terlambat.

Pertahankan format source yang mudah dibaca: indentasi dua spasi, atribut HTML per baris, dan deklarasi CSS per baris.

- Tambah markup di `index.html`; section diberi komentar agar mudah ditemukan.
- Ubah token warna, font, dan spacing pada `:root` di `style.css`.
- Tambah `data-reveal` pada elemen yang memerlukan reveal standar.
- Tambah motion sebagai modul fungsi di `js/interactions/` atau `js/sections/`, lalu panggil dalam callback `media.add()` di `js/core/landing-page.js` agar tween sinkron mengikuti cleanup context.
- CSS memakai BEM (`hero__wordmark`, `ticker__track`); hook JS memakai `data-*`. Class mengelola lifecycle, fungsi menangani fitur, event menangani load, dan async menunggu font. Seluruh gerak per frame memakai ticker GSAP bersama.
- Simpan aset lokal dan referensikan dari HTML, misalnya `./assets/images/hero/editorial.webp`. Beri gambar `width`, `height`, dan alt yang sesuai.
- Referensikan file font dari `style.css` memakai `@font-face`. Font dan nilai visual starter masih sementara sampai diukur dari Figma.
- Untuk dependency: gunakan npm dan commit `package-lock.json`. Jangan menambahkan CDN atau loop RAF kedua.
- `assets/` diproses Vite ketika direferensikan oleh HTML/CSS/JS. Aset yang tidak direferensikan tidak otomatis masuk build.

Lenis memakai ticker GSAP dengan konversi detik ke milidetik dan tersinkron ke ScrollTrigger, sesuai [dokumentasi Lenis](https://github.com/darkroomengineering/lenis). GSAP dimuat melalui [npm dan ES modules](https://gsap.com/docs/v3/Installation/).

Saat reduced motion aktif, smooth scrolling dan animasi dimatikan. Tanpa JavaScript, konten tetap terlihat dan anchor tetap bekerja.

Sequence yang sama dipakai di foto panel 36’: otomatis berjalan saat accordion terbuka dan foto terlihat, lalu kembali ke pose pertama saat ditutup. Mode per komponen diatur melalui `data-pose-sequence="auto"` atau `"accordion"`.

Foto kiri hero dan accordion 01 memakai `model-left-pose-sequence-5` dengan pengaturan yang sama: 600ms per frame, autoplay untuk hero, play saat accordion terbuka dan terlihat untuk panel 01.

Accordion 02 (Orbitly) menggunakan lima pose dari `assets/images/hero/accordion-pose-sequence-5/`, dengan interval 600ms dan lifecycle yang sama seperti panel 01/03.

Splash cursor berada di `js/interactions/splash-cursor.js`, diadaptasi dari [React Bits SplashCursor](https://github.com/DavidHDev/react-bits/tree/main/src/content/Animations/SplashCursor). Lisensi sumber disimpan di `js/interactions/splash-cursor.LICENSE.txt`. Warna `#EB2E2E`, ukuran, intensitas, dan durasi jejak diatur di objek `settings` dalam `createFluid()`. Efek WebGL2 dimulai pada gerakan mouse setelah preload, memakai ticker GSAP bersama, berhenti setelah idle atau tab tersembunyi, serta dibersihkan pada HMR. Perangkat sentuh, reduced motion, dan browser tanpa dukungan WebGL2 menampilkan cursor normal tanpa efek.
