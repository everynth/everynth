# EVERYNTH Apps — Konsep & Rencana

Tanggal: 2026-09-21. Status: draf, menunggu persetujuan.

## 1. Apa ini

Marketplace v1 menjual **file dan akses**. EVERYNTH Apps menjual **aplikasi yang langsung hidup**: web app dan AI agent yang dihosting EVERYNTH. Pengguna memilih template, membayar, memberi nama dan gaya, dan aplikasinya jalan dalam satu menit di alamat sendiri.

Pengguna tidak deploy apa pun, tidak punya akun Vercel, tidak menyentuh kode.

## 2. Alur pengguna

1. Buka halaman **Apps**, pilih template (misalnya "AI Agent Chat").
2. Bayar dengan SOL. Sama seperti v1: satu transaksi, diverifikasi server.
3. Isi form singkat: nama aplikasi, dan satu kalimat gaya ("toko kopi, hangat, coklat tua").
4. AI menghasilkan nama, tagline, palet warna, dan logo sederhana. Pengguna bisa menimpa: unggah logo sendiri, pilih warna sendiri.
5. Aplikasi hidup di `nama.everynth.app`.
6. Opsional: pasang domain sendiri. Pengguna mengetik domainnya, EVERYNTH menampilkan satu record DNS (CNAME) yang harus dibuat. Setelah DNS mengarah, SSL otomatis.

## 3. Cara kerja: satu aplikasi, banyak penyewa

Satu kode template dihosting **satu kali**. Tiap pembeli adalah satu **penyewa** (tenant): satu baris di database berisi nama, logo, warna, subdomain, domain sendiri, pengaturan, dan masa aktif.

Saat ada kunjungan ke `nama.everynth.app` atau domain sendiri, server melihat nama host, mencari penyewanya di database, lalu merender template dengan konfigurasi penyewa itu. Ganti nama, logo, atau warna hanya mengubah data, bukan kode, jadi tidak ada deploy per pengguna.

Kenapa bukan satu deploy per pengguna: lambat, rapuh, biaya naik per pengguna, dan Vercel membatasi jumlah proyek.

### Subdomain
Domain `everynth.app` (atau yang dipilih) dipasang ke proyek Vercel sebagai wildcard `*.everynth.app`. Semua subdomain otomatis masuk ke aplikasi yang sama. Tidak ada langkah per pengguna.

### Domain sendiri
1. Pengguna mengetik `agent.tokokopi.com` di dashboard.
2. EVERYNTH mendaftarkan domain itu ke proyek Vercel lewat API Vercel.
3. Dashboard menampilkan instruksi: buat CNAME `agent` → `cname.vercel-dns.com`.
4. Vercel memeriksa DNS dan menerbitkan SSL sendiri. Dashboard menampilkan status "aktif" saat selesai.

### Branding oleh AI
Input: nama dan kalimat gaya. Output: nama final, tagline, palet warna (latar, teks, aksen), dan logo SVG sederhana (monogram atau bentuk geometris). Semua disimpan sebagai data penyewa. Logo bitmap yang diunggah manual disimpan sebagai gambar kecil, sama seperti cover produk di v1.

Batas jujur: logo buatan AI di sini adalah monogram sederhana, bukan ilustrasi. Untuk logo bagus, pengguna unggah sendiri.

## 4. Template pertama: AI Agent Chat

Usulan template pertama, karena paling cocok dengan narasi EVERYNTH dan paling terasa "hidup":

- Halaman chat dengan nama, logo, dan warna penyewa.
- Penyewa mengatur: persona agent (teks instruksi), pengetahuan (teks atau file kecil yang dimasukkan ke konteks), pesan sambutan.
- Pengunjung bisa langsung chat. Opsional: hanya pemegang produk tertentu yang boleh chat (memakai cek kepemilikan dari marketplace v1).
- Jawaban dari model Claude lewat server EVERYNTH. Kunci API milik EVERYNTH, tidak pernah ke browser.

**Kuota.** Tiap panggilan model ada biayanya. Setiap penyewa punya kuota pesan per bulan sesuai paket. Habis kuota, chat berhenti sampai bulan berikut atau beli tambahan. Tanpa kuota, satu penyewa ramai bisa menghabiskan biaya untuk semua.

Template kedua yang mudah menyusul: "Mini store", yaitu toko produk digital satu creator dengan pembayaran SOL, memakai ulang kode v1.

## 5. Pembayaran dan harga

Hosting dan model punya biaya berjalan, jadi bukan sekali bayar.

- **Langganan bulanan dalam SOL.** Bayar → masa aktif ditambah 30 hari. Sama mekanismenya dengan pembelian v1, hanya menambah `paid_until`.
- Tujuh hari sebelum habis, dashboard menampilkan peringatan. Habis masa aktif, aplikasi menampilkan halaman "tidak aktif", data tidak dihapus selama 30 hari.
- Harga per template ditentukan Anda. Harga harus menutup Vercel, database, dan pemakaian model dengan margin.

Tidak ada tagihan otomatis (tidak ada kartu kredit), jadi pengguna membayar manual tiap bulan. Ini kelemahan yang diterima di v1. Pembayaran otomatis lewat agent atau x402 bisa menyusul.

## 6. Biaya untuk EVERYNTH

- **Vercel Pro, 20 dolar per bulan.** Wajib: paket Hobby melarang pemakaian komersial, dan wildcard domain butuh Pro. EVERYNTH v1 yang sudah mengambil fee pun seharusnya sudah di Pro.
- **Domain**, sekitar 10–15 dolar per tahun. Usul: `everynth.app`.
- **Database**: Neon gratis cukup untuk ratusan penyewa. Naik ke paket berbayar (sekitar 19 dolar per bulan) saat data chat mulai banyak.
- **Model AI**: bayar sesuai pemakaian. Dikendalikan lewat kuota per penyewa.
- **Agent yang harus hidup terus** (memantau pasar, bot Telegram) tidak cocok di Vercel yang serverless. Kalau nanti ada template seperti itu, butuh worker terpisah (Railway atau Fly, sekitar 5–10 dolar per bulan). Template pertama tidak membutuhkannya.

## 7. Yang perlu Anda siapkan

1. Naik ke Vercel Pro.
2. Beli domain dan arahkan ke Vercel.
3. Kunci API Claude untuk template agent.
4. Tentukan harga langganan template pertama.

## 8. Rencana kerja

1. Tabel penyewa + pembacaan nama host di server + halaman "tidak aktif".
2. Wildcard subdomain di Vercel dan domain sendiri lewat API Vercel, dengan instruksi DNS di dashboard.
3. Halaman Apps: daftar template, beli (mekanisme pembayaran v1), buat penyewa.
4. Dashboard penyewa: nama, logo, warna, subdomain, domain sendiri, masa aktif, bayar perpanjangan.
5. Branding oleh AI: nama, tagline, palet, logo SVG.
6. Template AI Agent Chat: persona, pengetahuan, chat, kuota pesan.
7. Uji penuh: beli → hidup di subdomain → chat → domain sendiri → perpanjangan.

## 9. Risiko

- **Penyalahgunaan**: penyewa memakai agent untuk hal terlarang. Penangkal: syarat layanan, tombol lapor di tiap app, admin bisa menonaktifkan penyewa.
- **Biaya model membengkak**: kuota per penyewa wajib sejak hari pertama.
- **Phishing lewat domain sendiri**: seseorang memasang domain mirip bank. Penangkal: domain sendiri hanya untuk penyewa aktif, dan admin bisa mencabutnya.
