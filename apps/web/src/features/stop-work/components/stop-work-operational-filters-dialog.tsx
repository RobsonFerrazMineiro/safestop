"use client";

import { useState } from "react";
import { ListFilter } from "lucide-react";
import { OCCURRENCE_SEVERITIES, OCCURRENCE_STATUSES, isOccurrenceSeverity } from "@safestop/types";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { useOccurrenceListFilterOptions } from "@/features/occurrences";
import {
  formatOccurrenceSeverity,
  formatOccurrenceStatus,
} from "@/features/occurrences/utils/format-labels";
import { cn } from "@/lib/utils";

import {
  EMPTY_OPERATIONAL_FUNNEL,
  countActiveOperationalFunnelFilters,
  type OperationalListFunnelState,
} from "../utils/operational-list-filters";

const ALL_VALUE = "all";

type StopWorkOperationalFiltersDialogProps = {
  funnel: OperationalListFunnelState;
  onApply: (funnel: OperationalListFunnelState) => void;
};

export function StopWorkOperationalFiltersDialog({
  funnel,
  onApply,
}: StopWorkOperationalFiltersDialogProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<OperationalListFunnelState>(funnel);
  const { areas, contractors, isLoading, isError } = useOccurrenceListFilterOptions({
    enabled: open,
  });
  const activeFilterCount = countActiveOperationalFunnelFilters(funnel);

  function openDialog(nextOpen: boolean) {
    if (nextOpen) {
      setDraft(funnel);
    }

    setOpen(nextOpen);
  }

  function toggleStatus(status: (typeof OCCURRENCE_STATUSES)[number]) {
    setDraft((current) => ({
      ...current,
      status: current.status.includes(status)
        ? current.status.filter((entry) => entry !== status)
        : [...current.status, status],
    }));
  }

  return (
    <Dialog onOpenChange={openDialog} open={open}>
      <DialogTrigger asChild>
        <Button
          className={cn(
            "shrink-0",
            activeFilterCount > 0 ? "border-primary bg-primary/10 text-primary" : "",
          )}
          type="button"
          variant="outline"
        >
          <ListFilter aria-hidden="true" className="size-4" />
          Filtros
          {activeFilterCount > 0 ? ` · ${activeFilterCount}` : ""}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Filtros</DialogTitle>
          <DialogDescription>
            Status, criticidade, área e empresa. Sem seleção de status: todas as Paralisações
            Preventivas visíveis.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? <p className="text-sm text-muted-foreground">Carregando opções…</p> : null}
        {isError ? (
          <p className="text-sm text-destructive">Não foi possível carregar as opções de filtro.</p>
        ) : null}

        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium text-foreground">Status</legend>
          <p className="text-xs text-muted-foreground">Sem seleção: todos os status.</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {OCCURRENCE_STATUSES.map((status) => (
              <label className="flex items-center gap-2 text-sm text-foreground" key={status}>
                <Checkbox
                  checked={draft.status.includes(status)}
                  onCheckedChange={() => {
                    toggleStatus(status);
                  }}
                />
                {formatOccurrenceStatus(status)}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">Criticidade</span>
          <Select
            onValueChange={(value) => {
              setDraft((current) => ({
                ...current,
                severity: isOccurrenceSeverity(value) ? value : null,
              }));
            }}
            value={draft.severity ?? ALL_VALUE}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>Todas</SelectItem>
              {OCCURRENCE_SEVERITIES.map((severity) => (
                <SelectItem key={severity} value={severity}>
                  {formatOccurrenceSeverity(severity)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">Área</span>
          <Select
            onValueChange={(value) => {
              setDraft((current) => ({
                ...current,
                areaId: value === ALL_VALUE ? null : value,
              }));
            }}
            value={draft.areaId ?? ALL_VALUE}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>Todas</SelectItem>
              {areas.map((area) => (
                <SelectItem key={area.id} value={area.id}>
                  {area.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">Contratada</span>
          <Select
            onValueChange={(value) => {
              setDraft((current) => ({
                ...current,
                contractorOrganizationId: value === ALL_VALUE ? null : value,
              }));
            }}
            value={draft.contractorOrganizationId ?? ALL_VALUE}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>Todas</SelectItem>
              {contractors.map((contractor) => (
                <SelectItem key={contractor.id} value={contractor.id}>
                  {contractor.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onApply(EMPTY_OPERATIONAL_FUNNEL);
              setDraft(EMPTY_OPERATIONAL_FUNNEL);
              setOpen(false);
            }}
          >
            Limpar filtros
          </Button>
          <Button
            type="button"
            onClick={() => {
              onApply(draft);
              setOpen(false);
            }}
          >
            Aplicar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
