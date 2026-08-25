"use client";

import { useState } from "react";
import type { ActionItemStatus } from "@safestop/types";
import { DASHBOARD_DUE_SOON_DAYS_DEFAULT } from "@safestop/types";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatActionItemStatus } from "@/features/action-plan/utils/format-labels";
import { cn } from "@/lib/utils";

import { useReportScopeFilterOptions } from "../hooks/use-report-scope-filter-options";
import { REPORT_COPY } from "../utils/report-copy";
import type { ActionItemReportViewState } from "../utils/action-item-report-url";
import { ACTION_ITEM_STATUS_OPTIONS } from "../utils/action-item-report-url";

type ActionItemReportFiltersDialogProps = {
  filters: ActionItemReportViewState;
  activeFilterCount: number;
  onApply: (filters: ActionItemReportViewState) => void;
};

function toggleArrayValue<T extends string>(values: T[], value: T): T[] {
  return values.includes(value) ? values.filter((entry) => entry !== value) : [...values, value];
}

export function ActionItemReportFiltersDialog({
  filters,
  activeFilterCount,
  onApply,
}: ActionItemReportFiltersDialogProps) {
  const [open, setOpen] = useState(false);
  const { members, isLoading, isError } = useReportScopeFilterOptions();

  function update(partial: Partial<ActionItemReportViewState>) {
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
          <DialogDescription>Status, prazo e responsável.</DialogDescription>
        </DialogHeader>

        {isLoading ? <p className="text-sm text-muted-foreground">Carregando opções…</p> : null}
        {isError ? (
          <p className="text-sm text-destructive">Não foi possível carregar as opções de filtro.</p>
        ) : null}

        <div className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">Responsável</span>
          <Select
            onValueChange={(value) => {
              update({ responsibleMemberId: value === "all" ? null : value });
            }}
            value={filters.responsibleMemberId ?? "all"}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {members.map((member) => (
                <SelectItem key={member.id} value={member.id}>
                  {member.fullName ?? member.id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm text-muted-foreground">Status</legend>
          <div className="flex flex-wrap gap-2">
            {ACTION_ITEM_STATUS_OPTIONS.map((status) => {
              const selected = filters.status.includes(status);

              return (
                <Button
                  className="rounded-full"
                  key={status}
                  size="sm"
                  type="button"
                  variant={selected ? "default" : "outline"}
                  onClick={() => {
                    update({
                      status: toggleArrayValue(filters.status, status as ActionItemStatus),
                    });
                  }}
                >
                  {formatActionItemStatus(status)}
                </Button>
              );
            })}
          </div>
        </fieldset>

        <div className="flex flex-wrap gap-2">
          <Button
            className="rounded-full"
            size="sm"
            type="button"
            variant={filters.overdueOnly ? "default" : "outline"}
            onClick={() => {
              update({ overdueOnly: !filters.overdueOnly });
            }}
          >
            Vencidas
          </Button>
          <Button
            className="rounded-full"
            size="sm"
            type="button"
            variant={filters.dueSoonOnly ? "default" : "outline"}
            onClick={() => {
              update({ dueSoonOnly: !filters.dueSoonOnly });
            }}
          >
            Próximas do vencimento
          </Button>
        </div>

        {filters.dueSoonOnly ? (
          <div className="flex flex-col gap-1 text-sm">
            <span className="text-muted-foreground">Dias para vencimento próximo</span>
            <Input
              max={30}
              min={1}
              type="number"
              value={filters.dueSoonDays}
              onChange={(event) => {
                const parsed = Number.parseInt(event.target.value, 10);
                update({
                  dueSoonDays:
                    Number.isFinite(parsed) && parsed >= 1 && parsed <= 30
                      ? parsed
                      : DASHBOARD_DUE_SOON_DAYS_DEFAULT,
                });
              }}
            />
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
