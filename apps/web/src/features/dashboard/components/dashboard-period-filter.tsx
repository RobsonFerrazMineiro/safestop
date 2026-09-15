"use client";

import { Button } from "@/components/ui/button";

import type { DashboardPeriodPresetId } from "./utils/period-presets";
import { DASHBOARD_PERIOD_PRESETS } from "./utils/period-presets";

type DashboardPeriodFilterProps = {
  activePreset: DashboardPeriodPresetId;
  onChange: (preset: DashboardPeriodPresetId) => void;
};

export function DashboardPeriodFilter({ activePreset, onChange }: DashboardPeriodFilterProps) {
  return (
    <div className="flex flex-col gap-1.5 sm:items-end">
      <div
        aria-label="Período dos indicadores de fluxo"
        className="flex flex-wrap gap-1.5"
        role="radiogroup"
      >
        {DASHBOARD_PERIOD_PRESETS.map((preset) => {
          const selected = activePreset === preset.id;

          return (
            <Button
              key={preset.id}
              aria-checked={selected}
              className={
                selected
                  ? "border-primary bg-primary/10 font-medium text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }
              role="radio"
              size="sm"
              type="button"
              variant="outline"
              onClick={() => {
                onChange(preset.id);
              }}
            >
              {preset.label}
            </Button>
          );
        })}
      </div>
      <p className="text-[11px] text-muted-foreground/75">
        O período afeta apenas indicadores de fluxo
      </p>
    </div>
  );
}
