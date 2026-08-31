import { describe, expect, it } from "vitest";
import { DASHBOARD_METRIC_CATALOG, type DashboardMetricKey } from "@safestop/types";

import { iconForMetric } from "./dashboard-kpi-icons";
import { detailForMetric } from "./kpi-config";

describe("iconForMetric", () => {
  it("mapeia todas as métricas do catálogo", () => {
    const keys = Object.keys(DASHBOARD_METRIC_CATALOG) as DashboardMetricKey[];

    for (const key of keys) {
      expect(iconForMetric(key)).toBeTruthy();
    }
  });
});

describe("detailForMetric", () => {
  it("distingue estoque e fluxo", () => {
    expect(detailForMetric("activeOccurrences")).toBe("Independente do período");
    expect(detailForMetric("newOccurrencesInPeriod")).toBe("No período selecionado");
  });
});
