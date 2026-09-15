"use client";

import { Bell } from "lucide-react";

import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { SurfaceIcon } from "@/components/surface-icon";

export function NotificationLoadingSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-3" role="status">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="h-20 animate-pulse rounded-lg border border-border bg-card/60"
        />
      ))}
    </div>
  );
}

export function NotificationEmptyState() {
  return (
    <div
      className="flex flex-col items-center gap-3 rounded-lg border border-border bg-card/60 px-6 py-10 text-center"
      role="status"
    >
      <SurfaceIcon className="text-muted-foreground" icon={Bell} variant="empty" />
      <p className="text-sm text-muted-foreground">Nenhuma notificação.</p>
    </div>
  );
}

export function NotificationOfflineNotice() {
  return (
    <p
      className="rounded-lg border border-status-warning-border bg-status-warning-bg/40 px-3 py-2 text-sm text-status-warning-fg"
      role="status"
    >
      Sem conexão. Reconecte para atualizar ou confirmar ciência.
    </p>
  );
}

type NotificationErrorStateProps = {
  message?: string;
  onRetry?: () => void;
};

export function NotificationErrorState({ message, onRetry }: NotificationErrorStateProps) {
  return (
    <div
      className="flex flex-col items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-4"
      role="alert"
    >
      <p className="text-sm text-destructive">
        {message ?? "Não foi possível carregar as notificações."}
      </p>
      {onRetry ? (
        <Button type="button" variant="outline" onClick={onRetry}>
          Tentar novamente
        </Button>
      ) : null}
    </div>
  );
}

export function NotificationForbiddenState() {
  return (
    <PageShell className="gap-6" width="default">
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
        <h1 className="text-2xl font-semibold text-foreground">Acesso negado</h1>
        <p className="max-w-md text-base text-muted-foreground">
          Você não possui permissão para acessar notificações nesta organização.
        </p>
      </div>
    </PageShell>
  );
}
