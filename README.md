# POLTEK-UPMI

Dashboard Monitoring Akreditasi & SPMI Politeknik Sinar Mas Berau Coal.

## Menjalankan project

```bash
npm install
npm run dev
```

Buka `http://localhost:3000/dashboard`.

## Logika filter

- LED D3 -> hanya D3 Survei dan Pemetaan / D3 Perawatan Mesin.
- LED D4 -> hanya D4 Teknologi Rekayasa Logistik.
- LKPS -> level Program Studi.
- LED PT dan LKPT -> otomatis level Perguruan Tinggi.
- Kriteria -> Sub Kriteria -> Komponen saling bergantung.
- Tombol Terapkan memindahkan filter pilihan ke grafik, kartu ringkasan, detail filter, dan tabel.
- Dashboard dan Monitoring menggunakan sumber data terpusat yang sama (`data/documentData.ts`).
