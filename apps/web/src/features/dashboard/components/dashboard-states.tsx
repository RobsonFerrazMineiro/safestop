"use client";

import { LayoutDashboard, OctagonAlert } from "lucide-react";

import { SurfaceIcon } from "@/components/surface-icon";

export function DashboardSectionSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-3" role="status">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="h-16 animate-pulse rounded-lg border border-gray-800 bg-gray-900/40"
        />
      ))}
    </div>
  );
}

type DashboardSectionErrorProps = {
  message?: string;
  onRetry?: () => void;
};

export function DashboardSectionError({ message, onRetry }: DashboardSectionErrorProps) {
  return (
    <div
      className="flex flex-col items-start gap-2 rounded-lg border border-red-900/40 bg-red-950/20 p-4"
      role="alert"
    >
      <p className="text-sm text-red-300">
        {message ?? "Não foi possível carregar este indicador"}
      </p>
      {onRetry ? (
        <button
          className="text-sm text-orange-400 hover:text-orange-300"
          type="button"
          onClick={onRetry}
        >
          Tentar novamente
        </button>
      ) : null}
    </div>
  );
}

export function DashboardEmptyNoOccurrences() {
  return (
    <div
      className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-gray-700 px-6 py-10 text-center"
      role="status"
    >
      <SurfaceIcon className="text-muted-foreground" icon={OctagonAlert} variant="empty" />
      <p className="text-base text-gray-300">Nenhuma ocorrência registrada</p>
    </div>
  );
}

export function DashboardEmptyNoProfileKpis() {
  return (
    <div
      className="flex flex-col items-center gap-3 rounded-lg border border-gray-800 bg-gray-900/30 px-6 py-10 text-center"
      role="status"
    >
      <SurfaceIcon className="text-muted-foreground" icon={LayoutDashboard} variant="empty" />
      <p className="text-base text-gray-300">Não há indicadores disponíveis para o seu perfil</p>
    </div>
  );
}

export function DashboardForbiddenState() {
  return (
    <main className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-semibold text-gray-100">Acesso negado</h1>
      <p className="max-w-md text-base text-gray-400">
        Você não possui permissão para visualizar o dashboard nesta organização.
      </p>
    </main>
  );
}
