"use client";

import type { MdhoPendingApprovalItem } from "@safestop/types";

import { Button } from "@/components/ui/button";

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
        <Button
          className="self-center"
          disabled={isFetchingNextPage}
          type="button"
          variant="outline"
          onClick={() => {
            onLoadMore();
          }}
        >
          {isFetchingNextPage ? "Carregando…" : "Carregar mais"}
        </Button>
      ) : null}
    </div>
  );
}
