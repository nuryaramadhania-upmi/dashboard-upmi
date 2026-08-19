"use client";

import { useEffect, useMemo, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { supabase } from "@/lib/supabase";
import {
  allDocuments,
  completionPercent,
  instrumentLevel,
  instrumentsForUnit,
  PRODI,
  PT_NAME,
  unique,
  type DocumentRecord,
  type StatusDokumen,
} from "@/data/documentData";

type Filter = {
  unit: string;
  view: string;
  chart: string;
  instrument: string;
  criteria: string;
  subCriteria: string;
  component: string;
};

type ChartItem = {
  label: string;
  value: number;
  total: number;
  complete: number;
};

type MonitoringOverride = {
  status?: StatusDokumen;
  progress?: number;
};

type MonitoringOverrideMap = Record<string, MonitoringOverride>;
const ALL_UNITS = "Semua Prodi / PT";
const ALL_CRITERIA = "Semua Kriteria";
const ALL_SUB = "Semua Sub Kriteria";
const ALL_COMPONENTS = "Semua Komponen";

const initialFilter: Filter = {
  unit: PRODI[0],
  view: "Progress per Kriteria",
  chart: "Histogram",
  instrument: "LED D3",
  criteria: ALL_CRITERIA,
  subCriteria: ALL_SUB,
  component: ALL_COMPONENTS,
};

export default function DashboardPage() {
  const [draft, setDraft] = useState<Filter>(initialFilter);
  const [applied, setApplied] = useState<Filter>(initialFilter);
  const [monitoringOverrides, setMonitoringOverrides] =
    useState<MonitoringOverrideMap>({});

  const [loadingData, setLoadingData] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState("");

  useEffect(() => {
    let active = true;

    async function loadMonitoringData() {
      if (!active) return;

      setLoadingData(true);
      setErrorMessage("");

      const { data, error } =
        await supabase
          .from("documents")
          .select("id,status,progress");

      if (!active) return;

      if (error) {
        console.error(error);

        setErrorMessage(
          `Gagal membaca data Supabase: ${error.message}`
        );

        setLoadingData(false);
        return;
      }

      const nextOverrides: MonitoringOverrideMap = {};

      (data ?? []).forEach((row) => {
        nextOverrides[row.id] = {
          status: row.status as StatusDokumen,
          progress: Number(row.progress ?? 0),
        };
      });

      setMonitoringOverrides(nextOverrides);
      setLoadingData(false);
    }

    loadMonitoringData();

    const handleFocus = () => {
      loadMonitoringData();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        loadMonitoringData();
      }
    };

    window.addEventListener(
      "focus",
      handleFocus
    );

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    const realtimeChannel = supabase
      .channel("dashboard-documents-sync")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "documents",
        },
        () => {
          loadMonitoringData();
        }
      )
      .subscribe();

    const refreshInterval = window.setInterval(
      () => {
        loadMonitoringData();
      },
      5000
    );

    return () => {
      active = false;

      window.removeEventListener(
        "focus",
        handleFocus
      );

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );

      window.clearInterval(refreshInterval);

      supabase.removeChannel(realtimeChannel);
    };
  }, []);

  const liveDocuments = useMemo<DocumentRecord[]>(() => {
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

  const unitOptions = useMemo<string[]>(() => {
    if (instrumentLevel(draft.instrument) === "PT") {
      return [PT_NAME];
    }

    return [...PRODI];
  }, [draft.instrument]);

  const instrumentOptions = useMemo<string[]>(() => [
    `LED D3 — ${PRODI[0]}`,
    `LED D3 — ${PRODI[1]}`,
    `LED D4 — ${PRODI[2]}`,
    `LKPS — ${PRODI[0]}`,
    `LKPS — ${PRODI[1]}`,
    `LKPS — ${PRODI[2]}`,
    `LED PT — ${PT_NAME}`,
    `LKPT — ${PT_NAME}`,
  ], []);

  const selectedInstrumentOption =
    `${draft.instrument} — ${draft.unit}`;

  const hierarchyDocs = useMemo<DocumentRecord[]>(() => {
    return liveDocuments.filter((doc) => {
      const byInstrument = doc.instrumen === draft.instrument;
      const byUnit = draft.unit === ALL_UNITS || doc.unit === draft.unit;
      return byInstrument && byUnit;
    });
  }, [liveDocuments, draft.instrument, draft.unit]);

  const criteriaOptions = useMemo<string[]>(() => {
    return [
      ALL_CRITERIA,
      ...unique(hierarchyDocs.map((doc) => doc.kriteria)),
    ];
  }, [hierarchyDocs]);

  const subCriteriaOptions = useMemo<string[]>(() => {
    const docs = hierarchyDocs.filter((doc) => {
      return draft.criteria === ALL_CRITERIA || doc.kriteria === draft.criteria;
    });

    return [
      ALL_SUB,
      ...unique(docs.map((doc) => doc.subKriteria)),
    ];
  }, [hierarchyDocs, draft.criteria]);

  const componentOptions = useMemo<string[]>(() => {
    const docs = hierarchyDocs.filter((doc) => {
      const byCriteria =
        draft.criteria === ALL_CRITERIA || doc.kriteria === draft.criteria;
      const bySub =
        draft.subCriteria === ALL_SUB || doc.subKriteria === draft.subCriteria;
      return byCriteria && bySub;
    });

    return [
      ALL_COMPONENTS,
      ...unique(docs.map((doc) => doc.komponen)),
    ];
  }, [hierarchyDocs, draft.criteria, draft.subCriteria]);

  function changeInstrument(option: string) {
    const separator = " — ";
    const separatorIndex = option.indexOf(separator);

    if (separatorIndex === -1) return;

    const instrument = option.slice(0, separatorIndex);
    const unit = option.slice(separatorIndex + separator.length);

    setDraft((prev) => ({
      ...prev,
      instrument,
      unit,
      criteria: ALL_CRITERIA,
      subCriteria: ALL_SUB,
      component: ALL_COMPONENTS,
    }));
  }

  function changeUnit(unit: string) {
    let instrument = draft.instrument;

    if (unit !== ALL_UNITS) {
      const valid = instrumentsForUnit(unit);
      if (!valid.includes(instrument)) {
        instrument = valid[0];
      }
    }

    setDraft((prev) => ({
      ...prev,
      unit,
      instrument,
      criteria: ALL_CRITERIA,
      subCriteria: ALL_SUB,
      component: ALL_COMPONENTS,
    }));
  }

  function changeCriteria(criteria: string) {
    setDraft((prev) => ({
      ...prev,
      criteria,
      subCriteria: ALL_SUB,
      component: ALL_COMPONENTS,
    }));
  }

  function changeSubCriteria(subCriteria: string) {
    setDraft((prev) => ({
      ...prev,
      subCriteria,
      component: ALL_COMPONENTS,
    }));
  }

  const filteredDocs = useMemo<DocumentRecord[]>(() => {
    return filterDocuments(liveDocuments, applied);
  }, [liveDocuments, applied]);

  const chartData = useMemo<ChartItem[]>(() => {
    return makeChartData(filteredDocs, applied);
  }, [filteredDocs, applied]);

  const summary = useMemo(() => {
    const total = filteredDocs.length;
    const lengkap = filteredDocs.filter(
      (doc) => doc.status === "Disetujui"
    ).length;
    const kurang = total - lengkap;

    return {
      total,
      lengkap,
      kurang,
      kesiapan: completionPercent(filteredDocs),
    };
  }, [filteredDocs]);

  const cards = [
    {
      title: "Unit Ditampilkan",
      value: applied.unit === ALL_UNITS ? String(PRODI.length) : "1",
      desc: applied.unit === ALL_UNITS ? "Program Studi" : applied.unit,
    },
    {
      title: "Total Dokumen",
      value: summary.total.toLocaleString("id-ID"),
      desc: applied.instrument,
    },
    {
      title: "Dokumen Disetujui",
      value: summary.lengkap.toLocaleString("id-ID"),
      desc: summary.total
        ? `${Math.round((summary.lengkap / summary.total) * 100)}% dari filter`
        : "0%",
    },
    {
      title: "Kesiapan",
      value: `${summary.kesiapan}%`,
      desc: `${summary.kurang} dokumen belum final`,
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => (
            <div
              key={card.title}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <p className="text-xs font-semibold uppercase text-slate-500">
                {card.title}
              </p>
              <h2 className="mt-3 text-3xl font-bold text-blue-950">
                {card.value}
              </h2>
              <p className="mt-1 truncate text-sm text-slate-500">
                {card.desc}
              </p>
            </div>
          ))}
        </section>

        <div className="flex flex-wrap items-center justify-end gap-3">
          {loadingData && (
            <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
              Membaca data Supabase...
            </span>
          )}

          <span className="rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700">
            Data tersinkron dari Supabase
          </span>
        </div>

        {errorMessage && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
            {errorMessage}
          </div>
        )}

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="font-bold text-blue-950">
                Smart Filter Dashboard
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Instrumen PT otomatis mengubah unit menjadi Perguruan Tinggi.
                LED D3/D4 dan LKPS menampilkan program studi sesuai jenjang.
              </p>
            </div>

            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800">
              {instrumentLevel(draft.instrument) === "PT"
                ? "Level Perguruan Tinggi"
                : "Level Program Studi"}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <SelectBox
              label="Pilih Prodi / PT"
              options={unitOptions}
              value={draft.unit}
              onChange={changeUnit}
            />

            <SelectBox
              label="Jenis Tampilan"
              options={[
                "Progress per Kriteria",
                "Kesiapan per Unit",
                "Kelengkapan Dokumen",
              ]}
              value={draft.view}
              onChange={(view) =>
                setDraft((prev) => ({ ...prev, view }))
              }
            />

            <SelectBox
              label="Jenis Grafik"
              options={[
                "Histogram",
                "Bar Horizontal",
                "Heatmap",
                "Pie Chart",
              ]}
              value={draft.chart}
              onChange={(chart) =>
                setDraft((prev) => ({ ...prev, chart }))
              }
            />

            <SelectBox
              label="Pilih Instrumen"
              options={instrumentOptions}
              value={selectedInstrumentOption}
              onChange={changeInstrument}
            />

            <SelectBox
              label="Pilih Kriteria"
              options={criteriaOptions}
              value={draft.criteria}
              onChange={changeCriteria}
            />

            <SelectBox
              label="Pilih Sub Kriteria"
              options={subCriteriaOptions}
              value={draft.subCriteria}
              onChange={changeSubCriteria}
            />

            <SelectBox
              label="Pilih Komponen / Indikator"
              options={componentOptions}
              value={draft.component}
              onChange={(component) =>
                setDraft((prev) => ({ ...prev, component }))
              }
            />

            <button
              type="button"
              onClick={() => setApplied({ ...draft })}
              className="mt-6 h-10 rounded-lg bg-blue-950 text-sm font-medium text-white transition hover:bg-blue-900"
            >
              Terapkan
            </button>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
            <h3 className="font-bold text-blue-950">
              {applied.chart} — {applied.view}
            </h3>
            <p className="mt-1 mb-6 text-sm text-slate-500">
              {applied.unit} · {applied.instrument} · {applied.criteria}
            </p>
            <Chart data={chartData} type={applied.chart} />
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-5 font-bold text-blue-950">
              Detail Filter Aktif
            </h3>
            <Info label="Prodi / PT" value={applied.unit} />
            <Info
              label="Level"
              value={
                instrumentLevel(applied.instrument) === "PT"
                  ? "Perguruan Tinggi"
                  : "Program Studi"
              }
            />
            <Info label="Instrumen" value={applied.instrument} />
            <Info label="Kriteria" value={applied.criteria} />
            <Info label="Sub Kriteria" value={applied.subCriteria} />
            <Info label="Komponen" value={applied.component} />
            <Info label="Jenis Tampilan" value={applied.view} />
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="font-bold text-blue-950">
              Rata-rata Kesiapan Keseluruhan
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Berdasarkan kombinasi filter yang sedang aktif.
            </p>
            <div className="mt-6 flex justify-center">
              <PieProgress value={summary.kesiapan} />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
            <h3 className="font-bold text-blue-950">Ringkasan Progress</h3>
            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <SummaryBox label="Progress Tercapai" value={`${summary.kesiapan}%`} />
              <SummaryBox
                label="Gap Menuju Target"
                value={`${100 - summary.kesiapan}%`}
              />
              <SummaryBox
                label="Dokumen Disetujui"
                value={String(summary.lengkap)}
              />
              <SummaryBox
                label="Dokumen Belum Final"
                value={String(summary.kurang)}
              />
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <h3 className="font-bold text-blue-950">
                Ringkasan Hasil Filter
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Status dan progress dibaca dari database Supabase yang sama dengan halaman Monitoring Dokumen.
              </p>
            </div>
            <p className="text-sm font-semibold text-blue-950">
              {filteredDocs.length} dokumen
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm text-blue-950">
              <thead>
                <tr className="border-b text-left text-slate-600">
                  <th className="py-3">Kode</th>
                  <th>Kriteria</th>
                  <th>Sub Kriteria</th>
                  <th>Komponen</th>
                  <th>Status</th>
                  <th>Progress</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocs.slice(0, 12).map((doc) => (
                  <tr key={doc.id} className="border-b border-slate-100">
                    <td className="py-3 font-medium">{doc.kode}</td>
                    <td>{doc.kriteria}</td>
                    <td>{doc.subKriteria}</td>
                    <td>{doc.komponen}</td>
                    <td>
                      <StatusBadge status={doc.status} />
                    </td>
                    <td className="font-semibold">{doc.progress}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredDocs.length > 12 && (
            <p className="mt-4 text-xs text-slate-500">
              Menampilkan 12 data pertama. Detail lengkap tersedia di menu Monitoring Dokumen.
            </p>
          )}
        </section>
      </div>
    </AppLayout>
  );
}

function filterDocuments(
  docs: DocumentRecord[],
  filter: Filter
): DocumentRecord[] {
  return docs.filter((doc) => {
    if (doc.instrumen !== filter.instrument) return false;
    if (filter.unit !== ALL_UNITS && doc.unit !== filter.unit) return false;
    if (filter.criteria !== ALL_CRITERIA && doc.kriteria !== filter.criteria)
      return false;
    if (
      filter.subCriteria !== ALL_SUB &&
      doc.subKriteria !== filter.subCriteria
    )
      return false;
    if (
      filter.component !== ALL_COMPONENTS &&
      doc.komponen !== filter.component
    )
      return false;

    return true;
  });
}

function makeChartData(
  docs: DocumentRecord[],
  filter: Filter
): ChartItem[] {
  let groupKey:
    | "unit"
    | "kriteria"
    | "subKriteria"
    | "komponen";

  /*
    PRIORITAS TAMPILAN GRAFIK

    1. Jika Sub Kriteria sudah dipilih,
       "Semua Komponen" harus menampilkan
       SELURUH KOMPONEN pada sub kriteria tersebut.

    2. Jika Kriteria sudah dipilih tetapi
       Sub Kriteria masih "Semua",
       grafik menampilkan Sub Kriteria.

    3. Jika belum memilih Kriteria tertentu,
       grafik mengikuti Jenis Tampilan.
  */

  if (filter.subCriteria !== ALL_SUB) {
    groupKey = "komponen";
  } else if (filter.criteria !== ALL_CRITERIA) {
    groupKey =
      filter.view === "Kelengkapan Dokumen"
        ? "komponen"
        : "subKriteria";
  } else if (
    filter.view === "Kesiapan per Unit" &&
    filter.unit === ALL_UNITS
  ) {
    groupKey = "unit";
  } else if (filter.view === "Kelengkapan Dokumen") {
    groupKey = "komponen";
  } else if (filter.instrument === "LKPS") {
    groupKey = "subKriteria";
  } else {
    groupKey = "kriteria";
  }

  const groups = new Map<string, DocumentRecord[]>();

  docs.forEach((doc) => {
    const key = doc[groupKey];

    if (!key) return;

    const existing = groups.get(key) ?? [];
    existing.push(doc);
    groups.set(key, existing);
  });

  return Array.from(groups.entries()).map(
    ([label, items], index) => ({
      label:
        groupKey === "komponen"
          ? String(index + 1)
          : label,

      value: completionPercent(items),

      total: items.length,

      complete: items.filter(
        (item) =>
          item.status === "Disetujui"
      ).length,
    })
  );
}

function SelectBox({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs text-slate-500">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-blue-950"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

function Chart({ data, type }: { data: ChartItem[]; type: string }) {
  if (!data.length) {
    return (
      <div className="flex h-72 items-center justify-center rounded-lg bg-slate-50 text-slate-500">
        Tidak ada data untuk kombinasi filter ini.
      </div>
    );
  }

  if (type === "Pie Chart") {
    const totalValue = data.reduce((sum, item) => sum + item.value, 0);
    const averageValue = Math.round(
      data.reduce((sum, item) => sum + item.value, 0) / data.length
    );

    const pieColors = [
      "#17245a",
      "#2563eb",
      "#0f766e",
      "#16a34a",
      "#d97706",
      "#dc2626",
      "#7c3aed",
      "#0891b2",
    ];

    let currentPercent = 0;

    const gradientParts =
      totalValue > 0
        ? data.map((item, index) => {
            const start = currentPercent;
            const slice = (item.value / totalValue) * 100;
            const end = start + slice;
            currentPercent = end;
            return `${pieColors[index % pieColors.length]} ${start}% ${end}%`;
          })
        : ["#e2e8f0 0% 100%"];

    return (
      <div className="grid grid-cols-1 gap-8 py-4 lg:grid-cols-2">
        <div className="flex items-center justify-center">
          <div className="relative flex h-64 w-64 items-center justify-center">
            <div
              className="h-64 w-64 rounded-full"
              style={{
                background: `conic-gradient(${gradientParts.join(", ")})`,
              }}
            />
            <div className="absolute flex h-36 w-36 flex-col items-center justify-center rounded-full bg-white shadow-inner">
              <p className="text-3xl font-bold text-blue-950">
                {averageValue}%
              </p>
              <p className="mt-1 text-center text-xs text-slate-500">
                Rata-rata
                <br />
                Kesiapan
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {data.map((item, index) => (
            <div
              key={item.label}
              className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 px-4 py-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{
                    backgroundColor: pieColors[index % pieColors.length],
                  }}
                />
                <span className="truncate text-sm font-medium text-blue-950">
                  {item.label}
                </span>
              </div>
              <span className="shrink-0 font-bold text-blue-950">
                {item.value}%
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === "Bar Horizontal") {
    return (
      <div className="space-y-4 py-3">
        {data.map((item) => (
          <div key={item.label}>
            <div className="mb-1 flex justify-between gap-4 text-sm">
              <span className="font-medium text-blue-950">{item.label}</span>
              <span className="font-bold text-blue-950">{item.value}%</span>
            </div>
            <div className="h-4 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-blue-950"
                style={{ width: `${item.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === "Heatmap") {
    return (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {data.map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-slate-200 p-4"
            style={{
              background: `rgba(23, 36, 90, ${0.08 + item.value / 125})`,
            }}
          >
            <p className="text-sm font-semibold text-blue-950">
              {item.label}
            </p>
            <p className="mt-3 text-2xl font-bold text-blue-950">
              {item.value}%
            </p>
            <p className="mt-1 text-xs text-slate-600">
              {item.complete}/{item.total} disetujui
            </p>
          </div>
        ))}
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
          <p className="mb-2 font-bold text-blue-950">{item.value}%</p>
          <div
            className="w-16 rounded-t-md bg-blue-950"
            style={{ height: `${Math.max(item.value * 2.35, 4)}px` }}
          />
          <p className="mt-3 max-w-[150px] text-center text-xs font-medium text-blue-950">
            {item.label}
          </p>
        </div>
      ))}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-4">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-1 text-sm text-blue-950">{value}</p>
    </div>
  );
}

function PieProgress({ value }: { value: number }) {
  const safeValue = Math.max(0, Math.min(value, 100));

  return (
    <div className="relative flex h-52 w-52 items-center justify-center">
      <div
        className="h-52 w-52 rounded-full"
        style={{
          background: `conic-gradient(#17245a 0% ${safeValue}%, #e2e8f0 ${safeValue}% 100%)`,
        }}
      />
      <div className="absolute flex h-36 w-36 flex-col items-center justify-center rounded-full bg-white shadow-inner">
        <p className="text-3xl font-bold text-blue-950">{safeValue}%</p>
        <p className="mt-1 text-xs text-slate-500">Kesiapan</p>
      </div>
    </div>
  );
}

function SummaryBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-blue-950">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === "Disetujui"
      ? "bg-green-100 text-green-700"
      : status === "Menunggu Review"
      ? "bg-blue-100 text-blue-700"
      : status === "Perlu Revisi"
      ? "bg-yellow-100 text-yellow-700"
      : "bg-red-100 text-red-700";

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${cls}`}
    >
      {status}
    </span>
  );
}
