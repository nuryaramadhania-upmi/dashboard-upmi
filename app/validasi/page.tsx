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
  unique,
  type DocumentRecord,
  type StatusDokumen,
} from "@/data/documentData";

const ALL = "Semua";

type MonitoringOverride = {
  status?: StatusDokumen;
  progress?: number;
};

type MonitoringMap = Record<string, MonitoringOverride>;

type ValidationRecord = {
  note?: string;
  reviewedAt?: string;
};

type ValidationMap = Record<string, ValidationRecord>;

type LiveDocument =
  DocumentRecord & {
    note?: string;
    reviewedAt?: string;
  };

export default function ValidasiPage() {
  const [isAdmin, setIsAdmin] =
    useState(false);

  const [selectedUnit, setSelectedUnit] =
    useState(ALL);

  const [
    selectedInstrument,
    setSelectedInstrument,
  ] = useState(ALL);

  const [
    selectedCriteria,
    setSelectedCriteria,
  ] = useState(ALL);

  const [
    selectedStatus,
    setSelectedStatus,
  ] = useState("Menunggu Review");

  const [
    monitoringData,
    setMonitoringData,
  ] = useState<MonitoringMap>({});

  const [
    validationData,
    setValidationData,
  ] = useState<ValidationMap>({});

  const [
    selectedDocumentId,
    setSelectedDocumentId,
  ] = useState<string | null>(null);

  const [
    selectedNoteDocumentId,
    setSelectedNoteDocumentId,
  ] = useState<string | null>(null);

  const [reviewNote, setReviewNote] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  const [loadingData, setLoadingData] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  /* ========================================
     AUTH SUPABASE
  ======================================== */

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

  /* ========================================
     LOAD DOCUMENTS + VALIDATIONS
  ======================================== */

  async function loadData() {
    setLoadingData(true);
    setErrorMessage("");

    const [
      documentsResult,
      validationsResult,
    ] = await Promise.all([
      supabase
        .from("documents")
        .select(
          "id,status,progress"
        ),

      supabase
        .from("validations")
        .select(
          "document_id,catatan,tanggal_review"
        ),
    ]);

    if (documentsResult.error) {
      console.error(
        documentsResult.error
      );

      setErrorMessage(
        `Gagal membaca documents: ${documentsResult.error.message}`
      );

      setLoadingData(false);
      return;
    }

    if (validationsResult.error) {
      console.error(
        validationsResult.error
      );

      setErrorMessage(
        `Gagal membaca validations: ${validationsResult.error.message}`
      );

      setLoadingData(false);
      return;
    }

    const nextMonitoring: MonitoringMap =
      {};

    (
      documentsResult.data ?? []
    ).forEach((row) => {
      nextMonitoring[row.id] = {
        status:
          row.status as StatusDokumen,

        progress:
          Number(
            row.progress ?? 0
          ),
      };
    });

    const nextValidation: ValidationMap =
      {};

    (
      validationsResult.data ?? []
    ).forEach((row) => {
      nextValidation[
        row.document_id
      ] = {
        note:
          row.catatan ?? "",

        reviewedAt:
          row.tanggal_review
            ? new Date(
                row.tanggal_review
              ).toLocaleString(
                "id-ID"
              )
            : "",
      };
    });

    setMonitoringData(
      nextMonitoring
    );

    setValidationData(
      nextValidation
    );

    setLoadingData(false);
  }

  useEffect(() => {
    loadData();

    const handleFocus = () => {
      loadData();
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

  /* ========================================
     LIVE DOCUMENT
  ======================================== */

  const liveDocuments =
    useMemo<LiveDocument[]>(() => {
      return allDocuments.map(
        (doc) => {
          const monitoring =
            monitoringData[
              doc.id
            ];

          const validation =
            validationData[
              doc.id
            ];

          return {
            ...doc,

            status:
              monitoring?.status ??
              doc.status,

            progress:
              monitoring?.progress ??
              doc.progress,

            note:
              validation?.note ??
              "",

            reviewedAt:
              validation?.reviewedAt ??
              "",
          };
        }
      );
    }, [
      monitoringData,
      validationData,
    ]);

  /* ========================================
     FILTER OPTIONS
  ======================================== */

  const unitOptions = [
    ALL,
    ...PRODI,
    PT_NAME,
  ];

  const instrumentOptions =
    useMemo(() => {
      if (
        selectedUnit === ALL
      ) {
        return [
          ALL,
          ...INSTRUMENTS,
        ];
      }

      return [
        ALL,
        ...instrumentsForUnit(
          selectedUnit
        ),
      ];
    }, [selectedUnit]);

  const hierarchyDocs =
    useMemo(() => {
      return liveDocuments.filter(
        (doc) => {
          const byUnit =
            selectedUnit === ALL ||
            doc.unit ===
              selectedUnit;

          const byInstrument =
            selectedInstrument ===
              ALL ||
            doc.instrumen ===
              selectedInstrument;

          return (
            byUnit &&
            byInstrument
          );
        }
      );
    }, [
      liveDocuments,
      selectedUnit,
      selectedInstrument,
    ]);

  const criteriaOptions =
    useMemo(() => {
      return [
        ALL,
        ...unique(
          hierarchyDocs.map(
            (doc) =>
              doc.kriteria
          )
        ),
      ];
    }, [hierarchyDocs]);

  const filteredDocuments =
    useMemo(() => {
      return hierarchyDocs.filter(
        (doc) => {
          const byCriteria =
            selectedCriteria ===
              ALL ||
            doc.kriteria ===
              selectedCriteria;

          const byStatus =
            selectedStatus ===
              ALL ||
            doc.status ===
              selectedStatus;

          return (
            byCriteria &&
            byStatus
          );
        }
      );
    }, [
      hierarchyDocs,
      selectedCriteria,
      selectedStatus,
    ]);

  /* ========================================
     SUMMARY
  ======================================== */

  const countStatus = (
    status: StatusDokumen
  ) =>
    liveDocuments.filter(
      (doc) =>
        doc.status === status
    ).length;

  const waiting =
    countStatus(
      "Menunggu Review"
    );

  const revision =
    countStatus(
      "Perlu Revisi"
    );

  const approved =
    countStatus(
      "Disetujui"
    );

  const total =
    liveDocuments.length;

  /* ========================================
     SELECTED DOCUMENTS
  ======================================== */

  const selectedDocument =
    useMemo(() => {
      return liveDocuments.find(
        (doc) =>
          doc.id ===
          selectedDocumentId
      );
    }, [
      liveDocuments,
      selectedDocumentId,
    ]);

  const selectedNoteDocument =
    useMemo(() => {
      return liveDocuments.find(
        (doc) =>
          doc.id ===
          selectedNoteDocumentId
      );
    }, [
      liveDocuments,
      selectedNoteDocumentId,
    ]);

  function openReview(
    doc: LiveDocument
  ) {
    if (!isAdmin) return;

    setSelectedDocumentId(
      doc.id
    );

    setReviewNote(
      doc.note ?? ""
    );
  }

  /* ========================================
     SAVE VALIDATION -> SUPABASE
  ======================================== */

  async function saveValidation(
    status: StatusDokumen
  ) {
    if (
      !isAdmin ||
      !selectedDocument
    ) {
      return;
    }

    setSaving(true);
    setErrorMessage("");
    setMessage("");

    const progress =
      status === "Disetujui"
        ? 100
        : status ===
          "Menunggu Review"
        ? 75
        : status ===
          "Perlu Revisi"
        ? 45
        : 0;

    const now =
      new Date().toISOString();

    /* 1. UPDATE STATUS + PROGRESS DOCUMENT */

    const {
      error: documentError,
    } =
      await supabase
        .from("documents")
        .update({
          status,
          progress,
          updated_at: now,
        })
        .eq(
          "id",
          selectedDocument.id
        );

    if (documentError) {
      console.error(
        documentError
      );

      setErrorMessage(
        `Gagal memperbarui dokumen: ${documentError.message}`
      );

      setSaving(false);
      return;
    }

    /* 2. CEK VALIDASI SUDAH ADA ATAU BELUM */

    const {
      data: existingValidation,
      error: findError,
    } =
      await supabase
        .from("validations")
        .select("id")
        .eq(
          "document_id",
          selectedDocument.id
        )
        .maybeSingle();

    if (findError) {
      console.error(
        findError
      );

      setErrorMessage(
        `Gagal mengecek validasi: ${findError.message}`
      );

      setSaving(false);
      return;
    }

    let validationError = null;

    if (
      existingValidation
    ) {
      const result =
        await supabase
          .from("validations")
          .update({
            catatan:
              reviewNote,

            status_validasi:
              status,

            tanggal_review:
              now,

            updated_at:
              now,
          })
          .eq(
            "id",
            existingValidation.id
          );

      validationError =
        result.error;
    } else {
      const result =
        await supabase
          .from("validations")
          .insert({
            document_id:
              selectedDocument.id,

            catatan:
              reviewNote,

            status_validasi:
              status,

            tanggal_review:
              now,

            updated_at:
              now,
          });

      validationError =
        result.error;
    }

    if (validationError) {
      console.error(
        validationError
      );

      setErrorMessage(
        `Status dokumen sudah berubah, tetapi catatan validasi gagal disimpan: ${validationError.message}`
      );

      setSaving(false);

      await loadData();
      return;
    }

    setMessage(
      status === "Disetujui"
        ? "Dokumen berhasil disetujui dan validasi tersimpan."
        : status ===
          "Perlu Revisi"
        ? "Dokumen dikembalikan untuk revisi dan catatan tersimpan."
        : "Validasi berhasil disimpan."
    );

    setSelectedDocumentId(
      null
    );

    setReviewNote("");

    setSaving(false);

    await loadData();

    window.setTimeout(() => {
      setMessage("");
    }, 3000);
  }

  return (
    <AppLayout>
      <div className="space-y-6">

        {/* HEADER */}

        <div className="flex flex-wrap items-start justify-between gap-4">

          <div>
            <h1 className="text-2xl font-bold text-[#0b1f5c]">
              Validasi UPMI
            </h1>

            <p className="mt-1 text-slate-600">
              Review kelengkapan
              dokumen, berikan
              catatan, dan tetapkan
              hasil validasi UPMI.
            </p>
          </div>

          {isAdmin ? (
            <span className="rounded-full bg-green-50 px-4 py-2 text-xs font-semibold text-green-700">
              ● Mode Editor
            </span>
          ) : (
            <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-600">
              🔒 Mode Viewer — login Admin UPMI untuk melakukan validasi
            </span>
          )}

        </div>

        {message && (
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
            ✓ {message}
          </div>
        )}

        {errorMessage && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {errorMessage}
          </div>
        )}

        {loadingData && (
          <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700">
            Membaca data dari Supabase...
          </div>
        )}

        {/* SUMMARY */}

        <section className="grid grid-cols-1 gap-5 md:grid-cols-4">

          <SummaryCard
            title="Menunggu Review"
            value={waiting}
            desc="Dokumen"
          />

          <SummaryCard
            title="Perlu Revisi"
            value={revision}
            desc="Dokumen"
          />

          <SummaryCard
            title="Disetujui"
            value={approved}
            desc="Dokumen"
          />

          <SummaryCard
            title="Total Dokumen"
            value={total}
            desc="Seluruh instrumen"
          />

        </section>

        {/* FILTER */}

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="mb-5">

            <h2 className="font-bold text-[#0b1f5c]">
              Filter Validasi
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Pilih unit,
              instrumen,
              kriteria, dan status
              dokumen.
            </p>

          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">

            <Select
              label="Prodi / PT"
              value={
                selectedUnit
              }
              options={
                unitOptions
              }
              onChange={(value) => {
                setSelectedUnit(
                  value
                );

                setSelectedInstrument(
                  ALL
                );

                setSelectedCriteria(
                  ALL
                );
              }}
            />

            <Select
              label="Instrumen"
              value={
                selectedInstrument
              }
              options={
                instrumentOptions
              }
              onChange={(value) => {
                setSelectedInstrument(
                  value
                );

                setSelectedCriteria(
                  ALL
                );
              }}
            />

            <Select
              label="Kriteria"
              value={
                selectedCriteria
              }
              options={
                criteriaOptions
              }
              onChange={
                setSelectedCriteria
              }
            />

            <Select
              label="Status Validasi"
              value={
                selectedStatus
              }
              options={[
                ALL,
                "Menunggu Review",
                "Perlu Revisi",
                "Disetujui",
                "Belum Upload",
              ]}
              onChange={
                setSelectedStatus
              }
            />

          </div>
        </section>

        {!isAdmin && (
          <div className="rounded-xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm text-blue-800">
            Mode Viewer hanya dapat melihat data validasi. Login sebagai Admin UPMI untuk memberikan catatan, menyetujui, atau mengembalikan dokumen untuk revisi.
          </div>
        )}

        {/* TABLE */}

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="mb-5 flex items-end justify-between gap-4">

            <div>

              <h2 className="font-bold text-[#0b1f5c]">
                Daftar Dokumen
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Dokumen yang memerlukan pemeriksaan UPMI.
              </p>

            </div>

            <p className="text-sm font-semibold text-[#0b1f5c]">
              {
                filteredDocuments.length
              }{" "}
              dokumen
            </p>

          </div>

          <div className="overflow-x-auto">

            <table className="w-full min-w-[1250px] text-left text-sm text-[#0b1f5c]">

              <thead>

                <tr className="border-b border-slate-300">

                  <th className="px-3 py-3">
                    Kode
                  </th>

                  <th className="px-3 py-3">
                    Prodi/PT
                  </th>

                  <th className="px-3 py-3">
                    Instrumen
                  </th>

                  <th className="px-3 py-3">
                    Kriteria
                  </th>

                  <th className="px-3 py-3">
                    Komponen
                  </th>

                  <th className="px-3 py-3">
                    Status
                  </th>

                  <th className="px-3 py-3">
                    Catatan UPMI
                  </th>

                  <th className="px-3 py-3">
                    Tanggal Review
                  </th>

                  <th className="px-3 py-3">
                    Aksi
                  </th>

                </tr>

              </thead>

              <tbody>

                {filteredDocuments.map(
                  (doc) => (

                    <tr
                      key={doc.id}
                      className="border-b border-slate-200 hover:bg-slate-50"
                    >

                      <td className="px-3 py-4 font-semibold">
                        {doc.kode}
                      </td>

                      <td className="px-3 py-4">
                        {doc.unit}
                      </td>

                      <td className="px-3 py-4">
                        {doc.instrumen}
                      </td>

                      <td className="px-3 py-4">
                        {doc.kriteria}
                      </td>

                      <td className="max-w-[420px] px-3 py-4">
                        {doc.komponen}
                      </td>

                      <td className="px-3 py-4">

                        <StatusBadge
                          status={
                            doc.status
                          }
                        />

                      </td>

                      <td className="px-3 py-4">

                        {doc.note ? (
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedNoteDocumentId(
                                doc.id
                              )
                            }
                            className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                          >
                            Lihat Catatan
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">
                            Belum ada catatan
                          </span>
                        )}

                      </td>

                      <td className="px-3 py-4">

                        {doc.reviewedAt ? (
                          <span className="text-sm">
                            {doc.reviewedAt}
                          </span>
                        ) : (
                          <span className="text-slate-400">
                            -
                          </span>
                        )}

                      </td>

                      <td className="px-3 py-4">

                        {isAdmin ? (
                          <button
                            type="button"
                            onClick={() =>
                              openReview(
                                doc
                              )
                            }
                            className="rounded-lg bg-[#0b1f5c] px-4 py-2 text-xs font-semibold text-white hover:bg-[#102b78]"
                          >
                            Review
                          </button>
                        ) : (
                          <span className="text-xs font-medium text-slate-400">
                            Read Only
                          </span>
                        )}

                      </td>

                    </tr>

                  )
                )}

                {!filteredDocuments.length && (

                  <tr>

                    <td
                      colSpan={9}
                      className="py-10 text-center text-slate-500"
                    >
                      Tidak ada dokumen yang sesuai filter.
                    </td>

                  </tr>

                )}

              </tbody>

            </table>

          </div>

        </section>

        {/* PANEL LIHAT CATATAN */}

        {selectedNoteDocument && (
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

            <div className="mb-5 flex items-start justify-between gap-4">

              <div>

                <h2 className="text-lg font-bold text-[#0b1f5c]">
                  Catatan Validasi UPMI
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {selectedNoteDocument.instrumen} ·{" "}
                  {selectedNoteDocument.kriteria}
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedNoteDocumentId(
                    null
                  )
                }
                className="text-sm font-semibold text-slate-500 hover:text-red-600"
              >
                Tutup
              </button>

            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

              <div className="rounded-xl bg-slate-50 p-5">

                <Info
                  label="Kode"
                  value={String(
                    selectedNoteDocument.kode
                  )}
                />

                <Info
                  label="Prodi / PT"
                  value={
                    selectedNoteDocument.unit
                  }
                />

                <Info
                  label="Instrumen"
                  value={
                    selectedNoteDocument.instrumen
                  }
                />

                <Info
                  label="Kriteria"
                  value={
                    selectedNoteDocument.kriteria
                  }
                />

                <Info
                  label="Komponen"
                  value={
                    selectedNoteDocument.komponen
                  }
                />

              </div>

              <div className="rounded-xl border border-slate-200 p-5 lg:col-span-2">

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                  <Info
                    label="Status"
                    value={
                      selectedNoteDocument.status
                    }
                  />

                  <Info
                    label="Tanggal Review"
                    value={
                      selectedNoteDocument.reviewedAt ||
                      "-"
                    }
                  />

                </div>

                <div className="mt-4">

                  <p className="text-xs font-semibold text-slate-500">
                    Catatan UPMI
                  </p>

                  <div className="mt-2 whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-sm leading-6 text-[#0b1f5c]">
                    {selectedNoteDocument.note ||
                      "Belum ada catatan."}
                  </div>

                </div>

              </div>

            </div>

          </section>
        )}

        {/* PANEL REVIEW */}

        {isAdmin && selectedDocument && (

          <section className="rounded-xl border border-blue-200 bg-white p-6 shadow-sm">

            <div className="mb-5 flex items-start justify-between gap-4">

              <div>

                <h2 className="text-lg font-bold text-[#0b1f5c]">
                  Review Dokumen
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {
                    selectedDocument.instrumen
                  }{" "}
                  ·{" "}
                  {
                    selectedDocument.kriteria
                  }
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedDocumentId(
                    null
                  )
                }
                className="text-sm font-semibold text-slate-500 hover:text-red-600"
              >
                Tutup
              </button>

            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

              <div className="rounded-xl bg-slate-50 p-5">

                <Info
                  label="Kode"
                  value={String(
                    selectedDocument.kode
                  )}
                />

                <Info
                  label="Prodi / PT"
                  value={
                    selectedDocument.unit
                  }
                />

                <Info
                  label="Instrumen"
                  value={
                    selectedDocument.instrumen
                  }
                />

                <Info
                  label="Kriteria"
                  value={
                    selectedDocument.kriteria
                  }
                />

                <Info
                  label="Sub Kriteria"
                  value={
                    selectedDocument.subKriteria
                  }
                />

                <Info
                  label="Komponen"
                  value={
                    selectedDocument.komponen
                  }
                />

              </div>

              <div>

                <label className="mb-2 block text-sm font-semibold text-[#0b1f5c]">
                  Catatan UPMI
                </label>

                <textarea
                  value={
                    reviewNote
                  }
                  onChange={(e) =>
                    setReviewNote(
                      e.target.value
                    )
                  }
                  rows={8}
                  placeholder="Contoh: Bukti belum dilengkapi berita acara dan dokumentasi pelaksanaan..."
                  className="w-full rounded-xl border border-slate-300 p-4 text-sm text-[#0b1f5c] outline-none focus:border-[#0b1f5c]"
                />

                <div className="mt-5 flex flex-wrap gap-3">

                  <button
                    type="button"
                    disabled={saving}
                    onClick={() =>
                      saveValidation(
                        "Perlu Revisi"
                      )
                    }
                    className="rounded-lg bg-yellow-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-yellow-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving
                      ? "Menyimpan..."
                      : "Perlu Revisi"}
                  </button>

                  <button
                    type="button"
                    disabled={saving}
                    onClick={() =>
                      saveValidation(
                        "Disetujui"
                      )
                    }
                    className="rounded-lg bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving
                      ? "Menyimpan..."
                      : "Setujui Dokumen"}
                  </button>

                </div>

              </div>

            </div>

          </section>

        )}

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
        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-[#0b1f5c]"
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

      <h2 className="mt-3 text-3xl font-bold text-[#0b1f5c]">
        {value}
      </h2>

      <p className="mt-1 text-sm text-slate-500">
        {desc}
      </p>

    </div>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="mb-4">

      <p className="text-xs font-semibold text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-sm font-medium text-[#0b1f5c]">
        {value}
      </p>

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
