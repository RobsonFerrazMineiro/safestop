"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import type { DashboardScopeFilters } from "../types/scope-filters";
import {
  EMPTY_DASHBOARD_SCOPE_FILTERS,
  hasActiveDashboardScopeFilters,
} from "../types/scope-filters";
import { useDashboardScopeFilterOptions } from "../hooks/use-dashboard-scope-filter-options";

type DashboardScopeFiltersPanelProps = {
  filters: DashboardScopeFilters;
  onChange: (filters: DashboardScopeFilters) => void;
};

function formatContractLabel(name: string, contractNumber: string | null): string {
  return contractNumber ? `${name} (${contractNumber})` : name;
}

export function DashboardScopeFiltersPanel({ filters, onChange }: DashboardScopeFiltersPanelProps) {
  const [open, setOpen] = useState(false);
  const { areas, contracts, contractors, isLoading, isError } = useDashboardScopeFilterOptions();
  const active = hasActiveDashboardScopeFilters(filters);

  function clearFilters() {
    onChange(EMPTY_DASHBOARD_SCOPE_FILTERS);
  }

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <div className="flex flex-wrap items-center gap-2">
        <DialogTrigger asChild>
          <Button
            className={active ? "border-primary bg-primary/10 text-primary" : undefined}
            type="button"
            variant="outline"
          >
            Filtros locais{active ? " · ativos" : ""}
          </Button>
        </DialogTrigger>
        {active ? (
          <Button type="button" variant="ghost" onClick={clearFilters}>
            Limpar filtros
          </Button>
        ) : null}
      </div>

      <DialogContent className="sm:max-w-md" showCloseButton>
        <DialogHeader>
          <DialogTitle>Filtros locais</DialogTitle>
          <DialogDescription>
            Afetam KPIs de ocorrência, listas e distribuições no escopo selecionado.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? <p className="text-sm text-muted-foreground">Carregando opções…</p> : null}

        {isError ? (
          <p className="text-sm text-destructive" role="alert">
            Não foi possível carregar as opções de filtro.
          </p>
        ) : null}

        {!isLoading && !isError ? (
          <div className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-foreground">Área</span>
              <select
                className="h-9 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                value={filters.areaId ?? ""}
                onChange={(event) => {
                  onChange({
                    ...filters,
                    areaId: event.target.value.length > 0 ? event.target.value : null,
                  });
                }}
              >
                <option value="">Todas</option>
                {areas.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-foreground">Contrato</span>
              <select
                className="h-9 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                value={filters.contractId ?? ""}
                onChange={(event) => {
                  onChange({
                    ...filters,
                    contractId: event.target.value.length > 0 ? event.target.value : null,
                  });
                }}
              >
                <option value="">Todos</option>
                {contracts.map((contract) => (
                  <option key={contract.id} value={contract.id}>
                    {formatContractLabel(contract.name, contract.contractNumber)}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-foreground">Contratada</span>
              <select
                className="h-9 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                value={filters.contractorOrganizationId ?? ""}
                onChange={(event) => {
                  onChange({
                    ...filters,
                    contractorOrganizationId:
                      event.target.value.length > 0 ? event.target.value : null,
                  });
                }}
              >
                <option value="">Todas</option>
                {contractors.map((contractor) => (
                  <option key={contractor.id} value={contractor.id}>
                    {contractor.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ) : null}

        <DialogFooter>
          {active ? (
            <Button type="button" variant="outline" onClick={clearFilters}>
              Limpar filtros
            </Button>
          ) : null}
          <Button type="button" onClick={() => setOpen(false)}>
            Aplicar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
