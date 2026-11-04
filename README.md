# MAKA Studio

Starter HTML, CSS, dan JavaScript vanilla dengan Vite, Lenis, GSAP, dan ScrollTrigger.
Swiper juga terpasang untuk slider di masa depan, tetapi belum diimpor sehingga tidak menambah bundle landing saat ini. Saat diperlukan, impor core, modul, dan CSS secukupnya di modul fitur slider; ikuti aturan integrasinya di `AGENTS.md`.
Header dan hero mengikuti node Figma `3832:2416`, memakai foto/SVG asli serta font Inter dan Bricolage Grotesque lokal. Section lanjutan masih berupa kerangka awal. Desktop mengikuti referensi; mobile merupakan adaptasi karena belum ada frame mobile yang diberikan.

## Menjalankan

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
