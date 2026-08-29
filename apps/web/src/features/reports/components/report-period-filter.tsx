"use client";

import { Button } from "@/components/ui/button";
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
            <Button
              key={preset.id}
              aria-selected={selected}
              className="rounded-full"
              role="tab"
              size="sm"
              type="button"
              variant={selected ? "default" : "outline"}
              onClick={() => {
                onChange(preset.id);
              }}
            >
              {preset.label}
            </Button>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">{REPORT_COPY.periodHint}</p>
    </div>
  );
}
