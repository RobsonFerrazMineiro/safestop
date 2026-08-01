import Link from "next/link";

import { Can } from "@/features/authorization";
import type { OccurrenceSummaryEnriched } from "@/features/occurrences";

import {
  formatOccurrenceSeverity,
  formatOccurrenceStatus,
} from "@/features/occurrences/utils/format-labels";

type StopWorkListItemProps = {
  item: OccurrenceSummaryEnriched;
};

function formatDate(value: string): string {
  return new Date(value).toLocaleString("pt-BR");
}

export function StopWorkListItem({ item }: StopWorkListItemProps) {
  return (
    <Link
      className="grid gap-2 rounded-lg border border-gray-800 bg-gray-900 px-4 py-4 transition hover:border-gray-600 sm:grid-cols-[minmax(0,1fr)_auto]"
      href={`/stop-work/${item.id}`}
    >
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs text-orange-400">{item.publicCode}</span>
          <span className="text-xs uppercase tracking-wide text-gray-500">
            {formatOccurrenceSeverity(item.severity)}
          </span>
        </div>
        <span className="truncate text-base font-semibold text-gray-100">{item.title}</span>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-gray-400">
          <span>{formatOccurrenceStatus(item.status)}</span>
          {item.areaName ? <span>{item.areaName}</span> : null}
          {item.contractorOrganizationName ? <span>{item.contractorOrganizationName}</span> : null}
        </div>
      </div>
      <span className="self-start text-xs text-gray-500 sm:self-center">
        {formatDate(item.createdAt)}
      </span>
    </Link>
  );
}

export function StopWorkEmpty() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border border-gray-800 bg-gray-900/50 px-6 py-10 text-center">
      <p className="text-base text-gray-300">Nenhuma Paralisação Preventiva encontrada.</p>
      <Can permission="occurrence.create">
        <Link
          className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-400"
          href="/stop-work/new"
        >
          Registrar Paralisação
        </Link>
      </Can>
    </div>
  );
}
