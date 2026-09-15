"use client";

import Link from "next/link";
import type { DashboardActionItemAttentionItem } from "@safestop/types";

import { dashboardDeepLinks } from "./utils/dashboard-deep-links";
import { DashboardSectionError, DashboardSectionSkeleton } from "./dashboard-states";

type DashboardActionAttentionListProps = {
  title: string;
  count: number | null;
  items: DashboardActionItemAttentionItem[];
  viewAllHref: string;
  isLoading: boolean;
  isError: boolean;
  enabled: boolean;
  onRetry: () => void;
  emptyMessage: string;
};

function formatDueAt(value: string): string {
  return new Date(value).toLocaleString("pt-BR");
}

function daysUntilDue(value: string): number {
  const diffMs = new Date(value).getTime() - Date.now();
  return Math.ceil(diffMs / (24 * 60 * 60 * 1000));
}

export function DashboardActionAttentionList({
  title,
  count,
  items,
  viewAllHref,
  isLoading,
  isError,
  enabled,
  onRetry,
  emptyMessage,
}: DashboardActionAttentionListProps) {
  if (!enabled || count === null) {
    return null;
  }

  const visibleItems = items.slice(0, 5);

  return (
    <section aria-label={title} className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-foreground">
          {title}
          <span className="ml-2 text-sm font-normal text-muted-foreground">({count})</span>
        </h2>
        <Link className="text-sm text-primary hover:text-primary/80" href={viewAllHref}>
          Ver todas
        </Link>
      </div>

      {isLoading ? <DashboardSectionSkeleton rows={3} /> : null}

      {isError ? (
        <DashboardSectionError message="Não foi possível carregar esta lista." onRetry={onRetry} />
      ) : null}

      {!isLoading && !isError && visibleItems.length === 0 ? (
        <p className="text-sm text-muted-foreground" role="status">
          {emptyMessage}
        </p>
      ) : null}

      {!isLoading && !isError && visibleItems.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {visibleItems.map((item) => {
            const href = item.occurrenceId
              ? dashboardDeepLinks.stopWorkOccurrence(item.occurrenceId)
              : dashboardDeepLinks.actionItemsOverdue;
            const days = daysUntilDue(item.dueAt);

            return (
              <li key={item.id}>
                <Link
                  className="flex flex-col gap-1.5 rounded-lg border border-border bg-card/60 px-3.5 py-3 transition hover:border-border/80 hover:bg-accent/30"
                  href={href}
                >
                  <span className="font-medium text-foreground">{item.title}</span>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>Prazo: {formatDueAt(item.dueAt)}</span>
                    {days >= 0 && days <= 3 ? (
                      <span className="rounded-full border border-amber-600/40 bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-400">
                        Em {days} dia{days === 1 ? "" : "s"}
                      </span>
                    ) : null}
                    <span>{item.status}</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}
