export function TimelineLoading() {
  return (
    <div aria-busy="true" className="flex flex-col gap-3" role="status">
      <span className="sr-only">Carregando linha do tempo…</span>
      {Array.from({ length: 3 }).map((_, index) => (
        <div className="flex gap-3" key={index}>
          <div className="mt-1 h-3 w-3 shrink-0 animate-pulse rounded-full bg-gray-700" />
          <div className="flex flex-1 flex-col gap-2">
            <div className="h-4 w-40 animate-pulse rounded bg-gray-800" />
            <div className="h-3 w-56 animate-pulse rounded bg-gray-800/80" />
          </div>
        </div>
      ))}
    </div>
  );
}
