"use client";

import type { DashboardPeriodPresetId } from "@/features/dashboard/components/utils/period-presets";
import { DASHBOARD_PERIOD_PRESETS } from "@/features/dashboard/components/utils/period-presets";

import { REPORT_COPY } from "../utils/report-copy";

type ReportPeriodFilterProps = {
  activePreset: DashboardPeriodPresetId;
  onChange: (preset: DashboardPeriodPresetId) => void;
};

export function ReportPeriodFilter({ activePreset, onChange }: ReportPeriodFilterProps) {
  return (
    <div className="flex flex-col gap-2">
      <div aria-label="Período do relatório" className="flex flex-wrap gap-2" role="tablist">
        {DASHBOARD_PERIOD_PRESETS.map((preset) => {
          const selected = activePreset === preset.id;

          return (
            <button
              key={preset.id}
              aria-selected={selected}
              className={`rounded-full border px-3 py-1.5 text-sm transition ${
                selected
                  ? "border-orange-500 bg-orange-500/10 text-orange-200"
                  : "border-gray-700 text-gray-300 hover:border-gray-500"
              }`}
              role="tab"
              type="button"
              onClick={() => {
                onChange(preset.id);
              }}
            >
              {preset.label}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-gray-500">{REPORT_COPY.periodHint}</p>
    </div>
  );
}
