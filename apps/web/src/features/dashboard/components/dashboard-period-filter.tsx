"use client";

import type { DashboardPeriodPresetId } from "./utils/period-presets";
import { DASHBOARD_PERIOD_PRESETS } from "./utils/period-presets";

type DashboardPeriodFilterProps = {
  activePreset: DashboardPeriodPresetId;
  onChange: (preset: DashboardPeriodPresetId) => void;
};

export function DashboardPeriodFilter({ activePreset, onChange }: DashboardPeriodFilterProps) {
  return (
    <div className="flex flex-col gap-2">
      <div
        aria-label="Período dos indicadores de fluxo"
        className="flex flex-wrap gap-2"
        role="tablist"
      >
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
      <p className="text-xs text-gray-500">O período afeta apenas indicadores de fluxo</p>
    </div>
  );
}
