"use client";

import { useEffect, useMemo, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { supabase } from "@/lib/supabase";
import {
  allDocuments,
  INSTRUMENTS,
  instrumentsForUnit,
  PRODI,
  PT_NAME,
  type DocumentRecord,
  type StatusDokumen,
} from "@/data/documentData";

const statusOptions: readonly StatusDokumen[] = [
  "Belum Upload",
  "Menunggu Review",
  "Perlu Revisi",
  "Disetujui",
];

const filterStatusOptions = [
  "Semua",
  ...statusOptions,
];

const unitOptions = [
  "Semua",
  ...PRODI,
  PT_NAME,
];

type DocumentOverride = {
  status?: StatusDokumen;
  progress?: number;
};

type OverrideMap = Record<string, DocumentOverride>;


export default function MonitoringPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedUnit, setSelectedUnit] =
    useState("Semua");

  const [selectedInstrumen, setSelectedInstrumen] =
    useState("Semua");

  const [selectedStatus, setSelectedStatus] =
    useState("Semua");

  const [overrides, setOverrides] =
    useState<OverrideMap>({});

  const [saveMessage, setSaveMessage] =
    useState("");

  const [dirtyIds, setDirtyIds] =
    useState<Set<string>>(new Set());

  const [loadingData, setLoadingData] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  useEffect(() => {
    const unit =
      new URLSearchParams(
        window.location.search
      ).get("prodi");

    if (
      unit &&
      unitOptions.includes(unit)
    ) {
      setSelectedUnit(unit);
    }

    async function loadDocuments() {
      setLoadingData(true);
      setErrorMessage("");

      const { data, error } =
        await supabase
          .from("documents")
          .select("id,status,progress");

      if (error) {
        console.error(error);
        setErrorMessage(
          `Gagal membaca data Supabase: ${error.message}`
        );
        setLoadingData(false);
        return;
      }

      const next: OverrideMap = {};

      (data ?? []).forEach((row) => {
        next[row.id] = {
          status: row.status as StatusDokumen,
          progress: Number(row.progress ?? 0),
        };
      });

      setOverrides(next);
      setDirtyIds(new Set());
      setLoadingData(false);
    }

    loadDocuments();
  }, []);

  const effectiveDocuments = useMemo(() => {
    return allDocuments.map((doc) => {
      const override =
        overrides[doc.id];

      if (!override) {
        return doc;
      }

      return {
        ...doc,
        status:
          override.status ??
          doc.status,
        progress:
          override.progress ??
          doc.progress,
      };
    });
  }, [overrides]);

  useEffect(() => {
    async function loadAuth() {
      const {
        data: { session },
      } =
        await supabase.auth.getSession();

      setIsAdmin(Boolean(session));
    }

    loadAuth();

    const {
      data: { subscription },
    } =
      supabase.auth.onAuthStateChange(
        (_event, session) => {
          setIsAdmin(Boolean(session));
        }
      );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const availableInstrumen = useMemo(() => {
    if (selectedUnit === "Semua") {
      return [
        "Semua",
        ...INSTRUMENTS,
      ];
    }

    return [
      "Semua",
      ...instrumentsForUnit(
        selectedUnit
      ),
    ];
  }, [selectedUnit]);

  const displayedDocuments = useMemo(() => {
    return effectiveDocuments.filter((doc) => {
      const byUnit =
        selectedUnit === "Semua" ||
        doc.unit === selectedUnit;

      const byInstrument =
        selectedInstrumen === "Semua" ||
        doc.instrumen ===
          selectedInstrumen;

      const byStatus =
        selectedStatus === "Semua" ||
        doc.status ===
          selectedStatus;

      return (
        byUnit &&
        byInstrument &&
        byStatus
      );
    });
  }, [
    effectiveDocuments,
    selectedUnit,
    selectedInstrumen,
    selectedStatus,
  ]);

  const count = (
    status: StatusDokumen
  ) => {
    return displayedDocuments.filter(
      (doc) =>
        doc.status === status
    ).length;
  };

  const averageProgress =
    displayedDocuments.length === 0
      ? 0
      : Math.round(
          displayedDocuments.reduce(
            (sum, doc) =>
              sum +
              doc.progress,
            0
          ) /
            displayedDocuments.length
        );

  function updateStatus(
    doc: DocumentRecord,
    status: StatusDokumen
  ) {
    if (!isAdmin) return;
    const defaultProgress =
      status === "Disetujui"
        ? 100
        : status ===
          "Menunggu Review"
        ? 75
        : status ===
          "Perlu Revisi"
        ? 45
        : 0;

    setOverrides((prev) => ({
      ...prev,
      [doc.id]: {
        ...prev[doc.id],
        status,
        progress: defaultProgress,
      },
    }));

    setDirtyIds((prev) => {
      const next = new Set(prev);
      next.add(doc.id);
      return next;
    });
  }

  function updateProgress(
    doc: DocumentRecord,
    value: number
  ) {
    if (!isAdmin) return;
    const safeValue =
      Math.max(
        0,
        Math.min(
          value,
          100
        )
      );

    setOverrides((prev) => ({
      ...prev,
      [doc.id]: {
        ...prev[doc.id],
        progress: safeValue,
      },
    }));

    setDirtyIds((prev) => {
      const next = new Set(prev);
      next.add(doc.id);
      return next;
    });
  }

  async function saveChanges() {
    if (!isAdmin || dirtyIds.size === 0) return;

    setSaving(true);
    setErrorMessage("");
    setSaveMessage("");

    const ids = Array.from(dirtyIds);

    const results = await Promise.all(
      ids.map(async (id) => {
        const value = overrides[id];

        if (!value) return null;

        const { error } =
          await supabase
            .from("documents")
            .update({
              status: value.status,
              progress: value.progress,
              updated_at: new Date().toISOString(),
            })
            .eq("id", id);

        return { id, error };
      })
    );

    const failed = results.filter(
      (result) => result?.error
    );

    if (failed.length > 0) {
      console.error(failed);

      setErrorMessage(
        `Gagal menyimpan ${failed.length} dokumen: ${
          failed[0]?.error?.message ?? "Unknown error"
        }`
      );

      setSaving(false);
      return;
    }

    setDirtyIds(new Set());
    setSaveMessage(
      `${ids.length} perubahan berhasil disimpan ke Supabase`
    );
    setSaving(false);

    window.setTimeout(() => {
      setSaveMessage("");
    }, 3000);
  }

  async function resetChanges() {
    if (!isAdmin || dirtyIds.size === 0) return;

    const confirmed =
      window.confirm(
        "Batalkan seluruh perubahan yang belum disimpan?"
      );

    if (!confirmed) return;

    setLoadingData(true);
    setErrorMessage("");

    const { data, error } =
      await supabase
        .from("documents")
        .select("id,status,progress");

    if (error) {
      console.error(error);
      setErrorMessage(
        `Gagal memuat ulang data: ${error.message}`
      );
      setLoadingData(false);
      return;
    }

    const next: OverrideMap = {};

    (data ?? []).forEach((row) => {
      next[row.id] = {
        status: row.status as StatusDokumen,
        progress: Number(row.progress ?? 0),
      };
    });

    setOverrides(next);
    setDirtyIds(new Set());
    setLoadingData(false);

    setSaveMessage(
      "Perubahan yang belum disimpan dibatalkan"
    );

    window.setTimeout(() => {
      setSaveMessage("");
    }, 2500);
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* HEADER */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#0b1f5c]">
              Monitoring Dokumen
            </h1>

            <p className="text-slate-600">
              Pantau dan perbarui status serta progress LED D3,
              LED D4, LKPS, LED PT, dan LKPT.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isAdmin ? (
              <>
                {saveMessage && (
                  <span className="rounded-lg bg-green-50 px-3 py-2 text-sm font-medium text-green-700">
                    ✓ {saveMessage}
                  </span>
                )}

                <span className="rounded-full bg-green-50 px-3 py-2 text-xs font-semibold text-green-700">
                  ● Mode Editor
                </span>

                <button
                  type="button"
                  onClick={resetChanges}
                  disabled={dirtyIds.size === 0 || saving}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-[#0b1f5c] transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Batalkan Perubahan
                </button>

                <button
                  type="button"
                  onClick={saveChanges}
                  disabled={dirtyIds.size === 0 || saving}
                  className="rounded-lg bg-[#0b1f5c] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#102b78] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {saving ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </>
            ) : (
              <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-600">
                🔒 Mode Viewer — login Admin UPMI untuk mengedit
              </span>
            )}
          </div>
        </div>

        {errorMessage && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
            {errorMessage}
          </div>
        )}

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-5">
          <SummaryCard
            title="Total Dokumen"
            value={
              displayedDocuments.length
            }
            desc="Dokumen terfilter"
          />

          <SummaryCard
            title="Belum Upload"
            value={count(
              "Belum Upload"
            )}
            desc="Dokumen"
          />

          <SummaryCard
            title="Perlu Revisi"
            value={count(
              "Perlu Revisi"
            )}
            desc="Dokumen"
          />

          <SummaryCard
            title="Menunggu Review"
            value={count(
              "Menunggu Review"
            )}
            desc="Dokumen"
          />

          <SummaryCard
            title="Kesiapan"
            value={`${averageProgress}%`}
            desc="Rata-rata progress"
          />
        </div>

        {/* FILTER + TABLE */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Select
              label="Pilih Prodi / PT"
              value={selectedUnit}
              options={unitOptions}
              onChange={(unit) => {
                setSelectedUnit(
                  unit
                );
                setSelectedInstrumen(
                  "Semua"
                );
                setSelectedStatus(
                  "Semua"
                );
              }}
            />

            <Select
              label="Pilih Instrumen"
              value={
                selectedInstrumen
              }
              options={
                availableInstrumen
              }
              onChange={(value) => {
                setSelectedInstrumen(
                  value
                );
                setSelectedStatus(
                  "Semua"
                );
              }}
            />

            <Select
              label="Status Dokumen"
              value={
                selectedStatus
              }
              options={
                filterStatusOptions
              }
              onChange={
                setSelectedStatus
              }
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
            <p>
              Menampilkan{" "}
              <span className="font-bold text-[#0b1f5c]">
                {
                  displayedDocuments.length
                }
              </span>{" "}
              dokumen.
            </p>

            {loadingData ? (
              <p className="text-xs font-medium text-blue-700">
                Membaca data Supabase...
              </p>
            ) : isAdmin ? (
              <p className="text-xs text-slate-500">
                {dirtyIds.size > 0
                  ? `${dirtyIds.size} perubahan belum disimpan.`
                  : "Semua perubahan sudah tersimpan."}
              </p>
            ) : (
              <p className="text-xs text-slate-500">
                Data dibaca dari database bersama.
              </p>
            )}
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left text-sm text-[#0b1f5c]">
              <thead>
                <tr className="border-b border-slate-300 font-semibold text-[#0b1f5c]">
                  <th className="px-3 py-3">
                    Kode
                  </th>

                  <th className="px-3 py-3">
                    Kriteria
                  </th>

                  <th className="px-3 py-3">
                    Sub Kriteria
                  </th>

                  <th className="px-3 py-3">
                    Komponen
                  </th>

                  <th className="px-3 py-3">
                    Status
                  </th>

                  <th className="px-3 py-3">
                    Progress
                  </th>
                </tr>
              </thead>

              <tbody className="text-[#0b1f5c]">
                {displayedDocuments.map(
                  (item) => (
                    <tr
                      key={item.id}
                      className="border-b border-slate-200 text-[#0b1f5c] transition hover:bg-slate-50"
                    >
                      <td className="px-3 py-4 font-semibold">
                        {item.kode}
                      </td>

                      <td className="px-3 py-4 font-medium">
                        {item.kriteria}
                      </td>

                      <td className="px-3 py-4">
                        {item.subKriteria}
                      </td>

                      <td className="px-3 py-4">
                        {item.komponen}
                      </td>

                      <td className="px-3 py-4">
                        {isAdmin ? (
                          <select
                            value={item.status}
                            onChange={(e) =>
                              updateStatus(
                                item,
                                e.target.value as StatusDokumen
                              )
                            }
                            className="w-44 rounded-lg border border-slate-300 bg-white px-3 py-2 font-medium text-[#0b1f5c] outline-none focus:border-[#0b1f5c]"
                          >
                            {statusOptions.map((status) => (
                              <option
                                key={status}
                                value={status}
                              >
                                {status}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <StatusBadge status={item.status} />
                        )}
                      </td>

                      <td className="px-3 py-4">
                        <div className="flex items-center gap-3">
                          {isAdmin ? (
                            <>
                              <input
                                type="number"
                                min={0}
                                max={100}
                                value={item.progress}
                                onChange={(e) =>
                                  updateProgress(
                                    item,
                                    Number(e.target.value)
                                  )
                                }
                                className="w-20 rounded-lg border border-slate-300 bg-white px-3 py-2 text-center font-semibold text-[#0b1f5c] outline-none focus:border-[#0b1f5c]"
                              />

                              <span className="font-semibold">
                                %
                              </span>
                            </>
                          ) : (
                            <span className="w-14 font-semibold text-[#0b1f5c]">
                              {item.progress}%
                            </span>
                          )}

                          <div className="h-2 w-20 overflow-hidden rounded-full bg-slate-200">
                            <div
                              className="h-full rounded-full bg-[#0b1f5c]"
                              style={{
                                width: `${item.progress}%`,
                              }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  )
                )}

                {!displayedDocuments.length && (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-8 text-center font-medium text-[#0b1f5c]"
                    >
                      Tidak ada dokumen yang sesuai filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-slate-50 px-4 py-3">
            <p className="text-xs text-slate-600">
              Status dan progress disimpan di Supabase agar sama untuk semua admin.
            </p>

            <p className="text-xs font-semibold text-[#0b1f5c]">
              {dirtyIds.size} perubahan belum disimpan
            </p>
          </div>
        </div>
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
  onChange: (
    value: string
  ) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-[#0b1f5c]">
        {label}
      </label>

      <select
        value={value}
        onChange={(e) =>
          onChange(
            e.target.value
          )
        }
        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-[#0b1f5c] outline-none focus:border-[#0b1f5c]"
      >
        {options.map(
          (option) => (
            <option
              key={option}
              value={option}
            >
              {option}
            </option>
          )
        )}
      </select>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: StatusDokumen;
}) {
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
      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${cls}`}
    >
      {status}
    </span>
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

      <h2 className="mt-4 text-3xl font-bold text-[#0b1f5c]">
        {value}
      </h2>

      <p className="text-sm text-slate-600">
        {desc}
      </p>
    </div>
  );
}
