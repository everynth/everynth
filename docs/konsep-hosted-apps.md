# EVERYNTH Apps — Konsep & Rencana

Tanggal: 2026-09-21. Status: draf, menunggu persetujuan.

## 1. Apa ini

Marketplace v1 menjual **file dan akses**. EVERYNTH Apps menjual **aplikasi yang langsung hidup**: web app dan AI agent buatan **creator**, dihosting EVERYNTH. Pembeli memilih template, membayar, memberi nama dan gaya, dan aplikasinya jalan dalam satu menit di alamat sendiri.

Tiga pihak:
- **Creator** membuat template dan mengunggahnya ke EVERYNTH. Dapat 95% dari tiap penjualan dan perpanjangan.
- **Pembeli** (penyewa) membeli template, mendapat salinan bermerek sendiri.
- **EVERYNTH** menghosting, menagih, membagi hasil, menyediakan AI, pembayaran, dan login.

Pembeli tidak deploy apa pun, tidak punya akun Vercel, tidak menyentuh kode.

## 2. Keputusan inti: kode creator berjalan di mana

Ini keputusan terpenting dan yang paling menentukan keamanan.

**Kode creator hanya berjalan di browser pengunjung, tidak pernah di server EVERYNTH.**

Creator mengunggah aplikasinya sebagai **bundel statis** (HTML, CSS, JavaScript, gambar). EVERYNTH menyajikannya di subdomain penyewa. Semua yang butuh server (AI, pembayaran, login, penyimpanan data) disediakan EVERYNTH lewat API, dan aplikasi creator memanggil API itu.

Kenapa begitu:
- Kode server dari orang tak dikenal bisa membaca kunci rahasia, menghabiskan kuota, atau menyerang penyewa lain. Kode di browser tidak bisa menyentuh server EVERYNTH selain lewat API yang dijaga.
- Tidak perlu deploy per template. Bundel disimpan sebagai file, disajikan langsung.
- Semua framework front-end bisa dipakai (React, Vue, Svelte, HTML biasa), asal hasil build-nya statis.

Yang tidak bisa dengan cara ini: template yang butuh kode server sendiri (database custom, integrasi rahasia pihak ketiga). Untuk itu ada jalur lanjutan di bagian 9.

## 3. Alur creator

1. Buat aplikasi secara lokal seperti biasa. Baca konfigurasi merek dari EVERYNTH (lihat bagian 5), panggil API EVERYNTH untuk AI atau pembayaran.
2. Build jadi folder statis, zip, unggah di halaman **Launch template** (batas awal 20 MB).
3. Isi nama template, deskripsi, tangkapan layar, harga langganan bulanan.
4. EVERYNTH memasang template itu di alamat pratinjau, misalnya `preview-123.everynth.app`, agar creator bisa mengecek.
5. Publish. Template tampil di halaman Apps.

Versi baru: unggah zip baru, semua penyewa otomatis memakai versi terbaru. Creator bisa memilih "tahan versi lama" kalau perubahan besar.

## 4. Alur pembeli

1. Buka **Apps**, pilih template, lihat demo hidup.
2. Bayar SOL untuk bulan pertama. Mekanisme sama dengan v1: satu transaksi, 95% creator, 5% EVERYNTH, diverifikasi server.
3. Isi nama aplikasi dan satu kalimat gaya. AI menghasilkan nama, tagline, palet warna, dan logo sederhana. Bisa ditimpa manual.
4. Aplikasi hidup di `nama.everynth.app`.
5. Opsional: domain sendiri. Pembeli mengetik domainnya, EVERYNTH menampilkan satu record DNS (CNAME) yang harus dibuat. SSL otomatis.
6. Perpanjang tiap bulan dengan bayar SOL lagi.

## 5. Cara kerja teknis

### Satu template, banyak penyewa
Satu bundel template disajikan untuk semua penyewanya. Tiap penyewa adalah satu baris data: template, pemilik, subdomain, domain sendiri, nama, logo, warna, pengaturan, masa aktif.

Saat ada kunjungan, server melihat nama host, mencari penyewa, lalu menyajikan bundel template itu **plus** konfigurasi penyewa yang disuntikkan ke halaman. Ganti nama, logo, atau warna hanya mengubah data.

### Kontrak untuk creator (SDK kecil)
Di halaman penyewa, EVERYNTH menyuntikkan objek global:

- `EVERYNTH.brand`: nama, tagline, logo (URL), warna (latar, teks, aksen).
- `EVERYNTH.tenant`: id penyewa, subdomain.
- `EVERYNTH.settings`: pengaturan bebas yang diisi penyewa lewat dashboard, bentuknya ditentukan creator (misalnya "persona agent", "pesan sambutan").

Dan API yang bisa dipanggil aplikasi (dijaga per penyewa):

- `POST /api/apps/ai/chat`: kirim pesan, dapat jawaban model. Kuota per penyewa.
- `POST /api/apps/pay`: buat tagihan SOL ke wallet penyewa (untuk template yang menjual sesuatu ke pengunjungnya).
- `GET /api/apps/me`: identitas pengunjung yang connect wallet (untuk template yang membedakan pengunjung).
- `GET/PUT /api/apps/store/:key`: penyimpanan kecil per penyewa (JSON, batas ukuran), untuk data sederhana.

Kunci API model, kunci Vercel, dan rahasia lain hanya ada di server EVERYNTH.

### Pengaturan yang ditentukan creator
Creator menyertakan file `everynth.json` di bundel: daftar field pengaturan (nama, jenis, label, nilai awal). Dashboard penyewa menampilkan form dari daftar itu. Jadi tiap template bisa punya pengaturan sendiri tanpa EVERYNTH mengubah apa pun.

### Subdomain
Domain EVERYNTH dipasang ke Vercel sebagai wildcard `*.everynth.app`. Semua subdomain masuk ke aplikasi yang sama. Tidak ada langkah per penyewa.

### Domain sendiri
Penyewa mengetik domain → EVERYNTH mendaftarkannya ke proyek Vercel lewat API Vercel → dashboard menampilkan CNAME yang harus dibuat → Vercel memeriksa DNS dan menerbitkan SSL → status "aktif".

### Branding oleh AI
Input: nama dan kalimat gaya. Output: nama final, tagline, palet warna, logo SVG sederhana (monogram). Disimpan sebagai data penyewa. Logo unggahan manual disimpan seperti cover produk v1.

Batas jujur: logo dari AI adalah monogram sederhana, bukan ilustrasi.

## 6. Keamanan bundel creator

Walau hanya berjalan di browser, kode creator tetap bisa menipu pengunjung (phishing, minta tanda tangan wallet yang merugikan). Penangkal:

- Bundel dipindai saat unggah: tolak file yang bukan web statis, batasi ukuran, tolak `iframe` ke luar dan skrip dari domain luar yang tidak dikenal.
- Tiap penyewa di subdomain sendiri, jadi cookie dan penyimpanan browser terpisah dari EVERYNTH utama.
- Tombol lapor di tiap aplikasi penyewa. Admin bisa menonaktifkan template beserta semua penyewanya.
- Creator template harus punya reputasi: minimal sudah menjual di marketplace v1, atau disetujui admin dulu untuk template pertamanya.

## 7. Pembayaran dan bagi hasil

- Langganan bulanan dalam SOL, harga ditentukan creator dengan batas bawah yang ditetapkan EVERYNTH (agar menutup biaya hosting dan AI).
- Tiap pembayaran: 95% ke creator, 5% ke EVERYNTH, satu transaksi. Sama seperti v1.
- Kuota AI per penyewa per bulan ditentukan dari harga. Template yang memakai AI wajib berharga di atas batas bawah yang lebih tinggi.
- Habis masa aktif: aplikasi menampilkan halaman "tidak aktif", data disimpan 30 hari.

Tidak ada tagihan otomatis di v1 (tanpa kartu kredit). Pembayaran otomatis lewat agent atau x402 menyusul.

## 8. Biaya untuk EVERYNTH

- **Vercel Pro, 20 dolar per bulan.** Wajib: paket Hobby melarang pemakaian komersial, dan wildcard domain butuh Pro. EVERYNTH v1 pun seharusnya sudah di Pro.
- **Domain**, sekitar 10–15 dolar per tahun. Usul: `everynth.app`.
- **Penyimpanan bundel**: Vercel Blob atau R2, murah, bayar per GB.
- **Database**: Neon gratis untuk awal, naik saat data penyewa banyak.
- **Model AI**: sesuai pemakaian, dikendalikan kuota.

## 9. Jalur lanjutan: template dengan kode server

Kalau nanti creator butuh kode server sendiri, jangan dijalankan di Vercel EVERYNTH. Pakai layanan yang memang dibuat untuk menjalankan kode pelanggan secara terisolasi, misalnya Cloudflare Workers for Platforms. Tiap template jadi satu worker terisolasi dengan batas CPU dan memori, tidak bisa membaca rahasia EVERYNTH. Ini tahap 2, setelah jalur statis terbukti dipakai.

## 10. Yang perlu Anda siapkan

1. Naik ke Vercel Pro.
2. Beli domain dan arahkan ke Vercel.
3. Kunci API Claude untuk API AI.
4. Tentukan batas bawah harga template, dan batas bawah untuk template ber-AI.

## 11. Rencana kerja

1. Tabel template dan penyewa, penyimpanan bundel, pembacaan nama host, halaman "tidak aktif".
2. Unggah bundel oleh creator, pemindaian, alamat pratinjau, publish.
3. Penyuntikan `EVERYNTH.brand/tenant/settings` dan form pengaturan dari `everynth.json`.
4. Halaman Apps: daftar template, demo, beli (mekanisme v1), buat penyewa.
5. Dashboard penyewa: merek, pengaturan, subdomain, domain sendiri, masa aktif, perpanjangan.
6. Branding oleh AI.
7. API untuk aplikasi: AI chat dengan kuota, pay, me, store.
8. Wildcard subdomain dan domain sendiri lewat API Vercel.
9. Satu template contoh buatan EVERYNTH ("AI Agent Chat") sebagai acuan creator dan pengisi awal katalog.
10. Uji penuh: creator unggah → pembeli beli → hidup di subdomain → chat → domain sendiri → perpanjangan.

## 12. Risiko

- **Template jahat**: phishing atau minta tanda tangan merugikan. Penangkal di bagian 6.
- **Biaya AI membengkak**: kuota per penyewa wajib sejak hari pertama.
- **Katalog kosong di awal**: perlu 3–5 template sungguhan sebelum dibuka. Template contoh dari EVERYNTH menutup awalnya.
- **Creator berharap kode server**: batas jalur statis harus jelas di panduan creator, dengan jalur lanjutan (bagian 9) sebagai jawabannya.
