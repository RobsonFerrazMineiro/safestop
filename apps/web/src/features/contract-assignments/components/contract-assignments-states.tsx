"use client";

import { ClipboardList } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { PageShell } from "@/components/page-shell";

export function ContractAssignmentsLoading() {
  return (
    <div className="flex flex-col gap-2" role="status">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="h-12 animate-pulse rounded-lg border border-border bg-card/60"
        />
      ))}
    </div>
  );
}

export function ContractAssignmentsEmpty({ message }: { message: string }) {
  return (
    <p className="py-8 text-center text-sm text-muted-foreground" role="status">
      {message}
    </p>
  );
}

export function ContractAssignmentsError({
  message,
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-6 text-center" role="alert">
      <p className="text-sm text-destructive">
        {message ?? "Não foi possível carregar os responsáveis do contrato."}
      </p>
      {onRetry ? (
        <Button type="button" variant="outline" onClick={onRetry}>
          Tentar novamente
        </Button>
      ) : null}
    </div>
  );
}

export function ContractAssignmentsForbidden() {
  return (
    <PageShell className="gap-6" width="wide">
      <PageHeader
        eyebrow="GOVERNANÇA DO CONTRATO"
        icon={ClipboardList}
        subtitle="Você não possui permissão para gerenciar responsáveis do contrato nesta EMPRESA."
        title="Acesso negado"
      />
    </PageShell>
  );
}
