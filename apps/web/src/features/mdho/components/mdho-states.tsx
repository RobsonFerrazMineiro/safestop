"use client";

type MdhoConflictCardProps = {
  isRefreshing: boolean;
  onRefresh: () => void;
};

export function MdhoConflictCard({ isRefreshing, onRefresh }: MdhoConflictCardProps) {
  return (
    <div
      className="flex flex-col gap-3 rounded-lg border border-amber-700/50 bg-amber-950/30 p-4"
      role="alert"
    >
      <p className="text-sm font-medium text-amber-100">
        Esta avaliação foi atualizada. Atualize para continuar.
      </p>
      <button
        className="w-full rounded-md bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50 sm:w-auto sm:self-start"
        disabled={isRefreshing}
        type="button"
        onClick={onRefresh}
      >
        {isRefreshing ? "Atualizando…" : "Atualizar"}
      </button>
    </div>
  );
}

type MdhoErrorStateProps = {
  message?: string;
  onRetry: () => void;
};

export function MdhoErrorState({
  message = "Não foi possível carregar a Avaliação Técnica (MDHO).",
  onRetry,
}: MdhoErrorStateProps) {
  return (
    <div
      className="flex flex-col items-start gap-2 rounded-lg border border-red-900/40 bg-red-950/20 p-4"
      role="alert"
    >
      <p className="text-sm text-red-300">{message}</p>
      <button
        className="text-sm text-orange-400 hover:text-orange-300"
        type="button"
        onClick={onRetry}
      >
        Tentar novamente
      </button>
    </div>
  );
}

type MdhoOfflineNoticeProps = {
  message?: string;
};

export function MdhoOfflineNotice({
  message = "Conecte-se para continuar a Avaliação Técnica (MDHO)",
}: MdhoOfflineNoticeProps) {
  return (
    <p className="text-sm text-gray-400" role="status">
      {message}
    </p>
  );
}

type MdhoReturnedBannerProps = {
  returnReason: string;
};

export function MdhoReturnedBanner({ returnReason }: MdhoReturnedBannerProps) {
  return (
    <div
      className="flex flex-col gap-2 rounded-lg border border-amber-700/40 bg-amber-950/20 p-4"
      role="status"
    >
      <p className="text-sm font-medium text-amber-100">MDHO devolvido — corrija e reenvie.</p>
      <p className="whitespace-pre-wrap text-sm text-amber-200/80">{returnReason}</p>
    </div>
  );
}

export function MdhoLoadingSkeleton() {
  return (
    <section
      aria-busy="true"
      aria-label="Carregando Avaliação Técnica MDHO"
      className="flex flex-col gap-4 rounded-lg border border-blue-800/40 bg-gray-900/40 p-4"
    >
      <div className="h-4 w-48 animate-pulse rounded bg-gray-800" />
      <div className="h-24 animate-pulse rounded-lg bg-gray-800/80" />
      <div className="h-11 animate-pulse rounded-md bg-gray-800" />
    </section>
  );
}

export function MdhoDraftSavedNotice() {
  return (
    <p className="text-sm text-green-400" role="status">
      Rascunho salvo
    </p>
  );
}
