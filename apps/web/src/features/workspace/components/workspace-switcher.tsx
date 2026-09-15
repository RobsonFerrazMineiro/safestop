"use client";

import { Check, Layers } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useActiveWorkspace } from "../hooks/use-active-workspace";

export function WorkspaceSwitcher() {
  const { activeWorkspace, workspaces, hasMultipleWorkspaces, setActiveWorkspace, isLoading } =
    useActiveWorkspace();

  if (isLoading) {
    return (
      <div className="flex min-w-0 max-w-sm items-center gap-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)]/60 px-3 py-1.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[var(--primary)]/15 text-[var(--primary)]">
          <Layers className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <span className="block text-[10px] font-bold uppercase tracking-widest text-[var(--foreground-muted)]/70">
            AMBIENTE
          </span>
          <p className="truncate text-xs font-medium text-[var(--foreground-muted)]">
            Carregando...
          </p>
        </div>
      </div>
    );
  }

  if (workspaces.length === 0) {
    return (
      <div className="flex min-w-0 max-w-sm items-center gap-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)]/60 px-3 py-1.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[var(--primary)]/15 text-[var(--primary)]">
          <Layers className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <span className="block text-[10px] font-bold uppercase tracking-widest text-[var(--foreground-muted)]/70">
            AMBIENTE
          </span>
          <p className="truncate text-xs font-medium text-[var(--foreground-muted)]">
            Nenhum Ambiente
          </p>
        </div>
      </div>
    );
  }

  if (!hasMultipleWorkspaces && activeWorkspace) {
    const label = activeWorkspace.code
      ? `${activeWorkspace.name} - ${activeWorkspace.code}`
      : activeWorkspace.name;

    return (
      <div className="flex min-w-0 max-w-sm items-center gap-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)]/60 px-3 py-1.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[var(--primary)]/15 text-[var(--primary)]">
          <Layers className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <span className="block text-[10px] font-bold uppercase tracking-widest text-[var(--foreground-muted)]/70">
            AMBIENTE
          </span>
          <p className="truncate text-xs font-medium text-[var(--foreground)]" title={label}>
            {label}
          </p>
        </div>
      </div>
    );
  }

  return (
    <Select
      value={activeWorkspace?.id}
      onValueChange={(workspaceId) => {
        setActiveWorkspace(workspaceId);
      }}
    >
      <SelectTrigger
        aria-label="Alterar Ambiente ativo"
        className="h-auto min-h-10 w-full min-w-0 max-w-sm justify-start gap-2.5 rounded-lg border-[var(--border)] bg-[var(--surface-muted)]/60 px-3 py-1.5 text-left shadow-none transition-colors hover:bg-[var(--surface-muted)] sm:w-[22rem]"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[var(--primary)]/15 text-[var(--primary)]">
          <Layers className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[10px] font-bold uppercase tracking-widest text-[var(--foreground-muted)]/70">
            AMBIENTE
          </span>
          <span className="block truncate text-xs font-medium text-[var(--foreground)]">
            <SelectValue placeholder="Selecionar Ambiente" />
          </span>
        </span>
      </SelectTrigger>
      <SelectContent align="start" position="popper">
        {workspaces.map((workspace) => (
          <SelectItem key={workspace.id} value={workspace.id}>
            <span className="flex min-w-0 items-center gap-2">
              <span className="truncate">{workspace.name}</span>
              {workspace.code ? (
                <span className="text-xs text-[var(--foreground-muted)]">{workspace.code}</span>
              ) : null}
              {workspace.id === activeWorkspace?.id ? (
                <Check className="ml-auto h-3.5 w-3.5 text-[var(--primary)]" />
              ) : null}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
