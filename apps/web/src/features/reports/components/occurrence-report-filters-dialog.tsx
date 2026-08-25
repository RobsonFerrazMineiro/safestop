"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  formatOccurrenceSeverity,
  formatOccurrenceStatus,
} from "@/features/occurrences/utils/format-labels";
import { cn } from "@/lib/utils";

import { useReportScopeFilterOptions } from "../hooks/use-report-scope-filter-options";
import { REPORT_COPY } from "../utils/report-copy";
import type { OccurrenceReportViewState } from "../utils/occurrence-report-url";
import {
  OCCURRENCE_SEVERITY_OPTIONS,
  OCCURRENCE_STATUS_OPTIONS,
} from "../utils/occurrence-report-url";

type OccurrenceReportFiltersDialogProps = {
  filters: OccurrenceReportViewState;
  activeFilterCount: number;
  onApply: (filters: OccurrenceReportViewState) => void;
};

function formatContractLabel(name: string, contractNumber: string | null): string {
  return contractNumber ? `${name} (${contractNumber})` : name;
}

function toggleArrayValue<T extends string>(values: T[], value: T): T[] {
  return values.includes(value) ? values.filter((entry) => entry !== value) : [...values, value];
}

export function OccurrenceReportFiltersDialog({
  filters,
  activeFilterCount,
  onApply,
}: OccurrenceReportFiltersDialogProps) {
  const [open, setOpen] = useState(false);
  const { areas, contracts, contractors, isLoading, isError } = useReportScopeFilterOptions();

  function update(partial: Partial<OccurrenceReportViewState>) {
    onApply({ ...filters, ...partial });
  }

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <Button
          className={cn(
            "rounded-full",
            activeFilterCount > 0 ? "border-primary bg-primary/10 text-primary" : "",
          )}
          type="button"
          variant="outline"
        >
          {REPORT_COPY.filters}
          {activeFilterCount > 0 ? ` · ${activeFilterCount}` : ""}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{REPORT_COPY.filters}</DialogTitle>
          <DialogDescription>Escopo, status e criticidade do relatório.</DialogDescription>
        </DialogHeader>

        {isLoading ? <p className="text-sm text-muted-foreground">Carregando opções…</p> : null}
        {isError ? (
          <p className="text-sm text-destructive">Não foi possível carregar as opções de filtro.</p>
        ) : null}

        <div className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">Área</span>
          <Select
            onValueChange={(value) => {
              update({ areaId: value === "all" ? null : value });
            }}
            value={filters.areaId ?? "all"}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {areas.map((area) => (
                <SelectItem key={area.id} value={area.id}>
                  {area.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">Contrato</span>
          <Select
            onValueChange={(value) => {
              update({ contractId: value === "all" ? null : value });
            }}
            value={filters.contractId ?? "all"}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {contracts.map((contract) => (
                <SelectItem key={contract.id} value={contract.id}>
                  {formatContractLabel(contract.name, contract.contractNumber)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">Contratada</span>
          <Select
            onValueChange={(value) => {
              update({ contractorOrganizationId: value === "all" ? null : value });
            }}
            value={filters.contractorOrganizationId ?? "all"}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {contractors.map((contractor) => (
                <SelectItem key={contractor.id} value={contractor.id}>
                  {contractor.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm text-muted-foreground">Status</legend>
          <div className="flex flex-wrap gap-2">
            {OCCURRENCE_STATUS_OPTIONS.map((status) => {
              const selected = filters.status.includes(status);

              return (
                <Button
                  className="rounded-full"
                  key={status}
                  size="sm"
                  type="button"
                  variant={selected ? "default" : "outline"}
                  onClick={() => {
                    update({ status: toggleArrayValue(filters.status, status) });
                  }}
                >
                  {formatOccurrenceStatus(status)}
                </Button>
              );
            })}
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm text-muted-foreground">Criticidade</legend>
          <div className="flex flex-wrap gap-2">
            {OCCURRENCE_SEVERITY_OPTIONS.map((severity) => {
              const selected = filters.severity.includes(severity);

              return (
                <Button
                  className="rounded-full"
                  key={severity}
                  size="sm"
                  type="button"
                  variant={selected ? "default" : "outline"}
                  onClick={() => {
                    update({ severity: toggleArrayValue(filters.severity, severity) });
                  }}
                >
                  {formatOccurrenceSeverity(severity)}
                </Button>
              );
            })}
          </div>
        </fieldset>

        <div className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">Referência IMS</span>
          <Select
            onValueChange={(value) => {
              update({
                hasIms: value === "all" ? null : value === "with",
              });
            }}
            value={filters.hasIms === null ? "all" : filters.hasIms ? "with" : "without"}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="with">Com IMS</SelectItem>
              <SelectItem value="without">Sem IMS</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </DialogContent>
    </Dialog>
  );
}
