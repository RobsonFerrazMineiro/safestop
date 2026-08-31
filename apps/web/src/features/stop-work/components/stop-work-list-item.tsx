import Link from "next/link";
import { OctagonAlert, Plus } from "lucide-react";
import type { OccurrenceSummary } from "@safestop/types";

import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { SurfaceIcon } from "@/components/surface-icon";
import { Can } from "@/features/authorization";

type StopWorkListItemProps = {
  item: OccurrenceSummary;
};

function formatDate(value: string): string {
  return new Date(value).toLocaleString("pt-BR");
}

export function StopWorkListItem({ item }: StopWorkListItemProps) {
  return (
    <Link
      className="grid gap-2 rounded-lg border border-border bg-card px-4 py-4 transition hover:border-primary/50 sm:grid-cols-[minmax(0,1fr)_auto]"
      href={`/stop-work/${item.id}`}
    >
      <div className="flex min-w-0 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs text-primary">{item.publicCode}</span>
          <StatusBadge status={item.status} />
          <StatusBadge severity={item.severity} />
        </div>
        <span className="truncate text-base font-semibold text-foreground">{item.title}</span>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
          {item.areaName ? <span>{item.areaName}</span> : null}
          {item.contractorOrganizationName ? <span>{item.contractorOrganizationName}</span> : null}
          {item.createdByName ? <span>{item.createdByName}</span> : null}
        </div>
      </div>
      <span className="self-start text-xs text-muted-foreground sm:self-center">
        {formatDate(item.createdAt)}
      </span>
    </Link>
  );
}

export function StopWorkEmpty() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border border-border bg-card px-6 py-10 text-center">
      <SurfaceIcon className="text-muted-foreground" icon={OctagonAlert} variant="empty" />
      <p className="text-base text-foreground">Nenhuma Paralisação Preventiva encontrada.</p>
      <Can permission="occurrence.create">
        <Button asChild>
          <Link href="/stop-work/new">
            <Plus />
            Nova Paralisação
          </Link>
        </Button>
      </Can>
    </div>
  );
}
