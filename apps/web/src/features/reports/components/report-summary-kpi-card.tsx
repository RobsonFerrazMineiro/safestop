"use client";

type ReportSummaryKpiCardProps = {
  label: string;
  value: number | string;
  tone?: "default" | "destructive" | "warning" | "info";
  isLoading?: boolean;
};

function toneClasses(tone: NonNullable<ReportSummaryKpiCardProps["tone"]>): string {
  switch (tone) {
    case "destructive":
      return "border-red-800/60 bg-red-950/20";
    case "warning":
      return "border-amber-700/50 bg-amber-950/20";
    case "info":
      return "border-blue-800/60 bg-blue-950/20";
    default:
      return "border-gray-800 bg-gray-900/40";
  }
}

export function ReportSummaryKpiCard({
  label,
  value,
  tone = "default",
  isLoading,
}: ReportSummaryKpiCardProps) {
  return (
    <div
      aria-label={label}
      className={`flex min-h-[7rem] flex-col justify-between gap-2 rounded-lg border p-4 ${toneClasses(tone)}`}
      role="group"
    >
      <span className="text-3xl font-bold tabular-nums text-gray-100">
        {isLoading ? "…" : value}
      </span>
      <span className="line-clamp-2 text-sm text-gray-400">{label}</span>
    </div>
  );
}

export function ReportSummaryKpiSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="min-h-[7rem] animate-pulse rounded-lg border border-gray-800 bg-gray-900/40"
    />
  );
}
