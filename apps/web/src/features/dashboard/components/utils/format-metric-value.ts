import type { DashboardMetricKey } from "@safestop/types";
import { DASHBOARD_METRIC_CATALOG } from "@safestop/types";

export function formatDashboardMetricValue(key: DashboardMetricKey, value: number): string {
  const unit = DASHBOARD_METRIC_CATALOG[key].unit;

  switch (unit) {
    case "minutes": {
      if (value < 60) {
        return `${Math.round(value)} min`;
      }

      const hours = Math.floor(value / 60);
      const minutes = Math.round(value % 60);

      return minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`;
    }
    case "percent":
      return `${Math.round(value)}%`;
    default:
      return String(Math.round(value));
  }
}
