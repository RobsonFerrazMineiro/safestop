"use client";

import Link from "next/link";

import { BarChart3, Bell, ListChecks, OctagonAlert } from "lucide-react";

import { SurfaceIcon } from "@/components/surface-icon";
import { PageHeader } from "@/components/page-header";
import { PageShell } from "@/components/page-shell";
import { useAuthorization } from "@/features/authorization";

import { REPORT_COPY } from "../utils/report-copy";
import { ReportForbiddenState } from "./report-states";

const REPORT_ENTRIES = [
  {
    href: "/reports/occurrences",
    title: REPORT_COPY.occurrences,
    description: "Paralisações e interdições com filtros gerenciais e exportação.",
    icon: OctagonAlert,
  },
  {
    href: "/reports/action-items",
    title: REPORT_COPY.actionItems,
    description: "Ações do plano de ação com prazos, vencidas e próximas do vencimento.",
    icon: ListChecks,
  },
  {
    href: "/reports/awareness",
    title: REPORT_COPY.awareness,
    description: "Confirmações de ciência e pendências por destinatário.",
    icon: Bell,
  },
] as const;

export function ReportsHubPage() {
  const { can, isReady, isLoading } = useAuthorization();

  if (isLoading || !isReady) {
    return (
      <PageShell width="wide">
        <PageHeader
          eyebrow="ANÁLISE GERENCIAL"
          icon={BarChart3}
          subtitle="Relatórios gerenciais para análise operacional e exportação."
          title={REPORT_COPY.hubTitle}
        />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="min-h-[10rem] animate-pulse rounded-lg border border-border bg-card/60"
            />
          ))}
        </div>
      </PageShell>
    );
  }

  if (!can("report.read")) {
    return <ReportForbiddenState />;
  }

  return (
    <PageShell data-testid="reports-hub" width="wide">
      <PageHeader
        eyebrow="ANÁLISE GERENCIAL"
        icon={BarChart3}
        subtitle="Relatórios gerenciais para análise operacional e exportação."
        title={REPORT_COPY.hubTitle}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {REPORT_ENTRIES.map((entry) => (
          <Link
            key={entry.href}
            className="flex min-h-[10rem] flex-col justify-between gap-4 rounded-lg border border-border bg-card/60 p-5 transition-colors hover:border-primary/50 hover:bg-accent/40"
            href={entry.href}
          >
            <div>
              <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                <SurfaceIcon className="text-muted-foreground" icon={entry.icon} variant="chart" />
                {entry.title}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">{entry.description}</p>
            </div>
            <span className="text-sm text-muted-foreground">Abrir relatório →</span>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
