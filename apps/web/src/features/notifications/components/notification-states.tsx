"use client";

export function NotificationLoadingSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-3" role="status">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="h-20 animate-pulse rounded-lg border border-gray-800 bg-gray-900"
        />
      ))}
    </div>
  );
}

export function NotificationEmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 py-10 text-center" role="status">
      <span aria-hidden="true" className="text-3xl text-gray-500">
        🔔
      </span>
      <p className="text-sm text-gray-400">Nenhuma notificação.</p>
    </div>
  );
}

export function NotificationOfflineNotice() {
  return (
    <p className="text-sm text-gray-400" role="status">
      Sem conexão. Reconecte para atualizar ou confirmar ciência.
    </p>
  );
}

type NotificationErrorStateProps = {
  message?: string;
  onRetry?: () => void;
};

export function NotificationErrorState({ message, onRetry }: NotificationErrorStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 py-6 text-center" role="alert">
      <p className="text-sm text-red-400">
        {message ?? "Não foi possível carregar as notificações."}
      </p>
      {onRetry ? (
        <button
          className="rounded-md border border-gray-700 px-4 py-2 text-sm text-gray-200 hover:bg-gray-800"
          type="button"
          onClick={onRetry}
        >
          Tentar novamente
        </button>
      ) : null}
    </div>
  );
}

export function NotificationForbiddenState() {
  return (
    <main className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-semibold text-gray-100">Acesso negado</h1>
      <p className="max-w-md text-base text-gray-400">
        Você não possui permissão para acessar notificações nesta organização.
      </p>
    </main>
  );
}
