"use client";

import Link from "next/link";

import { BarChart3, Bell, ListChecks, OctagonAlert } from "lucide-react";

import { SurfaceIcon } from "@/components/surface-icon";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { useAuthorization } from "@/features/authorization";

import { REPORT_COPY } from "../utils/report-copy";
import { ReportForbiddenState } from "./report-states";

const REPORTS_SHELL_CLASS = "flex w-full flex-1 flex-col gap-6 px-6 py-10";

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
      <main className={REPORTS_SHELL_CLASS}>
        <PageHeader
          subtitle="Relatórios gerenciais para análise operacional e exportação."
          title={REPORT_COPY.hubTitle}
          icon={BarChart3}
        />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="min-h-[10rem] animate-pulse rounded-lg border border-border bg-card"
            />
          ))}
        </div>
      </main>
    );
  }

  if (!can("report.read")) {
    return <ReportForbiddenState />;
  }

  return (
    <main className={REPORTS_SHELL_CLASS} data-testid="reports-hub">
      <PageHeader
        icon={BarChart3}
        subtitle="Relatórios gerenciais para análise operacional e exportação."
        title={REPORT_COPY.hubTitle}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {REPORT_ENTRIES.map((entry) => (
          <Link key={entry.href} className="block" href={entry.href}>
            <Card className="flex min-h-[10rem] flex-col justify-between gap-0 py-0 transition hover:border-primary/50">
              <div className="flex min-h-[10rem] flex-col justify-between p-5">
                <div>
                  <h2 className="flex items-center gap-2 text-lg font-semibold text-primary">
                    <SurfaceIcon
                      className="text-muted-foreground"
                      icon={entry.icon}
                      variant="chart"
                    />
                    {entry.title}
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">{entry.description}</p>
                </div>
                <span className="text-sm text-muted-foreground">Abrir relatório →</span>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}
