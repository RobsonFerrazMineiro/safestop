"use client";

type ImsConflictCardProps = {
  isRefreshing: boolean;
  onRefresh: () => void;
};

export function ImsConflictCard({ isRefreshing, onRefresh }: ImsConflictCardProps) {
  return (
    <div
      className="flex flex-col gap-3 rounded-lg border border-amber-700/50 bg-amber-950/30 p-4"
      role="alert"
    >
      <p className="text-sm font-medium text-amber-100">
        Esta ocorrência foi atualizada. Atualize para continuar.
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

export function ImsOfflineNotice() {
  return (
    <p className="text-sm text-gray-400" role="status">
      Sem conexão — ação não enviada
    </p>
  );
}
