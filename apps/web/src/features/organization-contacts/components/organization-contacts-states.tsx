"use client";

import { Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SurfaceIcon } from "@/components/surface-icon";

export function OrganizationContactsLoadingSkeleton() {
  return (
    <div className="flex flex-col gap-2" role="status">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="h-12 animate-pulse rounded-lg border border-border bg-card" />
      ))}
    </div>
  );
}

export function OrganizationContactsEmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 py-10 text-center" role="status">
      <SurfaceIcon className="text-muted-foreground" icon={Users} variant="empty" />
      <p className="text-sm text-muted-foreground">Nenhum responsável cadastrado.</p>
    </div>
  );
}

type OrganizationContactsErrorStateProps = {
  onRetry?: () => void;
};

export function OrganizationContactsErrorState({ onRetry }: OrganizationContactsErrorStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 py-6 text-center" role="alert">
      <p className="text-sm text-destructive">Não foi possível carregar os responsáveis.</p>
      {onRetry ? (
        <Button type="button" variant="outline" onClick={onRetry}>
          Tentar novamente
        </Button>
      ) : null}
    </div>
  );
}

export function OrganizationContactsForbiddenState() {
  return (
    <main className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-semibold text-foreground">Acesso negado</h1>
      <p className="max-w-md text-base text-muted-foreground">
        Você não possui permissão para gerenciar responsáveis nesta organização.
      </p>
    </main>
  );
}
