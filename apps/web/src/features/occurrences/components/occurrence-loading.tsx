export function OccurrenceLoading({ message = "Carregando ocorrências..." }: { message?: string }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-base text-gray-400">{message}</p>
    </main>
  );
}
