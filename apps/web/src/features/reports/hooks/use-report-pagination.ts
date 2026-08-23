"use client";

import { useCallback, useMemo, useState } from "react";
import type { ReportCursor, ReportPagination } from "@safestop/types";
import { REPORT_PAGINATION_DEFAULT_LIMIT } from "@safestop/types";

export function useReportPagination() {
  const [cursorStack, setCursorStack] = useState<(ReportCursor | null)[]>([null]);
  const [pageIndex, setPageIndex] = useState(0);

  const currentCursor = cursorStack[pageIndex] ?? null;

  const pagination = useMemo<ReportPagination>(
    () => ({
      cursor: currentCursor,
      limit: REPORT_PAGINATION_DEFAULT_LIMIT,
    }),
    [currentCursor],
  );

  const resetPagination = useCallback(() => {
    setCursorStack([null]);
    setPageIndex(0);
  }, []);

  const goNext = useCallback(
    (nextCursor: ReportCursor | null) => {
      if (!nextCursor) {
        return;
      }

      setCursorStack((stack) => {
        const nextStack = stack.slice(0, pageIndex + 1);
        nextStack.push(nextCursor);
        return nextStack;
      });
      setPageIndex((index) => index + 1);
    },
    [pageIndex],
  );

  const goPrevious = useCallback(() => {
    setPageIndex((index) => Math.max(0, index - 1));
  }, []);

  const canGoPrevious = pageIndex > 0;

  return {
    pagination,
    pageIndex,
    canGoPrevious,
    resetPagination,
    goNext,
    goPrevious,
  };
}
