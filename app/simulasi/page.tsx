"use client";

import { useEffect, useMemo, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { supabase } from "@/lib/supabase";

import {
  allDocuments,
  PRODI,
  PT_NAME,
  unique,
  type DocumentRecord,
} from "@/data/documentData";

type ScoreMap = Record<string, number>;
type WeightMap = Record<string, number>;

const ALL = "Semua";

export default function SimulasiPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedUnit, setSelectedUnit] =
    useState(ALL);

  const [selectedInstrument, setSelectedInstrument] =
    useState(ALL);

  const [selectedCriteria, setSelectedCriteria] =
    useState(ALL);

  const [scores, setScores] =
    useState<ScoreMap>({});

  const [weights, setWeights] =
    useState<WeightMap>({});

  const [saveMessage, setSaveMessage] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  const [loadingData, setLoadingData] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [dirtyIds, setDirtyIds] =
    useState<Set<string>>(new Set());

  /* ==============================
     AUTH + LOAD SUPABASE
  ============================== */

  async function loadSimulationData() {
    setLoadingData(true);
    setErrorMessage("");

    const { data, error } =
      await supabase
        .from("simulation_scores")
        .select("document_id,weight,score");

    if (error) {
      console.error(error);
      setErrorMessage(
        `Gagal membaca data simulasi: ${error.message}`
      );
      setLoadingData(false);
      return;
    }

    const nextScores: ScoreMap = {};
    const nextWeights: WeightMap = {};

    (data ?? []).forEach((row) => {
      nextWeights[row.document_id] =
        Number(row.weight ?? 0);

      if (
        row.score !== null &&
        row.score !== undefined
      ) {
        nextScores[row.document_id] =
          Number(row.score);
      }
    });

    setScores(nextScores);
    setWeights(nextWeights);
    setDirtyIds(new Set());
    setLoadingData(false);
  }

  useEffect(() => {
    async function loadAuth() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setIsAdmin(Boolean(session));
    }

    loadAuth();
    loadSimulationData();

    const {
      data: { subscription },
    } =
      supabase.auth.onAuthStateChange(
        (_event, session) => {
          setIsAdmin(Boolean(session));
        }
      );

    const handleFocus = () => {
      loadSimulationData();
    };

    window.addEventListener(
      "focus",
      handleFocus
    );

    return () => {
      subscription.unsubscribe();

      window.removeEventListener(
        "focus",
        handleFocus
      );
    };
  }, []);

  async function saveScores() {
    if (
      !isAdmin ||
      dirtyIds.size === 0
    ) {
      return;
    }

    setSaving(true);
    setErrorMessage("");
    setSaveMessage("");

    const ids = Array.from(dirtyIds);

    const rows = ids.map((id) => ({
      document_id: id,
      weight: weights[id] ?? 0,
      score:
        scores[id] === undefined
          ? null
          : scores[id],
      updated_at:
        new Date().toISOString(),
    }));

    const { error } =
      await supabase
        .from("simulation_scores")
        .upsert(rows, {
          onConflict: "document_id",
        });

    if (error) {
      console.error(error);

      setErrorMessage(
        `Gagal menyimpan bobot dan skor: ${error.message}`
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
    }, 2500);

    await loadSimulationData();
  }

  async function resetScores() {
    if (!isAdmin) return;

    const confirmed =
      window.confirm(
        "Hapus seluruh bobot dan skor simulasi yang tersimpan di database?"
      );

    if (!confirmed) return;

    setSaving(true);
    setErrorMessage("");

    const { error } =
      await supabase
        .from("simulation_scores")
        .delete()
        .not("document_id", "is", null);

    if (error) {
      console.error(error);

      setErrorMessage(
        `Gagal mereset simulasi: ${error.message}`
      );

      setSaving(false);
      return;
    }

    setScores({});
    setWeights({});
    setDirtyIds(new Set());

    setSaveMessage(
      "Bobot dan skor berhasil direset"
    );

    setSaving(false);

    window.setTimeout(() => {
      setSaveMessage("");
    }, 2500);
  }

  /* ==============================
     UNIT
  ============================== */

  const unitOptions = [
    ALL,
    ...PRODI,
    PT_NAME,
  ];

  /* ==============================
     INSTRUMEN
  ============================== */

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

  function changeInstrumentOption(
    option: string
  ) {
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

  /* ==============================
     DATA BERDASARKAN UNIT +
     INSTRUMEN
  ============================== */

  const baseDocuments =
    useMemo(() => {
      return allDocuments.filter(
        (doc) => {
          const unitMatch =
            selectedUnit === ALL ||
            doc.unit ===
              selectedUnit;

          const instrumentMatch =
            selectedInstrument ===
              ALL ||
            doc.instrumen ===
              selectedInstrument;

          return (
            unitMatch &&
            instrumentMatch
          );
        }
      );
    }, [
      selectedUnit,
      selectedInstrument,
    ]);

  /* ==============================
     KRITERIA
  ============================== */

  const criteriaOptions =
    useMemo(() => {
      return [
        ALL,
        ...unique(
          baseDocuments.map(
            (doc) =>
              doc.kriteria
          )
        ),
      ];
    }, [baseDocuments]);

  /* ==============================
     FILTER FINAL
  ============================== */

  const filteredDocuments =
    useMemo(() => {
      return baseDocuments.filter(
        (doc) => {
          return (
            selectedCriteria ===
              ALL ||
            doc.kriteria ===
              selectedCriteria
          );
        }
      );
    }, [
      baseDocuments,
      selectedCriteria,
    ]);

  /* ==============================
     INPUT SKOR & BOBOT
  ============================== */

  function updateScore(
    id: string,
    score: number
  ) {
    if (!isAdmin) return;
    setScores((prev) => ({
      ...prev,
      [id]: score,
    }));

    setDirtyIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }

  function clearScore(
    id: string
  ) {
    if (!isAdmin) return;
    setScores((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });

    setDirtyIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }

  function updateWeight(
    id: string,
    weight: number
  ) {
    if (!isAdmin) return;
    const safeWeight =
      Math.max(
        0,
        Math.min(
          weight,
          100
        )
      );

    setWeights((prev) => ({
      ...prev,
      [id]: safeWeight,
    }));

    setDirtyIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }

  /* ==============================
     STATISTIK
  ============================== */

  const scoredDocuments =
    filteredDocuments.filter(
      (doc) =>
        scores[doc.id] !==
        undefined
    );

  const totalScore =
    scoredDocuments.reduce(
      (total, doc) =>
        total +
        (scores[doc.id] ?? 0),
      0
    );

  const averageScore =
    scoredDocuments.length === 0
      ? 0
      : totalScore /
        scoredDocuments.length;

  const totalWeight =
    filteredDocuments.reduce(
      (total, doc) =>
        total +
        (weights[doc.id] ?? 0),
      0
    );

  const weightedScore =
    filteredDocuments.reduce(
      (total, doc) => {
        const score =
          scores[doc.id];

        const weight =
          weights[doc.id] ?? 0;

        if (
          score === undefined
        ) {
          return total;
        }

        return (
          total +
          (weight / 100) *
            score
        );
      },
      0
    );

  const weightedMaxScore =
    (totalWeight / 100) *
    4;

  const weightedPercentage =
    weightedMaxScore === 0
      ? 0
      : (weightedScore /
          weightedMaxScore) *
        100;

  return (
    <AppLayout>
      <div className="space-y-6">

        {/* =========================
            HEADER
        ========================= */}

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#0b1f5c]">
              Simulasi Skor
            </h1>

            <p className="mt-1 text-slate-600">
              Simulasi penilaian
              internal LED, LKPS,
              LED PT, dan LKPT
              menggunakan bobot
              dan skala penilaian
              0–4.
            </p>
          </div>

          {isAdmin ? (
            <span className="rounded-full bg-green-50 px-4 py-2 text-xs font-semibold text-green-700">
              ● Mode Editor
            </span>
          ) : (
            <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-600">
              🔒 Mode Viewer — login Admin UPMI untuk mengedit bobot dan skor
            </span>
          )}
        </div>

        {loadingData && (
          <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700">
            Membaca data simulasi dari Supabase...
          </div>
        )}

        {errorMessage && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {errorMessage}
          </div>
        )}

        {/* =========================
            SUMMARY
        ========================= */}

        <section className="grid grid-cols-1 gap-5 md:grid-cols-4">

          <SummaryCard
            title="Jumlah Butir"
            value={
              filteredDocuments.length
            }
            desc="Butir penilaian"
          />

          <SummaryCard
            title="Total Bobot"
            value={`${totalWeight.toFixed(
              1
            )}%`}
            desc={
              totalWeight === 100
                ? "Bobot sudah 100%"
                : "Target total 100%"
            }
          />

          <SummaryCard
            title="Rata-rata Skor"
            value={
              averageScore.toFixed(
                2
              )
            }
            desc="Skala 0 - 4"
          />

          <SummaryCard
            title="Skor Tertimbang"
            value={`${weightedScore.toFixed(
              2
            )} / ${weightedMaxScore.toFixed(
              2
            )}`}
            desc={`${weightedPercentage.toFixed(
              1
            )}% dari skor tertimbang maksimum`}
          />

        </section>

        {/* =========================
            FILTER
        ========================= */}

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

          <h2 className="font-bold text-[#0b1f5c]">
            Filter Instrumen
          </h2>

          <p className="mt-1 mb-6 text-sm text-slate-500">
            Pilih unit,
            instrumen, dan
            kriteria yang akan
            dinilai.
          </p>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

            <Select
              label="Pilih Prodi / PT"
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
              label="Pilih Instrumen"
              value={
                selectedInstrumentOption
              }
              options={
                instrumentOptions
              }
              onChange={
                changeInstrumentOption
              }
            />

            <Select
              label="Pilih Kriteria"
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

          </div>
        </section>

        {/* =========================
            TABEL SKOR
        ========================= */}

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="mb-5 flex flex-wrap items-end justify-between gap-4">

            <div>
              <h2 className="font-bold text-[#0b1f5c]">
                Penilaian Butir
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Masukkan bobot (%)
                dan skor 0–4 untuk
                setiap komponen.
                Total skor dihitung
                otomatis dengan
                rumus bobot × skor.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {isAdmin && saveMessage && (
                <span className="rounded-lg bg-green-50 px-3 py-2 text-sm font-medium text-green-700">
                  ✓ {saveMessage}
                </span>
              )}

              <span className="text-sm font-semibold text-[#0b1f5c]">
                {
                  filteredDocuments.length
                }{" "}
                butir
              </span>

              {isAdmin && (
                <>
                  <button
                    type="button"
                    onClick={resetScores}
                    disabled={saving}
                    className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-[#0b1f5c] transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Reset Bobot & Skor
                  </button>

                  <button
                    type="button"
                    onClick={saveScores}
                    disabled={dirtyIds.size === 0 || saving}
                    className="rounded-lg bg-[#0b1f5c] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#102b78] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {saving
                      ? "Menyimpan..."
                      : "Simpan Bobot & Skor"}
                  </button>
                </>
              )}
            </div>

          </div>

          {!isAdmin && (
            <div className="mb-5 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
              Mode Viewer hanya dapat melihat bobot, skor, total skor, dan hasil simulasi. Login sebagai Admin UPMI untuk melakukan perubahan.
            </div>
          )}

          <div className="overflow-x-auto">

            <table className="w-full min-w-[1450px] text-left text-sm">

              <thead>
                <tr className="border-b border-slate-300 font-semibold text-[#0b1f5c]">

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
                    Sub Kriteria
                  </th>

                  <th className="px-3 py-3">
                    Komponen
                  </th>

                  <th className="px-3 py-3">
                    Status Dokumen
                  </th>

                  <th className="px-3 py-3 text-center">
                    Bobot (%)
                  </th>

                  <th className="px-3 py-3 text-center">
                    Skor (0–4)
                  </th>

                  <th className="px-3 py-3 text-center">
                    Total Skor
                    <span className="block text-xs font-normal text-slate-500">
                      Bobot × Skor
                    </span>
                  </th>

                </tr>
              </thead>

              <tbody>

                {filteredDocuments.map(
                  (doc) => (
                    <ScoreRow
                      key={
                        doc.id
                      }
                      doc={
                        doc
                      }
                      isAdmin={
                        isAdmin
                      }
                      weight={
                        weights[
                          doc.id
                        ]
                      }
                      score={
                        scores[
                          doc.id
                        ]
                      }
                      onWeightChange={(
                        value
                      ) =>
                        updateWeight(
                          doc.id,
                          value
                        )
                      }
                      onScoreChange={(
                        value
                      ) =>
                        updateScore(
                          doc.id,
                          value
                        )
                      }
                      onScoreClear={() =>
                        clearScore(
                          doc.id
                        )
                      }
                    />
                  )
                )}

                {!filteredDocuments.length && (
                  <tr>
                    <td
                      colSpan={
                        10
                      }
                      className="py-10 text-center text-slate-500"
                    >
                      Tidak ada data
                      yang sesuai
                      dengan filter.
                    </td>
                  </tr>
                )}

              </tbody>
            </table>

          </div>

          {/* REKAP PERHITUNGAN */}
          <div className="mt-6 grid grid-cols-1 gap-4 rounded-xl border border-blue-100 bg-blue-50/50 p-5 md:grid-cols-4">

            <ResultBox
              label="Total Bobot"
              value={`${totalWeight.toFixed(
                1
              )}%`}
              desc={
                totalWeight === 100
                  ? "Bobot sudah sesuai"
                  : `Selisih dari 100%: ${Math.abs(
                      100 -
                        totalWeight
                    ).toFixed(
                      1
                    )}%`
              }
            />

            <ResultBox
              label="Rata-rata Skor"
              value={`${averageScore.toFixed(
                2
              )} / 4`}
              desc={`${scoredDocuments.length} dari ${filteredDocuments.length} butir dinilai`}
            />

            <ResultBox
              label="Total Skor Tertimbang"
              value={`${weightedScore.toFixed(
                2
              )} / ${weightedMaxScore.toFixed(
                2
              )}`}
              desc={`${weightedPercentage.toFixed(
                1
              )}% capaian tertimbang`}
            />

            <div className="rounded-lg border border-blue-100 bg-white p-4">
              <p className="text-xs font-semibold text-[#0b1f5c]">
                Interpretasi Skor
              </p>

              <div className="mt-2 space-y-1 text-xs text-slate-600">
                <p>4 = Sangat Baik</p>
                <p>3 = Baik</p>
                <p>2 = Cukup</p>
                <p>1 = Kurang</p>
                <p>0 = Tidak Terpenuhi</p>
              </div>
            </div>

          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-slate-50 px-4 py-3">
            <p className="text-xs text-slate-600">
              {isAdmin
                ? "Bobot dan skor disimpan di Supabase sehingga dapat digunakan bersama oleh seluruh admin."
                : "Data simulasi dibaca dari database bersama dalam mode baca saja."}
            </p>

            <p className="text-xs font-semibold text-[#0b1f5c]">
              {Object.keys(scores).length} skor ·{" "}
              {Object.keys(weights).length} bobot ·{" "}
              {dirtyIds.size} perubahan belum disimpan
            </p>
          </div>
        </section>

        {/* =========================
            HASIL SIMULASI
        ========================= */}

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

            <h2 className="font-bold text-[#0b1f5c]">
              Hasil Simulasi Tertimbang
            </h2>

            <div className="mt-6 flex items-center gap-8">

              <ScoreCircle
                percentage={
                  weightedPercentage
                }
              />

              <div className="space-y-4">

                <ResultItem
                  label="Total Bobot"
                  value={`${totalWeight.toFixed(
                    1
                  )}%`}
                />

                <ResultItem
                  label="Rata-rata Skor"
                  value={`${averageScore.toFixed(
                    2
                  )} / 4`}
                />

                <ResultItem
                  label="Skor Tertimbang"
                  value={`${weightedScore.toFixed(
                    2
                  )} / ${weightedMaxScore.toFixed(
                    2
                  )}`}
                />

                <ResultItem
                  label="Capaian Tertimbang"
                  value={`${weightedPercentage.toFixed(
                    1
                  )}%`}
                />

              </div>

            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

            <h2 className="font-bold text-[#0b1f5c]">
              Interpretasi Skor
            </h2>

            <div className="mt-5 space-y-3">

              <ScoreLegend
                score="4"
                label="Sangat Baik"
              />

              <ScoreLegend
                score="3"
                label="Baik"
              />

              <ScoreLegend
                score="2"
                label="Cukup"
              />

              <ScoreLegend
                score="1"
                label="Kurang"
              />

              <ScoreLegend
                score="0"
                label="Tidak Terpenuhi"
              />

            </div>

          </div>

        </section>

      </div>
    </AppLayout>
  );
}

/* ==============================
   SCORE ROW
============================== */

function ScoreRow({
  doc,
  isAdmin,
  weight,
  score,
  onWeightChange,
  onScoreChange,
  onScoreClear,
}: {
  doc: DocumentRecord;
  isAdmin: boolean;
  weight?: number;
  score?: number;
  onWeightChange: (
    weight: number
  ) => void;
  onScoreChange: (
    score: number
  ) => void;
  onScoreClear: () => void;
}) {
  const total =
    score === undefined
      ? null
      : ((weight ?? 0) /
          100) *
        score;

  return (
    <tr className="border-b border-slate-200 text-[#0b1f5c] hover:bg-slate-50">

      <td className="px-3 py-4 font-semibold">
        {doc.kode}
      </td>

      <td className="px-3 py-4">
        {doc.unit}
      </td>

      <td className="px-3 py-4 font-medium">
        {doc.instrumen}
      </td>

      <td className="px-3 py-4">
        {doc.kriteria}
      </td>

      <td className="px-3 py-4">
        {doc.subKriteria}
      </td>

      <td className="max-w-[360px] px-3 py-4">
        {doc.komponen}
      </td>

      <td className="px-3 py-4">
        {doc.status}
      </td>

      <td className="px-3 py-4">
        <div className="flex items-center justify-center gap-2">
          {isAdmin ? (
            <>
              <input
                type="number"
                min={0}
                max={100}
                step="0.01"
                value={
                  weight ?? ""
                }
                onChange={(e) =>
                  onWeightChange(
                    Number(
                      e.target.value
                    )
                  )
                }
                placeholder="0"
                className="w-24 rounded-lg border border-slate-300 bg-white px-3 py-2 text-center font-semibold text-[#0b1f5c] outline-none focus:border-[#0b1f5c]"
              />

              <span className="font-semibold">
                %
              </span>
            </>
          ) : (
            <span className="font-semibold text-[#0b1f5c]">
              {(weight ?? 0).toFixed(2)}%
            </span>
          )}
        </div>
      </td>

      <td className="px-3 py-4">
        {isAdmin ? (
          <select
            value={
              score ?? ""
            }
            onChange={(e) => {
              if (
                e.target.value ===
                ""
              ) {
                onScoreClear();
                return;
              }

              onScoreChange(
                Number(
                  e.target.value
                )
              );
            }}
            className="mx-auto block w-24 rounded-lg border border-slate-300 bg-white px-3 py-2 text-center font-bold text-[#0b1f5c] outline-none focus:border-[#0b1f5c]"
          >
            <option value="">
              -
            </option>

            <option value="0">
              0
            </option>

            <option value="1">
              1
            </option>

            <option value="2">
              2
            </option>

            <option value="3">
              3
            </option>

            <option value="4">
              4
            </option>
          </select>
        ) : (
          <div className="text-center">
            <span className="inline-flex min-w-10 items-center justify-center rounded-lg bg-slate-100 px-3 py-2 font-bold text-[#0b1f5c]">
              {score ?? "-"}
            </span>
          </div>
        )}
      </td>

      <td className="px-3 py-4 text-center">
        {total === null ? (
          <span className="text-slate-400">
            -
          </span>
        ) : (
          <div>
            <p className="font-bold text-green-700">
              {total.toFixed(
                2
              )}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              {(weight ?? 0).toFixed(
                2
              )}
              % × {score}
            </p>
          </div>
        )}
      </td>

    </tr>
  );
}

/* ==============================
   SELECT
============================== */

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
        value={
          value
        }
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
              key={
                option
              }
              value={
                option
              }
            >
              {option}
            </option>
          )
        )}

      </select>

    </div>
  );
}

/* ==============================
   SUMMARY CARD
============================== */

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

/* ==============================
   RESULT BOX
============================== */

function ResultBox({
  label,
  value,
  desc,
}: {
  label: string;
  value: string;
  desc: string;
}) {
  return (
    <div className="rounded-lg border border-blue-100 bg-white p-4">
      <p className="text-xs font-semibold text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-2xl font-bold text-[#0b1f5c]">
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-500">
        {desc}
      </p>
    </div>
  );
}

/* ==============================
   SCORE CIRCLE
============================== */

function ScoreCircle({
  percentage,
}: {
  percentage: number;
}) {
  const safe =
    Math.max(
      0,
      Math.min(
        percentage,
        100
      )
    );

  return (
    <div className="relative flex h-44 w-44 shrink-0 items-center justify-center">

      <div
        className="h-44 w-44 rounded-full"
        style={{
          background: `conic-gradient(
            #0b1f5c 0% ${safe}%,
            #e2e8f0 ${safe}% 100%
          )`,
        }}
      />

      <div className="absolute flex h-28 w-28 flex-col items-center justify-center rounded-full bg-white">

        <span className="text-2xl font-bold text-[#0b1f5c]">
          {safe.toFixed(
            1
          )}
          %
        </span>

        <span className="text-xs text-slate-500">
          Estimasi
        </span>

      </div>

    </div>
  );
}

/* ==============================
   RESULT ITEM
============================== */

function ResultItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-sm text-slate-500">
        {label}
      </p>

      <p className="text-xl font-bold text-[#0b1f5c]">
        {value}
      </p>
    </div>
  );
}

/* ==============================
   SCORE LEGEND
============================== */

function ScoreLegend({
  score,
  label,
}: {
  score: string;
  label: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3">

      <span className="text-sm font-medium text-[#0b1f5c]">
        {label}
      </span>

      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0b1f5c] font-bold text-white">
        {score}
      </span>

    </div>
  );
}
