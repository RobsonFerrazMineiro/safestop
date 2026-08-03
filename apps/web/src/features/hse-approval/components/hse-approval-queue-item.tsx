import Link from "next/link";
import type { MdhoPendingApprovalItem } from "@safestop/types";

import { formatOccurrenceSeverity } from "@/features/occurrences/utils/format-labels";

type HseApprovalQueueItemProps = {
  item: MdhoPendingApprovalItem;
};

function formatSubmittedAt(value: string): string {
  return new Date(value).toLocaleString("pt-BR");
}

export function HseApprovalQueueItem({ item }: HseApprovalQueueItemProps) {
  const detailHref = `/stop-work/${item.occurrenceId}?section=mdho-review`;

  return (
    <Link
      className="flex flex-col gap-2 rounded-lg border border-amber-700/50 bg-gray-900 px-4 py-4 transition hover:border-amber-600/70"
      href={detailHref}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs text-orange-400">{item.publicCode}</span>
          <span className="rounded-full border border-amber-700/60 bg-amber-950/40 px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-amber-200">
            Pendente
          </span>
        </div>
        <span className="text-xs uppercase tracking-wide text-gray-500">
          {formatOccurrenceSeverity(item.criticality)}
        </span>
      </div>

      <span className="text-base font-semibold text-gray-100">{item.title}</span>

      <div className="flex flex-col gap-1 text-sm text-gray-400">
        {item.areaName ? <span>{item.areaName}</span> : null}
        {item.taskSummary ? <span className="line-clamp-2">{item.taskSummary}</span> : null}
        <span>
          Enviado por {item.submittedByName ?? "—"} · {formatSubmittedAt(item.submittedAt)}
        </span>
      </div>
    </Link>
  );
}

export function HseApprovalQueueEmpty() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border border-amber-800/40 bg-gray-900/50 px-6 py-10 text-center">
      <p className="text-base text-gray-300">Nenhuma avaliação aguardando sua aprovação.</p>
      <p className="max-w-md text-sm text-gray-400">
        Quando um Supervisor enviar um MDHO, ele aparecerá aqui.
      </p>
      <Link className="text-sm text-orange-400 hover:text-orange-300" href="/stop-work">
        Ver ocorrências
      </Link>
    </div>
  );
}

export function HseApprovalQueueForbidden() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="max-w-md text-base text-gray-300">
        Você não possui permissão para acessar a fila de aprovação HSE.
      </p>
      <Link className="text-sm text-orange-400 hover:text-orange-300" href="/">
        Voltar ao início
      </Link>
    </main>
  );
}

export function HseApprovalQueueLoading() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="h-28 animate-pulse rounded-lg border border-gray-800 bg-gray-900"
        />
      ))}
    </div>
  );
}
