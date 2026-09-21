# EVERYNTH — Konsep & Rencana v1

Tanggal: 2026-09-17. Status: draf, menunggu persetujuan.

## 1. EVERYNTH itu apa

**The Private Commerce Layer.** Build it. Launch it. Monetize it. Privately.

Satu tempat di Solana untuk meluncurkan dan menjual produk digital: AI agent, API, dataset, tool, riset, jasa digital, komunitas privat. Tidak harus token. Pesannya "launch something useful".

Proyek baru. Bukan rebrand OBSCRA. Token, holder, dan kode OBSCRA tidak dibawa.

Alur besar: CREATE → LAUNCH → FUND → ACCESS → TRANSACT → GROW.

Lima lapisan, saling mengirim traffic:

1. **Launch** — pintu masuk. Creator bikin halaman produk dan meluncurkannya.
2. **Market** — produk yang launch langsung bisa ditemukan dan dibeli.
3. **Private layer** — file terenkripsi, chat privat, escrow, bukti akses.
4. **Machine layer** — AI agent bisa bayar dan akses lewat x402.
5. **Token economy** — akses, potongan fee, buyback, reward, burn.

## 2. Keputusan yang sudah dikunci

- Proyek baru, berdiri sendiri.
- Privasi v1: isi file dan pesan terenkripsi. Pembayaran tetap terlihat di chain.
- FUND v1: jual produk jadi saja. Tidak ada presale, tidak ada token per produk.
- Token: belum ada. Ditambahkan setelah ada pemakaian nyata.
- Bayar pakai SOL (diputuskan 2026-09-21, sebelumnya USDC). Lebih sederhana: tanpa akun token, tanpa sewa. Harga minimum 0,02 SOL supaya fee 5% tetap di atas batas rent-exempt.

## 3. Cakupan v1

Satu alur lengkap, dari creator sampai pembeli pegang produknya:

**Creator:** connect wallet → isi halaman produk (judul, deskripsi, gambar, kategori, harga SOL) → unggah isi produk → publish.

**Pembeli:** buka market → cari / pilih kategori → buka halaman produk → bayar SOL → isi produk langsung terbuka di "Pembelian saya".

"Isi produk" di v1 ada dua bentuk, satu mekanisme yang sama:

- **File** — dataset, riset, software, template.
- **Teks rahasia** — API key, link undangan komunitas, kredensial akses.

Dengan dua bentuk ini, hampir semua jenis produk di konsep sudah bisa dijual sejak v1.

**Tidak masuk v1:** chat, escrow, refund, x402, token, review/rating, presale. Semua ada di peta jalan (bagian 6).

## 4. Cara kerjanya

### Login
Connect wallet, lalu tanda tangan pesan. Gratis, tanpa SOL. Server memverifikasi tanda tangan. Tidak ada email, tidak ada password.

### Pembayaran — tanpa smart contract
Satu transaksi berisi dua transfer SOL: sebagian besar ke wallet creator, fee ke treasury EVERYNTH. Dua-duanya jadi atau dua-duanya gagal.

Tiap pembelian punya kode unik yang ditempel di transaksi. Server mengecek transaksi di chain: token benar, jumlah benar, penerima benar, kode cocok, belum pernah dipakai. Lolos → akses dibuka.

Kenapa tanpa kontrak: uang tidak pernah dipegang platform, jadi tidak ada dana yang bisa nyangkut atau dicuri. Nol Rust, nol audit di v1. Pelajaran dari escrow OBSCRA lama.

Fee platform: usul 5%, satu angka di config.

### Enkripsi
File dienkripsi di browser creator sebelum diunggah (AES-GCM, bawaan browser). Tempat penyimpanan hanya melihat data acak. Kunci file disimpan server dalam keadaan terkunci lagi, dan baru diberikan ke pembeli setelah pembayaran terverifikasi. File dibuka di browser pembeli.

**Batas yang jujur:** di v1 platform memegang kunci, jadi secara teknis platform bisa membuka file. Ini bukan end-to-end penuh. Alasannya: creator tidak online saat orang membeli, jadi harus ada yang menyerahkan kunci. Sisi baiknya, konten ilegal masih bisa diperiksa dan diturunkan. Naik ke end-to-end penuh ada di tahap chat (kunci per wallet sudah tersedia di sana).

### Teknologi
- Next.js + TypeScript, deploy di Vercel.
- Supabase: database dan penyimpanan file dalam satu layanan, ada paket gratis.
- Solana wallet adapter + `@solana/web3.js`.
- RPC Helius.

Sengaja sedikit. Tidak ada program on-chain, tidak ada layanan enkripsi pihak ketiga.

## 5. Risiko v1

- **Tanpa escrow = tanpa refund.** Pembeli bayar langsung ke creator. Karena isi produk terkirim otomatis, risiko "sudah bayar tidak dikirim" kecil. Risiko "isinya jelek / tidak sesuai" tetap ada. Penangkal v1: tombol lapor dan admin bisa menurunkan produk.
- **Konten terlarang / bajakan.** Perlu syarat layanan dan proses takedown sejak hari pertama.
- **Pembayaran terlihat di chain.** Orang bisa melihat wallet A membayar wallet B. Isi produknya tidak terlihat.
- **Market kosong saat awal.** Perlu 10–20 produk asli sebelum dibuka umum. Ini pekerjaan bisnis, bukan kode.

## 6. Peta jalan setelah v1

Urutan usulan, satu per satu, tiap tahap baru jalan kalau tahap sebelumnya dipakai orang:

1. **v1** — launch + market + bayar SOL + kiriman terenkripsi.
2. **x402 / machine layer** — creator pasang API di belakang gerbang bayar-per-panggilan. Agent bayar otomatis (x402 di Solana umumnya USDC; bisa ditambah sebagai alat bayar kedua saat tahap ini). Tidak butuh kontrak sendiri, dan ini pembeda narasi paling kuat, jadi didahulukan.
3. **Chat privat** — pembeli ↔ creator, end-to-end. Kunci diturunkan dari tanda tangan wallet. Sekalian menaikkan enkripsi file ke end-to-end.
4. **Escrow + sengketa** — untuk jasa yang tidak bisa dikirim instan. Butuh program on-chain dan audit. Paling mahal, jadi belakangan.
5. **Token** — potongan fee, akses creator, akses premium. Fee platform → buyback → reward holder + burn. Pola Merkle hold-to-earn yang sudah terbukti di mainnet bisa dipakai ulang sebagai contoh.

## 7. Rencana kerja v1

1. Kerangka proyek: Next.js, Supabase, login wallet + tanda tangan.
2. Buat produk: form halaman launch, enkripsi di browser, unggah.
3. Market: daftar, cari, kategori, halaman produk.
4. Beli: susun transaksi SOL (creator + fee + kode unik), verifikasi di server, catat pembelian. Bagian uang — wajib ada test.
5. Akses: halaman "Pembelian saya", ambil kunci, buka file di browser.
6. Dashboard creator: daftar produk dan penjualan.
7. Lapor + takedown admin.
8. Uji penuh di devnet dengan wallet asli, baru mainnet.

## 8. Yang masih terbuka

- Besaran fee platform (usul 5%).
- Domain dan arah visual brand EVERYNTH.
- Apakah publish produk bebas atau perlu disetujui admin dulu (usul: bebas, tapi ada tombol lapor).
