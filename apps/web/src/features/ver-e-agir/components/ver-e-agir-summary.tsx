import type { OccurrenceDecision } from "@safestop/types";

type VerEAgirSummaryProps = {
  decision: OccurrenceDecision;
};

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("pt-BR");
}

export function VerEAgirSummary({ decision }: VerEAgirSummaryProps) {
  return (
    <div className="flex flex-col gap-4">
      <span className="inline-flex w-fit rounded-full border border-amber-600/50 bg-amber-950/40 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-300">
        Ver e Agir
      </span>

      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
          Justificativa
        </span>
        <p className="whitespace-pre-wrap text-sm text-gray-100">{decision.decisionReason}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Decidido por
          </span>
          <span className="text-sm text-gray-100">{decision.decidedByName ?? "—"}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-wide text-gray-500">Em</span>
          <span className="text-sm text-gray-100">{formatDateTime(decision.decidedAt)}</span>
        </div>
      </div>

      <p className="text-sm text-gray-400">Aguardando correção</p>
    </div>
  );
}
