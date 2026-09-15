import Link from "next/link";
import { ClipboardCheck } from "lucide-react";
import type { MdhoPendingApprovalItem } from "@safestop/types";

import { StatusBadge } from "@/components/status-badge";
import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { SurfaceIcon } from "@/components/surface-icon";

import { mdhoReviewHref } from "../utils/mdho-review-href";

type HseApprovalQueueItemProps = {
  item: MdhoPendingApprovalItem;
};

function formatSubmittedAt(value: string): string {
  return new Date(value).toLocaleString("pt-BR");
}

export function HseApprovalQueueItem({ item }: HseApprovalQueueItemProps) {
  const detailHref = mdhoReviewHref(item.occurrenceId);

  return (
    <Link
      className="flex flex-col gap-2 rounded-lg border border-border bg-card/60 p-4 transition-colors hover:border-primary/50 hover:bg-accent/40"
      href={detailHref}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs font-bold tracking-wide text-primary">
            {item.publicCode}
          </span>
          <span className="rounded-full border border-status-warning-border bg-status-warning-bg px-2 py-0.5 text-xs font-medium tracking-wide text-status-warning-fg uppercase">
            Pendente
          </span>
          <StatusBadge severity={item.criticality} />
        </div>
      </div>

      <span className="text-base font-semibold text-foreground">{item.title}</span>

      <div className="flex flex-col gap-1 text-sm text-muted-foreground">
        {item.areaName ? <span>{item.areaName}</span> : null}
        {item.taskSummary ? <span className="line-clamp-2">{item.taskSummary}</span> : null}
        <span>
          Enviado por {item.submittedByName ?? "—"} · {formatSubmittedAt(item.submittedAt)}
        </span>
      </div>
    </Link>
  );
}

export function HseApprovalQueueEmpty() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border border-border bg-card/60 px-6 py-10 text-center">
      <SurfaceIcon className="text-muted-foreground" icon={ClipboardCheck} variant="empty" />
      <p className="text-base text-foreground">Nenhuma avaliação aguardando sua aprovação.</p>
      <p className="max-w-md text-sm text-muted-foreground">
        Quando um Supervisor enviar um MDHO, ele aparecerá aqui.
      </p>
      <Button asChild variant="link">
        <Link href="/stop-work">Ver Paralisações Preventivas</Link>
      </Button>
    </div>
  );
}

export function HseApprovalQueueForbidden() {
  return (
    <PageShell className="gap-6" width="wide">
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
        <p className="max-w-md text-base text-foreground">
          Você não possui permissão para acessar a fila de aprovação HSE.
        </p>
        <Button asChild variant="link">
          <Link href="/">Voltar ao início</Link>
        </Button>
      </div>
    </PageShell>
  );
}

export function HseApprovalQueueLoading() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="h-28 animate-pulse rounded-lg border border-border bg-card/60"
        />
      ))}
    </div>
  );
}
