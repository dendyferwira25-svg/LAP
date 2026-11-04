# Agenda Kerja Tim Lupung Advertising & Printing (LAP)

Starter website React + Vite + Supabase untuk agenda kerja tim LAP. Responsif untuk HP dan komputer.

## Fitur awal
- Login menggunakan Supabase Auth (email dan password).
- Tambah agenda dengan tanggal, bagian, penanggung jawab, prioritas, status, dan keterangan.
- Filter agenda berdasarkan bulan dan bagian.
- Ringkasan jumlah agenda berdasarkan status.
- Akses data dibatasi menggunakan Supabase Row Level Security (RLS).
- Kepala unit dapat melihat seluruh bagian bila profilnya disetel `role = 'head'`.

## 1. Siapkan Supabase
1. Buka proyek Supabase.
2. Masuk ke **SQL Editor** lalu pilih **New query**.
3. Salin seluruh isi `supabase/schema.sql`, tempel, lalu klik **Run**.
4. Buka **Project Settings > API** atau halaman API Keys. Salin Project URL dan publishable/public key.
5. Buka **Authentication > Users**, lalu buat akun pengguna dengan email dan password.
6. Untuk setiap pengguna, tambahkan baris di tabel `public.profiles` melalui Table Editor dengan `id` yang sama seperti User ID di Authentication, `full_name`, `department`, dan `role`. Untuk kepala unit gunakan `role = head`; pengguna lain `role = staff`.

Departemen yang digunakan di aplikasi: `Kepala Unit`, `Desain Grafis`, `Admin`, `Operator Mesin`, `Finishing`, `Welder`.

## 2. Konfigurasi lokal (opsional)
1. Salin `.env.example` menjadi `.env`.
2. Isi:

```env
VITE_SUPABASE_URL=https://PROJECT-ID.supabase.co
VITE_SUPABASE_ANON_KEY=PASTE_PUBLIC_KEY_HERE
```

Gunakan Project URL dan kunci publik/publishable yang sesuai. Jangan gunakan `service_role` atau secret key di browser.

3. Instal Node.js versi LTS jika belum ada.
4. Di terminal pada folder proyek jalankan:

```bash
npm install
npm run dev
```

## 3. Upload ke GitHub melalui browser
1. Ekstrak ZIP ini di komputer.
2. Buka repository GitHub yang dibuat.
3. Klik **Add file > Upload files**.
4. Unggah isi folder hasil ekstraksi (pastikan `package.json`, `src`, `supabase`, dan `index.html` terlihat di root repository). Jangan unggah file `.env`.
5. Klik **Commit changes**.

## 4. Deploy di Vercel
1. Buka https://vercel.com/ dan masuk menggunakan GitHub.
2. Klik **Add New > Project**, pilih repository.
3. Framework preset: Vite (biasanya terdeteksi otomatis).
4. Tambahkan Environment Variables:
   - `VITE_SUPABASE_URL` = Project URL Supabase
   - `VITE_SUPABASE_ANON_KEY` = public/publishable key Supabase
5. Klik **Deploy**.

## Catatan penting sebelum digunakan oleh tim
- Ini adalah versi awal yang perlu dikonfigurasi dan diuji; ZIP ini tidak otomatis terhubung ke proyek Supabase Anda.
- Login pada versi ini menggunakan email dan password Supabase Auth. Jika ingin staf login dengan username, perlu ditambahkan mekanisme username yang aman.
- Pastikan profil semua pengguna dibuat, lalu uji akses tiap peran menggunakan akun terpisah.
- RLS pada schema adalah titik awal, bukan audit keamanan menyeluruh. Tinjau kebijakan sebelum menyimpan data penting.
