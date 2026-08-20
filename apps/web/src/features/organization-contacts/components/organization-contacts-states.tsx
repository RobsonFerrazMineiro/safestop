"use client";

export function OrganizationContactsLoadingSkeleton() {
  return (
    <div className="flex flex-col gap-2" role="status">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="h-12 animate-pulse rounded-lg border border-gray-800 bg-gray-900"
        />
      ))}
    </div>
  );
}

export function OrganizationContactsEmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 py-10 text-center" role="status">
      <p className="text-sm text-gray-400">Nenhum responsável cadastrado.</p>
    </div>
  );
}

type OrganizationContactsErrorStateProps = {
  onRetry?: () => void;
};

export function OrganizationContactsErrorState({ onRetry }: OrganizationContactsErrorStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 py-6 text-center" role="alert">
      <p className="text-sm text-red-400">Não foi possível carregar os responsáveis.</p>
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

export function OrganizationContactsForbiddenState() {
  return (
    <main className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-semibold text-gray-100">Acesso negado</h1>
      <p className="max-w-md text-base text-gray-400">
        Você não possui permissão para gerenciar responsáveis nesta organização.
      </p>
    </main>
  );
}
