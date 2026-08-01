"use client";

import Link from "next/link";

import { Can, useRequirePermission } from "@/features/authorization";

import { usePreventiveStops } from "../hooks/use-stop-work";
import { StopWorkEmpty, StopWorkListItem } from "./stop-work-list-item";
import { StopWorkLoading } from "./stop-work-states";

export function StopWorkListContainer() {
  useRequirePermission("occurrence.read");

  const { occurrences, isLoading, isError, error, refetch } = usePreventiveStops();

  if (isLoading) {
    return <StopWorkLoading />;
  }

  if (isError) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="max-w-md text-base text-red-200" role="alert">
          {error instanceof Error ? error.message : "Não foi possível carregar as ocorrências."}
        </p>
        <button
          className="rounded-lg border border-gray-700 px-4 py-2 text-sm font-medium text-gray-200 transition hover:border-gray-500"
          onClick={() => {
            void refetch();
          }}
          type="button"
        >
          Tentar novamente
        </button>
      </main>
    );
  }

  return (
    <section className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-10">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2">
          <Link className="text-sm text-orange-400 hover:text-orange-300" href="/">
            ← Voltar
          </Link>
          <h1 className="text-3xl font-bold text-gray-100">Paralisação Preventiva</h1>
          <p className="text-sm text-gray-400">
            Ocorrências em status Paralisação Preventiva da organização ativa.
          </p>
        </div>
        <Can permission="occurrence.create">
          <Link
            className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-400"
            href="/stop-work/new"
          >
            Nova Paralisação
          </Link>
        </Can>
      </header>

      {occurrences.length === 0 ? (
        <StopWorkEmpty />
      ) : (
        <div className="flex flex-col gap-3">
          {occurrences.map((item) => (
            <StopWorkListItem item={item} key={item.id} />
          ))}
        </div>
      )}
    </section>
  );
}
