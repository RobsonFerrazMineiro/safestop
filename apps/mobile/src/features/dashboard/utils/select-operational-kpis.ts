import type { DashboardKpis, DashboardMetricKey } from "@safestop/types";

const OPERATIONAL_CANDIDATES: DashboardMetricKey[] = [
  "scopedOpenOccurrences",
  "scopedPendingAwareness",
  "pendingEvaluation",
  "activeInterdictions",
  "awaitingValidation",
  "mdhoPendingApproval",
];

const ORGANIZATION_WIDE_FALLBACK: DashboardMetricKey = "activeOccurrences";

const MAX_OPERATIONAL_KPIS = 2;

function readMetricValue(kpis: DashboardKpis, key: DashboardMetricKey): number | null {
  if (key in kpis.personal) {
    return kpis.personal[key as keyof typeof kpis.personal];
  }

  if (key in kpis.operational) {
    return kpis.operational[key as keyof typeof kpis.operational];
  }

  return kpis.managerial[key as keyof typeof kpis.managerial];
}

function buildCandidateOrder(kpis: DashboardKpis | undefined): DashboardMetricKey[] {
  const hasScopedOpen = kpis !== undefined && kpis.operational.scopedOpenOccurrences !== null;

  const candidates = hasScopedOpen
    ? OPERATIONAL_CANDIDATES
    : [...OPERATIONAL_CANDIDATES, ORGANIZATION_WIDE_FALLBACK];

  return candidates;
}

export function selectOperationalKpiKeys(
  kpis: DashboardKpis | undefined,
  isMetricAllowed: (key: DashboardMetricKey) => boolean,
): DashboardMetricKey[] {
  const selected: DashboardMetricKey[] = [];

  for (const key of buildCandidateOrder(kpis)) {
    if (!isMetricAllowed(key)) {
      continue;
    }

    if (kpis !== undefined && readMetricValue(kpis, key) === null) {
      continue;
    }

    selected.push(key);

    if (selected.length >= MAX_OPERATIONAL_KPIS) {
      break;
    }
  }

  return selected;
}

export function readHomeMetricValue(
  kpis: DashboardKpis | undefined,
  key: DashboardMetricKey,
): number | undefined {
  if (!kpis) {
    return undefined;
  }

  const value = readMetricValue(kpis, key);

  return value === null ? undefined : value;
}
