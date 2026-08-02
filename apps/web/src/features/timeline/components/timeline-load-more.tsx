type TimelineLoadMoreProps = {
  hasNextPage: boolean;
  isLoading: boolean;
  isError: boolean;
  onLoadMore: () => void;
};

export function TimelineLoadMore({
  hasNextPage,
  isLoading,
  isError,
  onLoadMore,
}: TimelineLoadMoreProps) {
  if (!hasNextPage) {
    return null;
  }

  return (
    <div className="flex flex-col items-center gap-2">
      {isError ? (
        <p className="text-xs text-red-300">Não foi possível carregar mais eventos.</p>
      ) : null}
      <button
        className="rounded-md border border-gray-700 px-4 py-2 text-sm text-gray-200 hover:bg-gray-800 disabled:opacity-50"
        disabled={isLoading}
        type="button"
        onClick={onLoadMore}
      >
        {isLoading ? "Carregando..." : "Carregar mais"}
      </button>
    </div>
  );
}
