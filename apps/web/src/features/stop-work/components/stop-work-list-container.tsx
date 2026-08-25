"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { Can, useRequirePermission } from "@/features/authorization";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { useStopWorkListView } from "../hooks/use-stop-work-list-view";
import {
  DASHBOARD_ATTENTION,
  parseStopWorkListViewParams,
  stopWorkListViewTitle,
} from "../utils/dashboard-list-params";
import { StopWorkActionAttentionView } from "./stop-work-action-attention-view";
import { StopWorkEmpty, StopWorkListItem } from "./stop-work-list-item";
import { StopWorkLoading } from "./stop-work-states";

export function StopWorkListContainer() {
  useRequirePermission("occurrence.read");

  const searchParams = useSearchParams();
  const [imsReferenceCodeInput, setImsReferenceCodeInput] = useState("");

  const viewParams = useMemo(() => {
    const parsed = parseStopWorkListViewParams(searchParams);

    if (parsed.imsReferenceCode) {
      return parsed;
    }

    const trimmed = imsReferenceCodeInput.trim();

    if (trimmed.length > 0) {
      return { ...parsed, imsReferenceCode: trimmed };
    }

    return parsed;
  }, [imsReferenceCodeInput, searchParams]);

  const {
    occurrences,
    attentionItems,
    isAttentionView,
    canViewAttention,
    isLoading,
    isError,
    error,
    refetch,
  } = useStopWorkListView(viewParams);

  const pageTitle = stopWorkListViewTitle(viewParams);
  const isImsSearch = viewParams.imsReferenceCode !== null;
  const hasDashboardFilter =
    viewParams.dashboardFilter !== null ||
    viewParams.dashboardScope !== null ||
    viewParams.dashboardAttention !== null;

  if (isAttentionView && !canViewAttention) {
    return (
      <main className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-2xl font-semibold text-gray-100">Acesso negado</h1>
        <p className="max-w-md text-base text-gray-400">
          Você não possui permissão para visualizar ações do plano de ação.
        </p>
        <Link className="text-sm text-orange-400 hover:text-orange-300" href="/">
          Voltar ao dashboard
        </Link>
      </main>
    );
  }

  if (isLoading) {
    return <StopWorkLoading />;
  }

  if (isError) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="max-w-md text-base text-red-200" role="alert">
          {error instanceof Error ? error.message : "Não foi possível carregar as ocorrências."}
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            void refetch();
          }}
        >
          Tentar novamente
        </Button>
      </main>
    );
  }

  const attentionEmptyMessage =
    viewParams.dashboardAttention === DASHBOARD_ATTENTION.overdue
      ? "Nenhuma ação vencida."
      : "Nenhuma ação próxima do vencimento.";

  return (
    <section className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-10">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2">
          <Link className="text-sm text-orange-400 hover:text-orange-300" href="/">
            ← Voltar
          </Link>
          <h1 className="text-3xl font-bold text-gray-100">{pageTitle}</h1>
          <p className="text-sm text-gray-400">
            {isAttentionView
              ? "Ações abertas filtradas conforme o dashboard."
              : "Ocorrências operacionais da organização ativa."}
          </p>
        </div>
        <Can permission="occurrence.create">
          <Button asChild>
            <Link href="/stop-work/new">Nova Paralisação</Link>
          </Button>
        </Can>
      </header>

      {!isAttentionView ? (
        <label className="flex max-w-md flex-col gap-2">
          <span className="text-sm font-medium text-gray-200">Código IMS</span>
          <Input
            className="font-mono"
            placeholder="BAA-26-0001"
            value={imsReferenceCodeInput}
            onChange={(event) => {
              setImsReferenceCodeInput(event.target.value);
            }}
          />
        </label>
      ) : null}

      {isAttentionView ? (
        <>
          <p className="text-sm text-gray-400" role="status">
            {attentionItems.length}{" "}
            {attentionItems.length === 1 ? "ação listada" : "ações listadas"} — mesma regra do card
            do dashboard.
          </p>
          <StopWorkActionAttentionView
            emptyMessage={attentionEmptyMessage}
            items={attentionItems}
            title={pageTitle}
          />
        </>
      ) : occurrences.length === 0 ? (
        isImsSearch ? (
          <div className="flex flex-col items-center gap-4 rounded-lg border border-gray-800 bg-gray-900/50 px-6 py-10 text-center">
            <p className="text-base text-gray-300">Nenhuma ocorrência com este código IMS.</p>
          </div>
        ) : hasDashboardFilter ? (
          <div className="flex flex-col items-center gap-4 rounded-lg border border-gray-800 bg-gray-900/50 px-6 py-10 text-center">
            <p className="text-base text-gray-300">Nenhuma ocorrência neste filtro.</p>
            <Link className="text-sm text-orange-400 hover:text-orange-300" href="/">
              Voltar ao dashboard
            </Link>
          </div>
        ) : (
          <StopWorkEmpty />
        )
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
