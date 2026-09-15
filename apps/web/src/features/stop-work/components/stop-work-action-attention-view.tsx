"use client";

import Link from "next/link";
import type { DashboardActionItemAttentionItem } from "@safestop/types";

import { dashboardDeepLinks } from "@/features/dashboard/components/utils/dashboard-deep-links";

type StopWorkActionAttentionViewProps = {
  title: string;
  items: DashboardActionItemAttentionItem[];
  emptyMessage: string;
};

function formatDueAt(value: string): string {
  return new Date(value).toLocaleString("pt-BR");
}

export function StopWorkActionAttentionView({
  title,
  items,
  emptyMessage,
}: StopWorkActionAttentionViewProps) {
  return (
    <section aria-label={title} className="flex flex-col gap-4">
      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-lg border border-border bg-card/60 px-6 py-10 text-center">
          <p className="text-base text-muted-foreground">{emptyMessage}</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((item) => {
            const href = item.occurrenceId
              ? dashboardDeepLinks.stopWorkOccurrence(item.occurrenceId)
              : dashboardDeepLinks.stopWorkActive;

            return (
              <li key={item.id}>
                <Link
                  className="flex flex-col gap-1 rounded-lg border border-border bg-card/60 p-4 transition-colors hover:border-primary/50 hover:bg-accent/40"
                  href={href}
                >
                  <span className="font-medium text-foreground">{item.title}</span>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    <span>Prazo: {formatDueAt(item.dueAt)}</span>
                    <span>{item.status}</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
