"use client";

import Link from "next/link";

import { useAuthorization } from "@/features/authorization";

import { REPORT_COPY } from "../utils/report-copy";
import { ReportForbiddenState } from "./report-states";

const REPORT_ENTRIES = [
  {
    href: "/reports/occurrences",
    title: REPORT_COPY.occurrences,
    description: "Paralisações e interdições com filtros gerenciais e exportação.",
  },
  {
    href: "/reports/action-items",
    title: REPORT_COPY.actionItems,
    description: "Ações do plano de ação com prazos, vencidas e próximas do vencimento.",
  },
  {
    href: "/reports/awareness",
    title: REPORT_COPY.awareness,
    description: "Confirmações de ciência e pendências por destinatário.",
  },
] as const;

export function ReportsHubPage() {
  const { can, isReady, isLoading } = useAuthorization();

  if (isLoading || !isReady) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="h-10 w-48 animate-pulse rounded-lg bg-gray-900/40" />
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="min-h-[10rem] animate-pulse rounded-lg border border-gray-800 bg-gray-900/40"
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
    <main className="mx-auto max-w-6xl px-6 py-8" data-testid="reports-hub">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-100">{REPORT_COPY.hubTitle}</h1>
        <p className="mt-1 text-sm text-gray-400">
          Relatórios gerenciais para análise operacional e exportação.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {REPORT_ENTRIES.map((entry) => (
          <Link
            key={entry.href}
            className="flex min-h-[10rem] flex-col justify-between rounded-lg border border-gray-800 bg-gray-900/40 p-5 transition hover:border-gray-600"
            href={entry.href}
          >
            <div>
              <h2 className="text-lg font-semibold text-orange-400">{entry.title}</h2>
              <p className="mt-2 text-sm text-gray-400">{entry.description}</p>
            </div>
            <span className="text-sm text-gray-300">Abrir relatório →</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
