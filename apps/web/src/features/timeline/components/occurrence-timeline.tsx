"use client";

import { useAuthorization } from "@/features/authorization";

import { useOccurrenceTimeline } from "../hooks/use-occurrence-timeline";
import { CommentComposer } from "./comments/comment-composer";
import { TimelineEmpty } from "./timeline-empty";
import { TimelineError } from "./timeline-error";
import { TimelineItem } from "./timeline-item";
import { TimelineLoadMore } from "./timeline-load-more";
import { TimelineLoading } from "./timeline-loading";

type OccurrenceTimelineProps = {
  occurrenceId: string;
  organizationId: string;
  occurrenceStatus: string;
};

export function OccurrenceTimeline({
  occurrenceId,
  organizationId,
  occurrenceStatus,
}: OccurrenceTimelineProps) {
  const { can } = useAuthorization();
  const {
    items,
    isLoading,
    isError,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
    refetch,
    isRefetching,
  } = useOccurrenceTimeline(occurrenceId, organizationId);

  const canRead = can("occurrence.read");

  if (!canRead) {
    return null;
  }

  return (
    <section className="flex flex-col gap-4 rounded-lg border border-gray-800 bg-gray-900/40 p-4">
      <header className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400">
          Linha do Tempo
        </h2>
        <button
          className="rounded-md border border-gray-700 px-3 py-1 text-xs text-gray-300 hover:bg-gray-800 disabled:opacity-50"
          disabled={isLoading || isRefetching}
          type="button"
          onClick={() => {
            void refetch();
          }}
        >
          Atualizar
        </button>
      </header>

      {isLoading ? (
        <TimelineLoading />
      ) : isError ? (
        <TimelineError
          onRetry={() => {
            void refetch();
          }}
        />
      ) : items.length === 0 ? (
        <TimelineEmpty />
      ) : (
        <ul className="flex flex-col gap-4" role="list">
          {items.map((item) => (
            <TimelineItem
              key={`${item.kind}-${item.id}`}
              item={item}
              occurrenceId={occurrenceId}
              occurrenceStatus={occurrenceStatus}
              organizationId={organizationId}
            />
          ))}
        </ul>
      )}

      {!isLoading && !isError ? (
        <TimelineLoadMore
          hasNextPage={hasNextPage}
          isError={isFetchNextPageError}
          isLoading={isFetchingNextPage}
          onLoadMore={() => {
            void fetchNextPage();
          }}
        />
      ) : null}

      <CommentComposer
        occurrenceId={occurrenceId}
        occurrenceStatus={occurrenceStatus}
        organizationId={organizationId}
      />
    </section>
  );
}
