"use client";

export function ActionPlanLoadingSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <div className="h-24 animate-pulse rounded-lg border border-border bg-card/40" />
      <div className="h-32 animate-pulse rounded-lg border border-border bg-card/40" />
    </div>
  );
}

export function ActionPlanOfflineNotice() {
  return (
    <p className="text-sm text-muted-foreground" role="status">
      Sem conexão. Reconecte para alterar o Plano de Ação.
    </p>
  );
}

type ActionPlanConflictCardProps = {
  isRefreshing: boolean;
  onRefresh: () => void;
};

export function ActionPlanConflictCard({ isRefreshing, onRefresh }: ActionPlanConflictCardProps) {
  return (
    <div
      className="flex flex-col gap-3 rounded-lg border border-amber-700/50 bg-amber-950/30 p-4"
      role="alert"
    >
      <p className="text-sm font-medium text-amber-100">
        O estado da ação mudou. Atualize e tente novamente.
      </p>
      <button
        className="w-full rounded-md bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 sm:w-auto sm:self-start"
        disabled={isRefreshing}
        type="button"
        onClick={onRefresh}
      >
        {isRefreshing ? "Atualizando…" : "Atualizar"}
      </button>
    </div>
  );
}

export function ActionPlanWaitingBanner() {
  return (
    <div
      className="flex items-center gap-3 rounded-lg border border-blue-700/50 bg-blue-950/30 px-4 py-3 text-blue-100"
      role="status"
    >
      <span aria-hidden="true" className="text-lg text-blue-400">
        ℹ
      </span>
      <p className="text-sm font-medium">Aguardando Plano de Ação</p>
    </div>
  );
}

export function ActionPlanCompletedBanner() {
  return (
    <p className="text-sm text-muted-foreground" role="status">
      Plano concluído — validação da ocorrência em versão futura
    </p>
  );
}
