"use client";

type VerEAgirLoadingSkeletonProps = {
  label?: string;
};

export function VerEAgirLoadingSkeleton({ label = "Avaliação" }: VerEAgirLoadingSkeletonProps) {
  return (
    <section
      aria-busy="true"
      aria-label={`Carregando ${label}`}
      className="flex flex-col gap-4 rounded-lg border border-gray-800 bg-gray-900/40 p-4"
    >
      <div className="h-4 w-32 animate-pulse rounded bg-gray-800" />
      <div className="h-16 animate-pulse rounded-lg bg-gray-800/80" />
      <div className="h-11 animate-pulse rounded-md bg-gray-800" />
    </section>
  );
}

type EvaluationConflictCardProps = {
  isRefreshing: boolean;
  onRefresh: () => void;
};

export function EvaluationConflictCard({ isRefreshing, onRefresh }: EvaluationConflictCardProps) {
  return (
    <div
      className="flex flex-col gap-3 rounded-lg border border-amber-700/50 bg-amber-950/30 p-4"
      role="alert"
    >
      <div className="flex items-start gap-3">
        <span aria-hidden="true" className="text-lg text-amber-400">
          ⚠
        </span>
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium text-amber-100">Esta ocorrência já foi atualizada</p>
          <p className="text-sm text-amber-200/80">
            Atualize para ver o estado atual antes de continuar.
          </p>
        </div>
      </div>
      <button
        className="w-full rounded-md bg-amber-600 px-4 py-3 text-sm font-medium text-white hover:bg-amber-500 disabled:opacity-50 sm:w-auto sm:self-start"
        disabled={isRefreshing}
        type="button"
        onClick={onRefresh}
      >
        {isRefreshing ? "Atualizando…" : "Atualizar"}
      </button>
    </div>
  );
}

type AlreadyDecidedCardProps = {
  isRefreshing: boolean;
  onRefresh: () => void;
};

export function AlreadyDecidedCard({ isRefreshing, onRefresh }: AlreadyDecidedCardProps) {
  return (
    <div
      className="flex flex-col gap-3 rounded-lg border border-blue-700/40 bg-blue-950/20 p-4"
      role="status"
    >
      <p className="text-sm text-blue-100">Esta ocorrência já possui uma decisão registrada.</p>
      <button
        className="w-full rounded-md border border-blue-600 px-4 py-3 text-sm font-medium text-blue-100 hover:bg-blue-900/40 disabled:opacity-50 sm:w-auto sm:self-start"
        disabled={isRefreshing}
        type="button"
        onClick={onRefresh}
      >
        {isRefreshing ? "Atualizando…" : "Atualizar"}
      </button>
    </div>
  );
}

type OfflineNoticeProps = {
  message?: string;
};

export function OfflineNotice({
  message = "Você está offline. Conecte-se para continuar.",
}: OfflineNoticeProps) {
  return (
    <p className="text-sm text-gray-400" role="status">
      {message}
    </p>
  );
}
