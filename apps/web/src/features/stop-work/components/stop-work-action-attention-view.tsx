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
        <div className="flex flex-col items-center gap-4 rounded-lg border border-gray-800 bg-gray-900/50 px-6 py-10 text-center">
          <p className="text-base text-gray-300">{emptyMessage}</p>
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
                  className="flex flex-col gap-1 rounded-lg border border-gray-800 bg-gray-900 px-4 py-4 transition hover:border-gray-600"
                  href={href}
                >
                  <span className="font-medium text-gray-100">{item.title}</span>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-gray-400">
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
