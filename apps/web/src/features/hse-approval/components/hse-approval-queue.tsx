"use client";

import type { MdhoPendingApprovalItem } from "@safestop/types";

import { HseApprovalQueueEmpty, HseApprovalQueueItem } from "./hse-approval-queue-item";

type HseApprovalQueueProps = {
  items: MdhoPendingApprovalItem[];
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
};

export function HseApprovalQueue({
  items,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
}: HseApprovalQueueProps) {
  if (items.length === 0) {
    return <HseApprovalQueueEmpty />;
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => (
        <HseApprovalQueueItem key={item.assessmentId} item={item} />
      ))}

      {hasNextPage ? (
        <button
          className="rounded-lg border border-gray-700 px-4 py-2 text-sm font-medium text-gray-200 transition hover:border-gray-500 disabled:opacity-50"
          disabled={isFetchingNextPage}
          type="button"
          onClick={() => {
            onLoadMore();
          }}
        >
          {isFetchingNextPage ? "Carregando…" : "Carregar mais"}
        </button>
      ) : null}
    </div>
  );
}
