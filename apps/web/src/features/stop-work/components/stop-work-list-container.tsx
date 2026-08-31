"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { OctagonAlert, Plus, Search } from "lucide-react";
import { OperationalOccurrenceListRpcError } from "@safestop/types";

import { PageHeader } from "@/components/page-header";
import { Can, useRequirePermission } from "@/features/authorization";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { useStopWorkListView } from "../hooks/use-stop-work-list-view";
import {
  DASHBOARD_ATTENTION,
  parseStopWorkListViewParams,
  stopWorkListViewTitle,
} from "../utils/dashboard-list-params";
import {
  EMPTY_OPERATIONAL_FUNNEL,
  OPERATIONAL_LIST_SEARCH_DEBOUNCE_MS,
  OPERATIONAL_LIST_SEARCH_PLACEHOLDER,
  hasActiveOperationalDiscovery,
  toOperationalOccurrenceListFilters,
  type OperationalListFunnelState,
} from "../utils/operational-list-filters";
import { StopWorkActionAttentionView } from "./stop-work-action-attention-view";
import { StopWorkEmpty, StopWorkListItem } from "./stop-work-list-item";
import { StopWorkOperationalFiltersDialog } from "./stop-work-operational-filters-dialog";
import { StopWorkLoading } from "./stop-work-states";

export function StopWorkListContainer() {
  useRequirePermission("occurrence.read");

  const searchParams = useSearchParams();
  const viewParams = useMemo(() => parseStopWorkListViewParams(searchParams), [searchParams]);

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [funnel, setFunnel] = useState<OperationalListFunnelState>(EMPTY_OPERATIONAL_FUNNEL);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, OPERATIONAL_LIST_SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [searchInput]);

  const operationalUi = useMemo(
    () => ({ ...funnel, search: debouncedSearch }),
    [debouncedSearch, funnel],
  );
  const operationalFilters = useMemo(
    () => toOperationalOccurrenceListFilters(operationalUi),
    [operationalUi],
  );
  const hasDiscovery = hasActiveOperationalDiscovery(operationalUi);

  const {
    occurrences,
    attentionItems,
    isAttentionView,
    isStandardOperationalList,
    canViewAttention,
    hasNext,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    fetchNextPage,
    refetch,
  } = useStopWorkListView(viewParams, { operationalFilters });

  const pageTitle = stopWorkListViewTitle(viewParams);
  const hasDashboardFilter =
    viewParams.dashboardFilter !== null ||
    viewParams.dashboardScope !== null ||
    viewParams.dashboardAttention !== null;

  function clearSearchAndFunnel() {
    setSearchInput("");
    setDebouncedSearch("");
    setFunnel(EMPTY_OPERATIONAL_FUNNEL);
  }

  if (isAttentionView && !canViewAttention) {
    return (
      <main className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-2xl font-semibold text-foreground">Acesso negado</h1>
        <p className="max-w-md text-base text-muted-foreground">
          Você não possui permissão para visualizar ações do plano de ação.
        </p>
        <Link className="text-sm text-primary hover:underline" href="/">
          Voltar ao dashboard
        </Link>
      </main>
    );
  }

  if (isAttentionView && isLoading) {
    return <StopWorkLoading />;
  }

  if (isAttentionView && isError) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="max-w-md text-base text-destructive" role="alert">
          {error instanceof Error
            ? error.message
            : "Não foi possível carregar as Paralisações Preventivas."}
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

  const errorMessage =
    error instanceof OperationalOccurrenceListRpcError
      ? error.message
      : error instanceof Error
        ? error.message
        : "Não foi possível carregar as Paralisações Preventivas.";

  return (
    <section className="flex w-full flex-1 flex-col gap-6 px-6 py-10">
      <PageHeader
        actions={
          <Can permission="occurrence.create">
            <Button asChild>
              <Link href="/stop-work/new">
                <Plus />
                Nova Paralisação
              </Link>
            </Button>
          </Can>
        }
        backHref="/"
        backLabel="Voltar"
        icon={OctagonAlert}
        subtitle={
          isAttentionView
            ? "Ações abertas filtradas conforme o dashboard."
            : "Paralisações Preventivas da organização ativa."
        }
        title={pageTitle}
      />

      {isStandardOperationalList ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="Buscar Paralisações Preventivas"
              className="pl-9"
              placeholder={OPERATIONAL_LIST_SEARCH_PLACEHOLDER}
              value={searchInput}
              onChange={(event) => {
                setSearchInput(event.target.value);
              }}
            />
          </div>
          <StopWorkOperationalFiltersDialog funnel={funnel} onApply={setFunnel} />
        </div>
      ) : null}

      {isAttentionView ? (
        <>
          <p className="text-sm text-muted-foreground" role="status">
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
      ) : isLoading && occurrences.length === 0 ? (
        <p className="text-sm text-muted-foreground">Carregando Paralisações Preventivas…</p>
      ) : isError ? (
        <div className="flex flex-col items-start gap-3">
          <p className="text-sm text-destructive" role="alert">
            {errorMessage}
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
        </div>
      ) : occurrences.length === 0 ? (
        isStandardOperationalList && hasDiscovery ? (
          <div className="flex flex-col items-center gap-4 rounded-lg border border-border bg-card px-6 py-10 text-center">
            <p className="text-base text-foreground">
              Nenhuma Paralisação Preventiva encontrada para esta busca/filtros.
            </p>
            <Button type="button" variant="outline" onClick={clearSearchAndFunnel}>
              Limpar busca e filtros
            </Button>
          </div>
        ) : hasDashboardFilter ? (
          <div className="flex flex-col items-center gap-4 rounded-lg border border-border bg-card px-6 py-10 text-center">
            <p className="text-base text-foreground">
              Nenhuma Paralisação Preventiva neste filtro.
            </p>
            <Link className="text-sm text-primary hover:underline" href="/">
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
          {hasNext ? (
            <Button
              className="self-center"
              disabled={isFetchingNextPage}
              type="button"
              variant="outline"
              onClick={() => {
                fetchNextPage();
              }}
            >
              {isFetchingNextPage ? "Carregando…" : "Carregar mais"}
            </Button>
          ) : null}
        </div>
      )}
    </section>
  );
}
