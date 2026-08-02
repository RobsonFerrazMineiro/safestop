type TimelineErrorProps = {
  onRetry: () => void;
};

export function TimelineError({ onRetry }: TimelineErrorProps) {
  return (
    <div className="flex flex-col gap-2 text-sm text-gray-400">
      <p>Não foi possível carregar a linha do tempo.</p>
      <p className="text-xs text-gray-500">Verifique sua conexão e tente novamente.</p>
      <button
        className="w-fit rounded-md border border-gray-700 px-3 py-1.5 text-xs text-gray-200 hover:bg-gray-800"
        type="button"
        onClick={onRetry}
      >
        Tentar novamente
      </button>
    </div>
  );
}
