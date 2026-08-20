import type { DashboardPeriodFilter } from "@safestop/types";

export type DashboardPeriodPresetId = "today" | "7d" | "30d" | "month";

export const DASHBOARD_PERIOD_PRESETS: readonly {
  id: DashboardPeriodPresetId;
  label: string;
}[] = [
  { id: "today", label: "Hoje" },
  { id: "7d", label: "7 dias" },
  { id: "30d", label: "30 dias" },
  { id: "month", label: "Mês atual" },
] as const;

export const DASHBOARD_DEFAULT_PERIOD_PRESET: DashboardPeriodPresetId = "30d";

export function resolveDashboardPeriodPreset(
  presetId: DashboardPeriodPresetId,
): DashboardPeriodFilter {
  const now = new Date();
  const endAt = now.toISOString();

  switch (presetId) {
    case "today": {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      return { startAt: start.toISOString(), endAt };
    }
    case "7d": {
      const start = new Date(now);
      start.setDate(start.getDate() - 7);
      return { startAt: start.toISOString(), endAt };
    }
    case "30d": {
      const start = new Date(now);
      start.setDate(start.getDate() - 30);
      return { startAt: start.toISOString(), endAt };
    }
    case "month": {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { startAt: start.toISOString(), endAt };
    }
    default: {
      const _exhaustive: never = presetId;
      return _exhaustive;
    }
  }
}
