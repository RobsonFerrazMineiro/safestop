import type { OccurrenceStatusHistoryItem } from "@/features/occurrences";

import { formatOccurrenceStatus } from "@/features/occurrences/utils/format-labels";

type StopWorkTimelineProps = {
  entries: OccurrenceStatusHistoryItem[];
};

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("pt-BR");
}

function formatTimelineMessage(entry: OccurrenceStatusHistoryItem): string {
  if (entry.fromStatus === null && entry.toStatus === "PARALISACAO_PREVENTIVA") {
    return "Paralisação Preventiva registrada";
  }

  return formatOccurrenceStatus(entry.toStatus);
}

export function StopWorkTimeline({ entries }: StopWorkTimelineProps) {
  if (entries.length === 0) {
    return <p className="text-sm text-gray-500">Nenhum evento de histórico disponível.</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {entries.map((entry) => (
        <li className="flex flex-col gap-1 border-l-2 border-orange-500/60 pl-4" key={entry.id}>
          <span className="text-sm font-medium text-gray-100">{formatTimelineMessage(entry)}</span>
          <span className="text-xs text-gray-500">
            {entry.changedByName ?? "Usuário"} · {formatDateTime(entry.changedAt)}
          </span>
        </li>
      ))}
    </ul>
  );
}
