"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import { useRequirePermission } from "@/features/authorization";

import { useOccurrence } from "../hooks/use-occurrences";
import { formatOccurrenceSeverity, formatOccurrenceStatus } from "../utils/format-labels";
import { OccurrenceError } from "./occurrence-error";
import { OccurrenceLoading } from "./occurrence-loading";

function formatDateTime(value: string | null): string {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleString("pt-BR");
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-medium text-gray-400">{label}</span>
      <span className="text-base text-gray-100">{value}</span>
    </div>
  );
}

export function OccurrenceDetailPage() {
  useRequirePermission("occurrence.read");

  const params = useParams<{ id: string }>();
  const occurrenceId = params.id;
  const { occurrence, isLoading, isError, error, isNotFound } = useOccurrence(occurrenceId);

  if (isLoading) {
    return <OccurrenceLoading message="Carregando ocorrência..." />;
  }

  if (isError) {
    return <OccurrenceError message={error instanceof Error ? error.message : undefined} />;
  }

  if (isNotFound || !occurrence) {
    return (
      <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-4 px-6 py-10">
        <Link className="text-sm text-orange-400 hover:text-orange-300" href="/occurrences">
          ← Voltar para ocorrências
        </Link>
        <p className="text-base text-gray-300">Ocorrência não encontrada ou sem acesso.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-6 py-10">
      <header className="flex flex-col gap-2">
        <Link className="text-sm text-orange-400 hover:text-orange-300" href="/occurrences">
          ← Voltar para ocorrências
        </Link>
        <span className="font-mono text-sm text-orange-400">{occurrence.publicCode}</span>
        <h1 className="text-3xl font-bold text-gray-100">{occurrence.title}</h1>
        <p className="text-sm text-gray-400">
          {formatOccurrenceStatus(occurrence.status)} ·{" "}
          {formatOccurrenceSeverity(occurrence.severity)}
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <DetailField label="Área" value={occurrence.areaName ?? "—"} />
        <DetailField label="Registrado por" value={occurrence.createdByName ?? "—"} />
        <DetailField label="Ocorrido em" value={formatDateTime(occurrence.occurredAt)} />
        <DetailField label="Registrado em" value={formatDateTime(occurrence.createdAt)} />
      </div>

      <div className="flex flex-col gap-4 rounded-lg border border-gray-800 bg-gray-900/50 p-4">
        <DetailField label="Atividade" value={occurrence.taskDescription} />
        <DetailField label="Local" value={occurrence.locationDescription} />
        <DetailField label="Condição insegura" value={occurrence.conditionDescription} />
        {occurrence.immediateActionDescription ? (
          <DetailField label="Ação imediata" value={occurrence.immediateActionDescription} />
        ) : null}
      </div>
    </main>
  );
}
