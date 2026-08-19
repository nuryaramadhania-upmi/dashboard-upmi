export const instruments = [
  {
    name: "LED",
    level: "PRODI",
    components: [
      {
        name: "I. Diferensiasi Misi",
        criteria: [
          {
            name: "Visi, Misi, Tujuan dan Sasaran",
            indicators: [
              "1. Kekhasan VMTS",
              "2. Mekanisme Penyusunan VMTS",
              "3. Tingkat Pemahaman dan Pencapaian VMTS",
            ],
          },
        ],
      },
      {
        name: "II. Akuntabilitas",
        criteria: [
          {
            name: "Tata Pamong dan Tata Kelola",
            indicators: [
              "4. Sistem Tata Pamong",
              "5. Komitmen Pimpinan dan Kemampuan Manajerial",
            ],
          },
          {
            name: "Kerja Sama",
            indicators: [
              "6. Relevansi dan Tingkat Kerja Sama",
              "7. Pelaksanaan Kerja Sama",
            ],
          },
        ],
      },
      {
        name: "VII. Sistem Penjaminan Mutu",
        criteria: [
          {
            name: "SPMI",
            indicators: [
              "57. Keberadaan Unit Penjaminan Mutu",
              "59. Keterlaksanaan Penjaminan Mutu dan AMI",
              "60. Evaluasi Capaian Kinerja",
            ],
          },
        ],
      },
    ],
  },

  {
    name: "LKPS",
    level: "PRODI",
    components: [
      {
        name: "Tabel LKPS",
        criteria: [
          {
            name: "Data LKPS",
            indicators: [
              "Tabel 1. VMTS",
              "Tabel 2.a. Kerja Sama",
              "Tabel 2.b. Keuangan",
              "Tabel 3.a. Kurikulum",
              "Tabel 4.a. Dosen",
              "Tabel 6.a. Mahasiswa",
              "Tabel 7.a. SPMI",
            ],
          },
        ],
      },
    ],
  },

  {
    name: "LED PT",
    level: "PT",
    components: [
      {
        name: "Diferensiasi Misi",
        criteria: [
          {
            name: "Diferensiasi Misi",
            indicators: [
              "Visi, Misi, Tujuan, dan Strategi Perguruan Tinggi",
            ],
          },
        ],
      },
      {
        name: "Relevansi Pendidikan",
        criteria: [
          {
            name: "Relevansi Pendidikan",
            indicators: [
              "Kebijakan Pendidikan",
              "Kurikulum",
              "Pelaksanaan Pembelajaran",
            ],
          },
        ],
      },
      {
        name: "Relevansi Penelitian",
        criteria: [
          {
            name: "Relevansi Penelitian",
            indicators: [
              "Kebijakan Penelitian",
              "Pelaksanaan Penelitian",
              "Luaran Penelitian",
            ],
          },
        ],
      },
      {
        name: "Relevansi Pengabdian Kepada Masyarakat",
        criteria: [
          {
            name: "Relevansi Pengabdian Kepada Masyarakat",
            indicators: [
              "Kebijakan PkM",
              "Pelaksanaan PkM",
              "Luaran PkM",
            ],
          },
        ],
      },
      {
        name: "Akuntabilitas",
        criteria: [
          {
            name: "Akuntabilitas",
            indicators: [
              "Tata Pamong dan Tata Kelola",
              "Pengelolaan Data dan Informasi",
              "Akuntabilitas Pengelolaan Perguruan Tinggi",
            ],
          },
        ],
      },
      {
        name: "Budaya Mutu",
        criteria: [
          {
            name: "Budaya Mutu",
            indicators: [
              "Perangkat SPMI",
              "Implementasi PPEPP",
              "Audit Mutu Internal",
              "Tindak Lanjut Hasil Evaluasi",
            ],
          },
        ],
      },
    ],
  },

  {
    name: "LKPT",
    level: "PT",
    components: [
      {
        name: "Diferensiasi Misi",
        criteria: [
          {
            name: "Diferensiasi Misi",
            indicators: [
              "Tabel 1. Akreditasi Program Studi",
              "Tabel 2. Sertifikasi Eksternal",
              "Akreditasi Internasional Program Studi",
            ],
          },
        ],
      },

      {
        name: "Relevansi Pendidikan",
        criteria: [
          {
            name: "Relevansi Pendidikan",
            indicators: [
              "Rasio Mahasiswa terhadap Dosen",
              "Kecukupan Dosen Tetap",
              "Kecukupan Dosen Tidak Tetap",
              "Jabatan Akademik Dosen",
              "Kelulusan Tepat Waktu",
              "Waktu Tunggu Lulusan",
              "Kepuasan Pengguna Lulusan",
              "Prestasi Mahasiswa",
              "Implementasi MBKM",
            ],
          },
        ],
      },

      {
        name: "Relevansi Penelitian",
        criteria: [
          {
            name: "Relevansi Penelitian",
            indicators: [
              "Produktivitas Penelitian",
              "Luaran Penelitian",
              "Sitasi Artikel",
              "Karya Dosen Terekognisi",
            ],
          },
        ],
      },

      {
        name: "Relevansi Pengabdian Kepada Masyarakat",
        criteria: [
          {
            name: "Relevansi Pengabdian Kepada Masyarakat",
            indicators: [
              "Produktivitas Pengabdian kepada Masyarakat",
              "Luaran Pengabdian kepada Masyarakat",
            ],
          },
        ],
      },

      {
        name: "Akuntabilitas",
        criteria: [
          {
            name: "Akuntabilitas",
            indicators: [
              "Audit Eksternal Keuangan",
              "Kepuasan Stakeholder",
            ],
          },
        ],
      },

      {
        name: "Budaya Mutu",
        criteria: [
          {
            name: "Budaya Mutu",
            indicators: [
              "Implementasi SPMI",
              "Audit Mutu Internal",
              "Tindak Lanjut Hasil Audit",
            ],
          },
        ],
      },
    ],
  },
];

export const prodiData = [
  {
    id: 1,
    nama: "D3 Survei dan Pemetaan",
    jenjang: "D3",
    totalDokumen: 416,
    dokumenLengkap: 341,
  },
  {
    id: 2,
    nama: "D3 Perawatan Mesin",
    jenjang: "D3",
    totalDokumen: 416,
    dokumenLengkap: 30,
  },
  {
    id: 3,
    nama: "D4 Teknologi Rekayasa Logistik",
    jenjang: "D4",
    totalDokumen: 416,
    dokumenLengkap: 301,
  },
];

export const getDokumenKurang = (
  totalDokumen: number,
  dokumenLengkap: number
) => {
  return totalDokumen - dokumenLengkap;
};

export const getKesiapan = (
  totalDokumen: number,
  dokumenLengkap: number
) => {
  if (totalDokumen === 0) return 0;

  return Math.round((dokumenLengkap / totalDokumen) * 100);
};

export const getStatusKesiapan = (kesiapan: number) => {
  if (kesiapan >= 85) return "Sangat Baik";
  if (kesiapan >= 70) return "Baik";
  if (kesiapan >= 50) return "Cukup";

  return "Kurang";
};

export const prodiSummary = prodiData.map((prodi) => {
  const dokumenKurang = getDokumenKurang(
    prodi.totalDokumen,
    prodi.dokumenLengkap
  );

  const kesiapan = getKesiapan(
    prodi.totalDokumen,
    prodi.dokumenLengkap
  );

  const status = getStatusKesiapan(kesiapan);

  return {
    ...prodi,
    dokumenKurang,
    kesiapan,
    status,
  };
});

export const dashboardSummary = {
  jumlahProdi: prodiSummary.length,

  totalDokumen: prodiSummary.reduce(
    (sum, item) => sum + item.totalDokumen,
    0
  ),

  dokumenLengkap: prodiSummary.reduce(
    (sum, item) => sum + item.dokumenLengkap,
    0
  ),

  dokumenKurang: prodiSummary.reduce(
    (sum, item) => sum + item.dokumenKurang,
    0
  ),
};