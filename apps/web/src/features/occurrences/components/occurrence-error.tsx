type OccurrenceErrorProps = {
  message?: string;
  onRetry?: () => void;
};

export function OccurrenceError({
  message = "Não foi possível carregar as ocorrências. Tente novamente mais tarde.",
  onRetry,
}: OccurrenceErrorProps) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="max-w-md text-base text-red-200" role="alert">
        {message}
      </p>
      {onRetry ? (
        <button
          className="rounded-lg border border-gray-700 px-4 py-2 text-sm font-medium text-gray-200 transition hover:border-gray-500"
          type="button"
          onClick={onRetry}
        >
          Tentar novamente
        </button>
      ) : null}
    </main>
  );
}
