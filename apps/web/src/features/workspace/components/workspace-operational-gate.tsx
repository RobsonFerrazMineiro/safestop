"use client";

import { Layers } from "lucide-react";
import type { ReactNode } from "react";

import { PageHeader } from "@/components/page-header";
import { PageShell } from "@/components/page-shell";
import { OccurrenceLoading } from "@/features/occurrences/components/occurrence-loading";

import { useActiveWorkspace } from "../hooks/use-active-workspace";

type WorkspaceOperationalGateProps = {
  children: ReactNode;
};

/**
 * Bloqueia somente features Workspace-scoped.
 * Não impede Perfil, Organizations, Contacts nem Notification Center.
 */
export function WorkspaceOperationalGate({ children }: WorkspaceOperationalGateProps) {
  const { activeWorkspace, isLoading, workspaces, hasMultipleWorkspaces, error } =
    useActiveWorkspace();

  if (isLoading) {
    return <OccurrenceLoading message="Carregando Workspace..." />;
  }

  if (error) {
    return (
      <PageShell width="default">
        <PageHeader
          eyebrow="CONTEXTO OPERACIONAL"
          icon={Layers}
          subtitle={error.message}
          title="Não foi possível carregar os Workspaces"
        />
      </PageShell>
    );
  }

  if (workspaces.length === 0) {
    return (
      <PageShell width="default">
        <PageHeader
          eyebrow="CONTEXTO OPERACIONAL"
          icon={Layers}
          subtitle="Você não possui acesso a nenhum Workspace nesta organização."
          title="Sem Workspace acessível"
        />
      </PageShell>
    );
  }

  if (!activeWorkspace) {
    return (
      <PageShell width="default">
        <PageHeader
          eyebrow="CONTEXTO OPERACIONAL"
          icon={Layers}
          subtitle={
            hasMultipleWorkspaces
              ? "Selecione um Workspace na barra superior para continuar."
              : "Aguardando definição do Workspace ativo."
          }
          title="Selecione um Workspace"
        />
      </PageShell>
    );
  }

  return children;
}
