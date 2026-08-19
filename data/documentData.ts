import { ledD3Components } from "./ledD3Components";
import { ledD4Components } from "./ledD4Components";
import { lkpsComponents } from "./lkpsComponents";
import { lkptComponents } from "./lkptComponents";

export type StatusDokumen =
  | "Belum Upload"
  | "Menunggu Review"
  | "Perlu Revisi"
  | "Disetujui";

export type DocumentRecord = {
  id: string;
  kode: string | number;
  kriteria: string;
  subKriteria: string;
  komponen: string;
  sumber: string;
  unit: string;
  level: "PRODI" | "PT";
  instrumen: "LED D3" | "LED D4" | "LKPS" | "LED PT" | "LKPT";
  pic: string;
  status: StatusDokumen;
  progress: number;
};

type RawItem = {
  id?: number | string;
  kode?: number | string;
  kriteria?: string;
  subKriteria?: string;
  komponen?: string;
  sumber?: string;
  pic?: string;
};

export const PRODI = [
  "D3 Survei dan Pemetaan",
  "D3 Perawatan Mesin",
  "D4 Teknologi Rekayasa Logistik",
] as const;

export const PT_NAME = "Politeknik Sinar Mas Berau Coal";

export const INSTRUMENTS = [
  "LED D3",
  "LED D4",
  "LKPS",
  "LED PT",
  "LKPT",
] as const;

/* =========================================================
   MASTER KRITERIA PT
========================================================= */

export const PT_CRITERIA = [
  "Diferensiasi Misi",
  "Relevansi Pendidikan",
  "Relevansi Penelitian",
  "Relevansi Pengabdian Kepada Masyarakat",
  "Akuntabilitas",
  "Budaya Mutu",
] as const;

/* =========================================================
   LED PT
========================================================= */

const ledPtComponents: RawItem[] = [
  {
    id: 1,
    kode: "1",
    kriteria: "Diferensiasi Misi",
    subKriteria: "VMTS",
    komponen: "Kekhasan dan diferensiasi misi",
    sumber: "LED PT",
  },

  {
    id: 2,
    kode: "2",
    kriteria: "Relevansi Pendidikan",
    subKriteria: "Pendidikan",
    komponen: "Relevansi penyelenggaraan pendidikan",
    sumber: "LED PT",
  },

  {
    id: 3,
    kode: "3",
    kriteria: "Relevansi Penelitian",
    subKriteria: "Penelitian",
    komponen: "Relevansi penelitian perguruan tinggi",
    sumber: "LED PT",
  },

  {
    id: 4,
    kode: "4",
    kriteria: "Relevansi Pengabdian Kepada Masyarakat",
    subKriteria: "Pengabdian kepada Masyarakat",
    komponen: "Relevansi PkM perguruan tinggi",
    sumber: "LED PT",
  },

  {
    id: 5,
    kode: "5",
    kriteria: "Akuntabilitas",
    subKriteria: "Tata Pamong dan Tata Kelola",
    komponen: "Statuta dan Struktur Organisasi",
    sumber: "LED PT",
  },

  {
    id: 6,
    kode: "6",
    kriteria: "Akuntabilitas",
    subKriteria: "Tata Pamong dan Tata Kelola",
    komponen: "Sistem Tata Pamong",
    sumber: "LED PT",
  },

  {
    id: 7,
    kode: "7",
    kriteria: "Akuntabilitas",
    subKriteria: "Tata Pamong dan Tata Kelola",
    komponen: "Sistem Pengelolaan Data",
    sumber: "LED PT",
  },

  {
    id: 8,
    kode: "8",
    kriteria: "Budaya Mutu",
    subKriteria: "SPMI Perguruan Tinggi",
    komponen: "Perangkat SPMI",
    sumber: "LED PT",
  },

  {
    id: 9,
    kode: "9",
    kriteria: "Budaya Mutu",
    subKriteria: "SPMI Perguruan Tinggi",
    komponen: "Implementasi PPEPP",
    sumber: "LED PT",
  },

  {
    id: 10,
    kode: "10",
    kriteria: "Budaya Mutu",
    subKriteria: "SPMI Perguruan Tinggi",
    komponen: "Laporan Implementasi SPMI",
    sumber: "LED PT",
  },

  {
    id: 11,
    kode: "11",
    kriteria: "Budaya Mutu",
    subKriteria: "SPMI Perguruan Tinggi",
    komponen: "Pengakuan Mutu Akreditasi",
    sumber: "LED PT",
  },
];

/* =========================================================
   STATUS DUMMY
========================================================= */

const statusPattern: StatusDokumen[] = [
  "Disetujui",
  "Disetujui",
  "Menunggu Review",
  "Perlu Revisi",
  "Belum Upload",
];

const progressByStatus: Record<StatusDokumen, number> = {
  "Belum Upload": 0,
  "Menunggu Review": 75,
  "Perlu Revisi": 45,
  "Disetujui": 100,
};

/* =========================================================
   GENERATOR DOKUMEN
========================================================= */

function makeDocuments(
  data: RawItem[],
  instrumen: DocumentRecord["instrumen"],
  unit: string,
  level: DocumentRecord["level"],
  seed: number
): DocumentRecord[] {
  return data.map((item, index) => {
    const status =
      statusPattern[(seed + index) % statusPattern.length];

    return {
      id: `${instrumen}-${unit}-${item.id ?? index + 1}`,

      kode:
        item.kode ??
        item.id ??
        index + 1,

      kriteria:
        item.kriteria ||
        "Tanpa Kriteria",

      subKriteria:
        item.subKriteria ||
        "Tanpa Sub Kriteria",

      komponen:
        item.komponen ||
        "Tanpa Komponen",

      sumber:
        item.sumber ||
        "-",

      unit,

      level,

      instrumen,

      pic:
        item.pic ||
        "-",

      status,

      progress:
        progressByStatus[status],
    };
  });
}

/* =========================================================
   SEMUA DOKUMEN
========================================================= */

export const allDocuments: DocumentRecord[] = [
  /* D3 SPM */
  ...makeDocuments(
    ledD3Components,
    "LED D3",
    PRODI[0],
    "PRODI",
    0
  ),

  /* D3 Perawatan Mesin */
  ...makeDocuments(
    ledD3Components,
    "LED D3",
    PRODI[1],
    "PRODI",
    1
  ),

  /* D4 TRL */
  ...makeDocuments(
    ledD4Components,
    "LED D4",
    PRODI[2],
    "PRODI",
    2
  ),

  /* LKPS D3 SPM */
  ...makeDocuments(
    lkpsComponents,
    "LKPS",
    PRODI[0],
    "PRODI",
    3
  ),

  /* LKPS D3 PM */
  ...makeDocuments(
    lkpsComponents,
    "LKPS",
    PRODI[1],
    "PRODI",
    4
  ),

  /* LKPS D4 TRL */
  ...makeDocuments(
    lkpsComponents,
    "LKPS",
    PRODI[2],
    "PRODI",
    0
  ),

  /* LED PT */
  ...makeDocuments(
    ledPtComponents,
    "LED PT",
    PT_NAME,
    "PT",
    1
  ),

  /* LKPT */
  ...makeDocuments(
    lkptComponents,
    "LKPT",
    PT_NAME,
    "PT",
    2
  ),
];

/* =========================================================
   LEVEL INSTRUMEN
========================================================= */

export function instrumentLevel(
  instrument: string
): "PRODI" | "PT" {
  return instrument === "LED PT" ||
    instrument === "LKPT"
    ? "PT"
    : "PRODI";
}

/* =========================================================
   UNIT YANG VALID PER INSTRUMEN
========================================================= */

export function unitsForInstrument(
  instrument: string
): string[] {
  if (instrumentLevel(instrument) === "PT") {
    return [PT_NAME];
  }

  if (instrument === "LED D3") {
    return [
      PRODI[0],
      PRODI[1],
    ];
  }

  if (instrument === "LED D4") {
    return [
      PRODI[2],
    ];
  }

  return [...PRODI];
}

/* =========================================================
   INSTRUMEN YANG VALID PER UNIT
========================================================= */

export function instrumentsForUnit(
  unit: string
): string[] {
  if (unit === PT_NAME) {
    return [
      "LED PT",
      "LKPT",
    ];
  }

  if (unit === PRODI[2]) {
    return [
      "LED D4",
      "LKPS",
    ];
  }

  if (
    unit === PRODI[0] ||
    unit === PRODI[1]
  ) {
    return [
      "LED D3",
      "LKPS",
    ];
  }

  return [...INSTRUMENTS];
}

/* =========================================================
   UNIQUE
========================================================= */

export function unique(
  values: string[]
): string[] {
  return Array.from(
    new Set(values.filter(Boolean))
  );
}

/* =========================================================
   PERSENTASE KESIAPAN
========================================================= */

export function completionPercent(
  docs: DocumentRecord[]
): number {
  if (!docs.length) {
    return 0;
  }

  const total = docs.reduce(
    (sum, item) =>
      sum + item.progress,
    0
  );

  return Math.round(
    total / docs.length
  );
}