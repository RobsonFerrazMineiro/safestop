type OccurrenceErrorProps = {
  message?: string;
};

export function OccurrenceError({
  message = "Não foi possível carregar as ocorrências. Tente novamente mais tarde.",
}: OccurrenceErrorProps) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="max-w-md text-base text-red-200" role="alert">
        {message}
      </p>
    </main>
  );
}
