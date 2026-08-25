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
import { cn } from "@/lib/utils";

import { useReportScopeFilterOptions } from "../hooks/use-report-scope-filter-options";
import { REPORT_COPY } from "../utils/report-copy";
import type { AwarenessReportViewState } from "../utils/awareness-report-url";

type AwarenessReportFiltersDialogProps = {
  filters: AwarenessReportViewState;
  activeFilterCount: number;
  onApply: (filters: AwarenessReportViewState) => void;
};

export function AwarenessReportFiltersDialog({
  filters,
  activeFilterCount,
  onApply,
}: AwarenessReportFiltersDialogProps) {
  const [open, setOpen] = useState(false);
  const { members, isLoading, isError } = useReportScopeFilterOptions();

  function update(partial: Partial<AwarenessReportViewState>) {
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
          <DialogDescription>Destinatário e pendências de ciência.</DialogDescription>
        </DialogHeader>

        {isLoading ? <p className="text-sm text-muted-foreground">Carregando opções…</p> : null}
        {isError ? (
          <p className="text-sm text-destructive">Não foi possível carregar as opções de filtro.</p>
        ) : null}

        <div className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">Destinatário</span>
          <Select
            onValueChange={(value) => {
              update({ recipientMemberId: value === "all" ? null : value });
            }}
            value={filters.recipientMemberId ?? "all"}
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

        <Button
          className="self-start rounded-full"
          type="button"
          variant={filters.pendingOnly ? "default" : "outline"}
          onClick={() => {
            update({ pendingOnly: !filters.pendingOnly });
          }}
        >
          Somente pendentes de ciência
        </Button>
      </DialogContent>
    </Dialog>
  );
}
