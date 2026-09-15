"use client";

import Link from "next/link";
import type {
  DashboardRecentOccurrenceItem,
  OccurrenceSeverity,
  OccurrenceStatus,
} from "@safestop/types";

import {
  formatOccurrenceSeverity,
  formatOccurrenceStatus,
} from "@/features/occurrences/utils/format-labels";

import { formatRelativeNotificationTime } from "@/features/notifications/utils/format-labels";

import { dashboardDeepLinks } from "./utils/dashboard-deep-links";
import { DashboardSectionError, DashboardSectionSkeleton } from "./dashboard-states";

type DashboardRecentOccurrencesProps = {
  items: DashboardRecentOccurrenceItem[];
  isLoading: boolean;
  isError: boolean;
  enabled: boolean;
  onRetry: () => void;
};

export function DashboardRecentOccurrences({
  items,
  isLoading,
  isError,
  enabled,
  onRetry,
}: DashboardRecentOccurrencesProps) {
  if (!enabled) {
    return null;
  }

  return (
    <section aria-label="Ocorrências recentes" className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-foreground">Ocorrências recentes</h2>
        <Link
          className="text-sm text-primary hover:text-primary/80"
          href={dashboardDeepLinks.stopWorkActive}
        >
          Ver todas
        </Link>
      </div>

      {isLoading ? <DashboardSectionSkeleton rows={3} /> : null}

      {isError ? (
        <DashboardSectionError
          message="Não foi possível carregar ocorrências recentes."
          onRetry={onRetry}
        />
      ) : null}

      {!isLoading && !isError && items.length === 0 ? (
        <p className="text-sm text-muted-foreground" role="status">
          Nenhuma ocorrência recente.
        </p>
      ) : null}

      {!isLoading && !isError && items.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {items.map((item) => (
            <Link
              key={item.id}
              className="flex flex-col gap-2 rounded-lg border border-border bg-card/60 p-3.5 transition hover:border-border/80 hover:bg-accent/30 sm:p-4"
              href={dashboardDeepLinks.stopWorkOccurrence(item.id)}
            >
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="font-mono font-medium text-primary">{item.publicCode}</span>
                <span>{formatOccurrenceStatus(item.status as OccurrenceStatus)}</span>
                <span>{formatOccurrenceSeverity(item.severity as OccurrenceSeverity)}</span>
              </div>
              <h3 className="line-clamp-2 font-medium text-foreground">{item.title}</h3>
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                {item.areaName ? <span>{item.areaName}</span> : null}
                <time dateTime={item.createdAt}>
                  {formatRelativeNotificationTime(item.createdAt)}
                </time>
              </div>
            </Link>
          ))}
        </div>
      ) : null}
    </section>
  );
}
