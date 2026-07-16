import Link from "next/link";
import type { OccurrenceSummary } from "@safestop/types";

import { formatOccurrenceSeverity, formatOccurrenceStatus } from "../utils/format-labels";

type OccurrenceListItemProps = {
  occurrence: OccurrenceSummary;
};

export function OccurrenceListItem({ occurrence }: OccurrenceListItemProps) {
  return (
    <Link
      className="flex flex-col gap-2 rounded-lg border border-gray-800 bg-gray-900 px-4 py-4 transition hover:border-gray-600"
      href={`/occurrences/${occurrence.id}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <span className="font-mono text-xs text-orange-400">{occurrence.publicCode}</span>
        <span className="text-xs uppercase tracking-wide text-gray-500">
          {formatOccurrenceSeverity(occurrence.severity)}
        </span>
      </div>
      <span className="text-base font-semibold text-gray-100">{occurrence.title}</span>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-400">
        <span>{formatOccurrenceStatus(occurrence.status)}</span>
        {occurrence.areaName ? <span>{occurrence.areaName}</span> : null}
        {occurrence.createdByName ? <span>{occurrence.createdByName}</span> : null}
      </div>
    </Link>
  );
}
