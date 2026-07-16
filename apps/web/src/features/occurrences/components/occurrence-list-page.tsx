"use client";

import Link from "next/link";

import { Can, useRequirePermission } from "@/features/authorization";

import { useOccurrences } from "../hooks/use-occurrences";
import { OccurrenceEmpty } from "./occurrence-empty";
import { OccurrenceError } from "./occurrence-error";
import { OccurrenceListItem } from "./occurrence-list-item";
import { OccurrenceLoading } from "./occurrence-loading";

export function OccurrenceListPage() {
  useRequirePermission("occurrence.read");

  const { occurrences, isLoading, isError, error } = useOccurrences();

  if (isLoading) {
    return <OccurrenceLoading />;
  }

  if (isError) {
    return <OccurrenceError message={error instanceof Error ? error.message : undefined} />;
  }

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-10">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2">
          <Link className="text-sm text-orange-400 hover:text-orange-300" href="/">
            ← Voltar
          </Link>
          <h1 className="text-3xl font-bold text-gray-100">Ocorrências</h1>
          <p className="text-sm text-gray-400">
            Paralisações Preventivas e Interdições da organização ativa.
          </p>
        </div>
        <Can permission="occurrence.create">
          <Link
            className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-400"
            href="/occurrences/new"
          >
            Nova ocorrência
          </Link>
        </Can>
      </header>

      {occurrences.length === 0 ? (
        <OccurrenceEmpty />
      ) : (
        <div className="flex flex-col gap-3">
          {occurrences.map((occurrence) => (
            <OccurrenceListItem key={occurrence.id} occurrence={occurrence} />
          ))}
        </div>
      )}
    </section>
  );
}
