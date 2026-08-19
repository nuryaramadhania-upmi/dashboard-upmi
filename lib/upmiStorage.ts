"use client";

import type {
  DocumentRecord,
  StatusDokumen,
} from "@/data/documentData";

/* =========================================================
   STORAGE KEYS
========================================================= */

export const AUTH_KEY = "upmi-auth-role";

export const MONITORING_STORAGE_KEY =
  "upmi-monitoring-overrides";

export const VALIDATION_STORAGE_KEY =
  "upmi-validation-data";

export const MASTER_STORAGE_KEY =
  "upmi-master-data";

export const SCORE_STORAGE_KEY =
  "upmi-simulation-scores";

export const WEIGHT_STORAGE_KEY =
  "upmi-simulation-weights";

export const UPMI_DATA_CHANGED_EVENT =
  "upmi-data-changed";

/* =========================================================
   TYPES
========================================================= */

export type MonitoringOverride = {
  status?: StatusDokumen;
  progress?: number;
};

export type MonitoringMap =
  Record<string, MonitoringOverride>;

export type ValidationRecord = {
  note?: string;
  reviewedAt?: string;
};

export type ValidationMap =
  Record<string, ValidationRecord>;

export type MasterRecord = {
  pic?: string;
  link?: string;
};

export type MasterMap =
  Record<string, MasterRecord>;

export type ScoreMap =
  Record<string, number>;

export type WeightMap =
  Record<string, number>;

export type LiveDocument =
  DocumentRecord & {
    link?: string;
    note?: string;
    reviewedAt?: string;
    score?: number;
    weight?: number;
    weightedScore?: number;
  };

export type UpmiStoredData = {
  monitoring: MonitoringMap;
  validation: ValidationMap;
  master: MasterMap;
  scores: ScoreMap;
  weights: WeightMap;
};

/* =========================================================
   SAFE JSON
========================================================= */

function readJSON<T>(
  key: string,
  fallback: T
): T {
  if (typeof window === "undefined") {
    return fallback;
  }

  const saved =
    localStorage.getItem(key);

  if (!saved) {
    return fallback;
  }

  try {
    return JSON.parse(saved) as T;
  } catch {
    console.error(
      `Gagal membaca localStorage: ${key}`
    );

    return fallback;
  }
}

function writeJSON(
  key: string,
  value: unknown
) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(
    key,
    JSON.stringify(value)
  );

  notifyUpmiDataChanged();
}

/* =========================================================
   AUTH
========================================================= */

export function isAdminUPMI() {
  if (typeof window === "undefined") {
    return false;
  }

  return (
    localStorage.getItem(
      AUTH_KEY
    ) === "admin"
  );
}

/* =========================================================
   READ ALL
========================================================= */

export function readUpmiStoredData():
  UpmiStoredData {
  return {
    monitoring:
      readJSON<MonitoringMap>(
        MONITORING_STORAGE_KEY,
        {}
      ),

    validation:
      readJSON<ValidationMap>(
        VALIDATION_STORAGE_KEY,
        {}
      ),

    master:
      readJSON<MasterMap>(
        MASTER_STORAGE_KEY,
        {}
      ),

    scores:
      readJSON<ScoreMap>(
        SCORE_STORAGE_KEY,
        {}
      ),

    weights:
      readJSON<WeightMap>(
        WEIGHT_STORAGE_KEY,
        {}
      ),
  };
}

/* =========================================================
   MERGE ALL DATA
========================================================= */

export function getLiveDocuments(
  sourceDocuments: DocumentRecord[]
): LiveDocument[] {
  const stored =
    readUpmiStoredData();

  return sourceDocuments.map(
    (doc) => {
      const monitoring =
        stored.monitoring[
          doc.id
        ];

      const validation =
        stored.validation[
          doc.id
        ];

      const master =
        stored.master[
          doc.id
        ];

      const score =
        stored.scores[
          doc.id
        ];

      const weight =
        stored.weights[
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

        pic:
          master?.pic ??
          doc.pic,

        link:
          master?.link ??
          "",

        note:
          validation?.note ??
          "",

        reviewedAt:
          validation?.reviewedAt ??
          "",

        score,

        weight,

        weightedScore:
          score === undefined
            ? undefined
            : ((weight ?? 0) /
                100) *
              score,
      };
    }
  );
}

/* =========================================================
   MONITORING
========================================================= */

export function saveMonitoringMap(
  value: MonitoringMap
) {
  writeJSON(
    MONITORING_STORAGE_KEY,
    value
  );
}

export function updateMonitoringDocument(
  id: string,
  value: MonitoringOverride
) {
  const current =
    readJSON<MonitoringMap>(
      MONITORING_STORAGE_KEY,
      {}
    );

  const next = {
    ...current,

    [id]: {
      ...current[id],
      ...value,
    },
  };

  saveMonitoringMap(next);

  return next;
}

/* =========================================================
   VALIDATION
========================================================= */

export function saveValidationMap(
  value: ValidationMap
) {
  writeJSON(
    VALIDATION_STORAGE_KEY,
    value
  );
}

export function updateValidationDocument(
  id: string,
  value: ValidationRecord
) {
  const current =
    readJSON<ValidationMap>(
      VALIDATION_STORAGE_KEY,
      {}
    );

  const next = {
    ...current,

    [id]: {
      ...current[id],
      ...value,
    },
  };

  saveValidationMap(next);

  return next;
}

/* =========================================================
   MASTER DATA
========================================================= */

export function saveMasterMap(
  value: MasterMap
) {
  writeJSON(
    MASTER_STORAGE_KEY,
    value
  );
}

/* =========================================================
   SIMULATION
========================================================= */

export function saveScoreMap(
  value: ScoreMap
) {
  writeJSON(
    SCORE_STORAGE_KEY,
    value
  );
}

export function saveWeightMap(
  value: WeightMap
) {
  writeJSON(
    WEIGHT_STORAGE_KEY,
    value
  );
}

/* =========================================================
   EVENT SYNC
========================================================= */

export function notifyUpmiDataChanged() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new Event(
      UPMI_DATA_CHANGED_EVENT
    )
  );
}

/* =========================================================
   RESET
========================================================= */

export function resetAllUpmiData() {
  if (typeof window === "undefined") {
    return;
  }

  [
    MONITORING_STORAGE_KEY,
    VALIDATION_STORAGE_KEY,
    MASTER_STORAGE_KEY,
    SCORE_STORAGE_KEY,
    WEIGHT_STORAGE_KEY,
  ].forEach((key) =>
    localStorage.removeItem(key)
  );

  notifyUpmiDataChanged();
}
