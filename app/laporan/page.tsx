"use client";

import { useEffect, useMemo, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { supabase } from "@/lib/supabase";
import {
  allDocuments,
  PRODI,
  PT_NAME,
  unique,
  completionPercent,
  type DocumentRecord,
  type StatusDokumen,
} from "@/data/documentData";

type ScoreMap = Record<string, number>;

type MonitoringOverride = {
  status?: StatusDokumen;
  progress?: number;
};

type MonitoringOverrideMap = Record<string, MonitoringOverride>;


type CriteriaSummary = {
  label: string;
  total: number;
  approved: number;
  review: number;
  revision: number;
  missing: number;
  progress: number;
};

const ALL = "Semua";

export default function LaporanPage() {
  const [selectedUnit, setSelectedUnit] = useState(ALL);
  const [selectedInstrument, setSelectedInstrument] = useState(ALL);
  const [selectedCriteria, setSelectedCriteria] = useState(ALL);
  const [scores, setScores] = useState<ScoreMap>({});
  const [monitoringOverrides, setMonitoringOverrides] =
    useState<MonitoringOverrideMap>({});

  const [loadingData, setLoadingData] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState("");

  async function loadReportData() {
    setLoadingData(true);
    setErrorMessage("");

    const [
      documentsResult,
      scoresResult,
    ] = await Promise.all([
      supabase
        .from("documents")
        .select("id,status,progress"),

      supabase
        .from("simulation_scores")
        .select("document_id,score"),
    ]);

    if (documentsResult.error) {
      console.error(documentsResult.error);

      setErrorMessage(
        `Gagal membaca data monitoring: ${documentsResult.error.message}`
      );

      setLoadingData(false);
      return;
    }

    if (scoresResult.error) {
      console.error(scoresResult.error);

      setErrorMessage(
        `Gagal membaca data simulasi skor: ${scoresResult.error.message}`
      );

      setLoadingData(false);
      return;
    }

    const nextMonitoring: MonitoringOverrideMap = {};

    (documentsResult.data ?? []).forEach((row) => {
      nextMonitoring[row.id] = {
        status: row.status as StatusDokumen,
        progress: Number(row.progress ?? 0),
      };
    });

    const nextScores: ScoreMap = {};

    (scoresResult.data ?? []).forEach((row) => {
      if (
        row.score !== null &&
        row.score !== undefined
      ) {
        nextScores[row.document_id] =
          Number(row.score);
      }
    });

    setMonitoringOverrides(nextMonitoring);
    setScores(nextScores);
    setLoadingData(false);
  }

  useEffect(() => {
    loadReportData();

    const handleFocus = () => {
      loadReportData();
    };

    window.addEventListener(
      "focus",
      handleFocus
    );

    return () => {
      window.removeEventListener(
        "focus",
        handleFocus
      );
    };
  }, []);

  const liveDocuments = useMemo(() => {
    return allDocuments.map((doc) => {
      const override = monitoringOverrides[doc.id];

      if (!override) return doc;

      return {
        ...doc,
        status: override.status ?? doc.status,
        progress: override.progress ?? doc.progress,
      };
    });
  }, [monitoringOverrides]);

  const unitOptions = [ALL, ...PRODI, PT_NAME];

  const instrumentOptions = [
    ALL,
    `LED D3 — ${PRODI[0]}`,
    `LED D3 — ${PRODI[1]}`,
    `LED D4 — ${PRODI[2]}`,
    `LKPS — ${PRODI[0]}`,
    `LKPS — ${PRODI[1]}`,
    `LKPS — ${PRODI[2]}`,
    `LED PT — ${PT_NAME}`,
    `LKPT — ${PT_NAME}`,
  ];

  const selectedInstrumentOption =
    selectedInstrument === ALL
      ? ALL
      : `${selectedInstrument} — ${selectedUnit}`;

  function changeInstrumentOption(option: string) {
    if (option === ALL) {
      setSelectedInstrument(ALL);
      setSelectedCriteria(ALL);
      return;
    }

    const separator = " — ";
    const separatorIndex = option.indexOf(separator);

    if (separatorIndex === -1) return;

    const instrument = option.slice(0, separatorIndex);
    const unit = option.slice(separatorIndex + separator.length);

    setSelectedUnit(unit);
    setSelectedInstrument(instrument);
    setSelectedCriteria(ALL);
  }

  const hierarchyDocs = useMemo(() => {
    return liveDocuments.filter((doc) => {
      const byUnit =
        selectedUnit === ALL ||
        doc.unit === selectedUnit;

      const byInstrument =
        selectedInstrument === ALL ||
        doc.instrumen === selectedInstrument;

      return byUnit && byInstrument;
    });
  }, [liveDocuments, selectedUnit, selectedInstrument]);

  const criteriaOptions = useMemo(() => {
    return [
      ALL,
      ...unique(
        hierarchyDocs.map((doc) => doc.kriteria)
      ),
    ];
  }, [hierarchyDocs]);

  const filteredDocs = useMemo(() => {
    return hierarchyDocs.filter((doc) => {
      return (
        selectedCriteria === ALL ||
        doc.kriteria === selectedCriteria
      );
    });
  }, [hierarchyDocs, selectedCriteria]);

  const countStatus = (
    status: StatusDokumen
  ) =>
    filteredDocs.filter(
      (doc) => doc.status === status
    ).length;

  const total = filteredDocs.length;
  const approved = countStatus("Disetujui");
  const review = countStatus("Menunggu Review");
  const revision = countStatus("Perlu Revisi");
  const missing = countStatus("Belum Upload");
  const kesiapan = completionPercent(filteredDocs);

  const criteriaSummary = useMemo(() => {
    const groups = new Map<
      string,
      DocumentRecord[]
    >();

    filteredDocs.forEach((doc) => {
      const label =
        doc.instrumen === "LKPS"
          ? doc.subKriteria
          : doc.kriteria;

      if (!groups.has(label)) {
        groups.set(label, []);
      }

      groups.get(label)?.push(doc);
    });

    return Array.from(groups.entries()).map(
      ([label, docs]): CriteriaSummary => {
        return {
          label,
          total: docs.length,
          approved: docs.filter(
            (doc) => doc.status === "Disetujui"
          ).length,
          review: docs.filter(
            (doc) =>
              doc.status === "Menunggu Review"
          ).length,
          revision: docs.filter(
            (doc) =>
              doc.status === "Perlu Revisi"
          ).length,
          missing: docs.filter(
            (doc) =>
              doc.status === "Belum Upload"
          ).length,
          progress: completionPercent(docs),
        };
      }
    );
  }, [filteredDocs]);

  const scoredDocs = filteredDocs.filter(
    (doc) => scores[doc.id] !== undefined
  );

  const scoreTotal = scoredDocs.reduce(
    (sum, doc) =>
      sum + (scores[doc.id] || 0),
    0
  );

  const averageScore =
    scoredDocs.length === 0
      ? 0
      : scoreTotal / scoredDocs.length;

  const scorePercentage =
    scoredDocs.length === 0
      ? 0
      : (averageScore / 4) * 100;

  function handlePrint() {
    window.print();
  }

  function exportCsv() {
    const rows = [
      [
        "Kriteria",
        "Total",
        "Disetujui",
        "Menunggu Review",
        "Perlu Revisi",
        "Belum Upload",
        "Progress",
      ],
      ...criteriaSummary.map((item) => [
        item.label,
        item.total,
        item.approved,
        item.review,
        item.revision,
        item.missing,
        `${item.progress}%`,
      ]),
    ];

    const csv = rows
      .map((row) =>
        row
          .map((cell) => `"${cell}"`)
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "laporan-akreditasi.csv";
    link.click();

    URL.revokeObjectURL(url);
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* HEADER */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#0b1f5c]">
              Laporan Monitoring Akreditasi & SPMI
            </h1>

            <p className="mt-1 text-slate-600">
              Rekap hasil monitoring dokumen, progres kesiapan,
              dan simulasi skor UPMI.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={exportCsv}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-[#0b1f5c] hover:bg-slate-50"
            >
              Export CSV
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="rounded-lg bg-[#0b1f5c] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#102b78]"
            >
              Cetak Laporan
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700">
            Monitoring tersinkron dari Supabase
          </span>

          <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
            Skor tersinkron dari Supabase
          </span>
        </div>

        {loadingData && (
          <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700">
            Membaca data laporan dari Supabase...
          </div>
        )}

        {errorMessage && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {errorMessage}
          </div>
        )}

        {/* FILTER */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-bold text-[#0b1f5c]">
            Filter Laporan
          </h2>

          <p className="mt-1 mb-5 text-sm text-slate-500">
            Pilih unit, instrumen, dan kriteria yang ingin direkap.
          </p>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Select
              label="Pilih Prodi / PT"
              value={selectedUnit}
              options={unitOptions}
              onChange={(value) => {
                setSelectedUnit(value);
                setSelectedInstrument(ALL);
                setSelectedCriteria(ALL);
              }}
            />

            <Select
              label="Pilih Instrumen"
              value={selectedInstrumentOption}
              options={instrumentOptions}
              onChange={changeInstrumentOption}
            />

            <Select
              label="Pilih Kriteria"
              value={selectedCriteria}
              options={criteriaOptions}
              onChange={setSelectedCriteria}
            />
          </div>
        </section>

        {/* SUMMARY */}
        <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-5">
          <SummaryCard
            title="Total Dokumen"
            value={total}
            desc="Dokumen"
          />

          <SummaryCard
            title="Disetujui"
            value={approved}
            desc="Dokumen final"
          />

          <SummaryCard
            title="Perlu Revisi"
            value={revision}
            desc="Dokumen"
          />

          <SummaryCard
            title="Belum Upload"
            value={missing}
            desc="Dokumen"
          />

          <SummaryCard
            title="Kesiapan"
            value={`${kesiapan}%`}
            desc="Progress keseluruhan"
          />
        </section>

        {/* CHARTS */}
        <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
            <h2 className="font-bold text-[#0b1f5c]">
              Progress per Kriteria
            </h2>

            <p className="mt-1 mb-6 text-sm text-slate-500">
              Persentase kesiapan berdasarkan hasil monitoring dokumen.
            </p>

            <BarChart data={criteriaSummary} />
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-bold text-[#0b1f5c]">
              Status Dokumen
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Proporsi status dokumen aktif.
            </p>

            <div className="mt-6 flex justify-center">
              <StatusDonut
                approved={approved}
                review={review}
                revision={revision}
                missing={missing}
              />
            </div>

            <div className="mt-6 space-y-3">
              <Legend
                label="Disetujui"
                value={approved}
                color="#16a34a"
              />

              <Legend
                label="Menunggu Review"
                value={review}
                color="#2563eb"
              />

              <Legend
                label="Perlu Revisi"
                value={revision}
                color="#d97706"
              />

              <Legend
                label="Belum Upload"
                value={missing}
                color="#dc2626"
              />
            </div>
          </div>
        </section>

        {/* SCORE */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <h2 className="font-bold text-[#0b1f5c]">
                Rekap Simulasi Skor UPMI
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Data skor dibaca dari tabel simulation_scores di Supabase.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-6 text-right">
              <ScoreStat
                label="Rata-rata"
                value={`${averageScore.toFixed(2)} / 4`}
              />

              <ScoreStat
                label="Butir Dinilai"
                value={`${scoredDocs.length} / ${filteredDocs.length}`}
              />

              <ScoreStat
                label="Estimasi"
                value={`${scorePercentage.toFixed(1)}%`}
              />
            </div>
          </div>
        </section>

        {/* TABLE */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="font-bold text-[#0b1f5c]">
              Rekap per Kriteria
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Ringkasan status dan progres tiap kriteria.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-300 font-semibold text-[#0b1f5c]">
                  <th className="px-3 py-3">
                    Kriteria
                  </th>

                  <th className="px-3 py-3 text-center">
                    Total
                  </th>

                  <th className="px-3 py-3 text-center">
                    Disetujui
                  </th>

                  <th className="px-3 py-3 text-center">
                    Review
                  </th>

                  <th className="px-3 py-3 text-center">
                    Revisi
                  </th>

                  <th className="px-3 py-3 text-center">
                    Belum Upload
                  </th>

                  <th className="px-3 py-3">
                    Progress
                  </th>
                </tr>
              </thead>

              <tbody>
                {criteriaSummary.map((item) => (
                  <tr
                    key={item.label}
                    className="border-b border-slate-200 text-[#0b1f5c]"
                  >
                    <td className="px-3 py-4 font-medium">
                      {item.label}
                    </td>

                    <td className="px-3 py-4 text-center">
                      {item.total}
                    </td>

                    <td className="px-3 py-4 text-center">
                      {item.approved}
                    </td>

                    <td className="px-3 py-4 text-center">
                      {item.review}
                    </td>

                    <td className="px-3 py-4 text-center">
                      {item.revision}
                    </td>

                    <td className="px-3 py-4 text-center">
                      {item.missing}
                    </td>

                    <td className="px-3 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-200">
                          <div
                            className="h-full rounded-full bg-[#0b1f5c]"
                            style={{
                              width: `${item.progress}%`,
                            }}
                          />
                        </div>

                        <span className="font-semibold">
                          {item.progress}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}

                {!criteriaSummary.length && (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-10 text-center text-slate-500"
                    >
                      Tidak ada data untuk filter ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-[#0b1f5c]">
        {label}
      </label>

      <select
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-[#0b1f5c] outline-none focus:border-[#0b1f5c]"
      >
        {options.map((option) => (
          <option
            key={option}
            value={option}
          >
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  desc,
}: {
  title: string;
  value: string | number;
  desc: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-slate-600">
        {title}
      </p>

      <h3 className="mt-3 text-3xl font-bold text-[#0b1f5c]">
        {value}
      </h3>

      <p className="mt-1 text-sm text-slate-500">
        {desc}
      </p>
    </div>
  );
}

function BarChart({
  data,
}: {
  data: CriteriaSummary[];
}) {
  if (!data.length) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-500">
        Tidak ada data.
      </div>
    );
  }

  return (
    <div className="flex h-80 items-end gap-5 overflow-x-auto border-b border-l border-slate-300 px-6 pb-4">
      {data.map((item) => (
        <div
          key={item.label}
          className="flex h-full min-w-[110px] flex-1 flex-col items-center justify-end"
        >
          <p className="mb-2 font-bold text-[#0b1f5c]">
            {item.progress}%
          </p>

          <div
            className="w-16 rounded-t-md bg-[#0b1f5c]"
            style={{
              height: `${Math.max(
                item.progress * 2.35,
                4
              )}px`,
            }}
          />

          <p className="mt-3 max-w-[150px] text-center text-xs font-medium text-[#0b1f5c]">
            {item.label}
          </p>
        </div>
      ))}
    </div>
  );
}

function StatusDonut({
  approved,
  review,
  revision,
  missing,
}: {
  approved: number;
  review: number;
  revision: number;
  missing: number;
}) {
  const total =
    approved +
    review +
    revision +
    missing;

  if (!total) {
    return (
      <div className="flex h-48 w-48 items-center justify-center rounded-full bg-slate-100 text-sm text-slate-500">
        Tidak ada data
      </div>
    );
  }

  const p1 = (approved / total) * 100;
  const p2 = p1 + (review / total) * 100;
  const p3 =
    p2 + (revision / total) * 100;

  return (
    <div className="relative flex h-52 w-52 items-center justify-center">
      <div
        className="h-52 w-52 rounded-full"
        style={{
          background: `conic-gradient(
            #16a34a 0% ${p1}%,
            #2563eb ${p1}% ${p2}%,
            #d97706 ${p2}% ${p3}%,
            #dc2626 ${p3}% 100%
          )`,
        }}
      />

      <div className="absolute flex h-32 w-32 flex-col items-center justify-center rounded-full bg-white">
        <p className="text-2xl font-bold text-[#0b1f5c]">
          {total}
        </p>

        <p className="text-xs text-slate-500">
          Dokumen
        </p>
      </div>
    </div>
  );
}

function Legend({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span
          className="h-3 w-3 rounded-full"
          style={{
            backgroundColor: color,
          }}
        />

        <span className="text-sm text-[#0b1f5c]">
          {label}
        </span>
      </div>

      <span className="font-semibold text-[#0b1f5c]">
        {value}
      </span>
    </div>
  );
}

function ScoreStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-xl font-bold text-[#0b1f5c]">
        {value}
      </p>
    </div>
  );
}
