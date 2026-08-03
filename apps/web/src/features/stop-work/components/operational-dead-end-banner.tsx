import type { OccurrenceStatus } from "@safestop/types";

type OperationalDeadEndBannerProps = {
  status: OccurrenceStatus;
  className?: string;
};

const DEAD_END_MESSAGES: Partial<Record<OccurrenceStatus, string>> = {
  VER_E_AGIR: "Aguardando validação e liberação — em versão futura",
  EM_TRATATIVA: "Em tratativa — Plano de Ação em versão futura",
};

export function OperationalDeadEndBanner({ status, className }: OperationalDeadEndBannerProps) {
  const message = DEAD_END_MESSAGES[status];

  if (!message) {
    return null;
  }

  return (
    <div
      className={`flex items-center gap-3 rounded-lg border border-blue-700/50 bg-blue-950/30 px-4 py-3 text-blue-100 ${className ?? ""}`}
      role="status"
    >
      <span aria-hidden="true" className="text-lg text-blue-400">
        ℹ
      </span>
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}
