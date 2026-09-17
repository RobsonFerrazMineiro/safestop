"use client";

import { useParams } from "next/navigation";

import { PageHeader } from "@/components/page-header";
import { PageShell } from "@/components/page-shell";
import { FileText } from "lucide-react";
import { CollapsibleSection } from "@/components/collapsible-section";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useRequirePermission } from "@/features/authorization";
import { EvidenceSection } from "@/features/evidence";
import { OccurrenceParticipantsSection } from "@/features/occurrence-participants";
import { useActiveOrganization } from "@/features/organization/hooks/use-active-organization";
import { OccurrenceTimeline } from "@/features/timeline";
import { InterdicaoBanner } from "@/features/interdicao-oficial";
import { NotificationAwarenessBanner } from "@/features/notifications";
import { ImsReferenceSection } from "@/features/ims-reference";
import { ActionPlanSection, shouldShowActionPlanSection } from "@/features/action-plan";
import { MdhoSection } from "@/features/mdho";
import { formatOccurrenceContractorDisplay } from "@/features/occurrences/utils/format-labels";
import { useWorkspaceOccurrenceDeepLink } from "@/features/workspace/hooks/use-workspace-occurrence-deep-link";

import { usePreventiveStop } from "../hooks/use-stop-work";
import { OperationalDeadEndBanner } from "./operational-dead-end-banner";
import { LeadershipDecisionSection } from "./leadership-decision-section";
import { StopWorkError, StopWorkLoading } from "./stop-work-states";

function formatDateTime(value: string | null): string {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleString("pt-BR");
}

function DetailField({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <span className="text-base text-foreground">{value}</span>
    </div>
  );
}

export function StopWorkDetailContainer() {
  useRequirePermission("occurrence.read");

  const params = useParams<{ id: string }>();
  const stopWorkId = params.id;
  const { activeOrganization } = useActiveOrganization();
  const { stopWork, isLoading, isError, error, isNotFound, refetch, isFetching } =
    usePreventiveStop(stopWorkId);
  const { isForbiddenWorkspace, isLegacyWithoutWorkspace, isAligningWorkspace } =
    useWorkspaceOccurrenceDeepLink({
      occurrenceId: stopWorkId,
      occurrenceWorkspaceId: stopWork?.workspaceId,
      isOccurrenceReady: Boolean(stopWork) && !isLoading && !isError && !isNotFound,
      isOccurrenceMissing: isNotFound,
    });

  if (isLoading || isAligningWorkspace) {
    return <StopWorkLoading message="Carregando paralisação..." />;
  }

  if (isError) {
    return (
      <StopWorkError
        message={error instanceof Error ? error.message : undefined}
        onRetry={() => {
          void refetch();
        }}
      />
    );
  }

  if (isNotFound || !stopWork || isForbiddenWorkspace) {
    return (
      <PageShell width="default">
        <PageHeader
          backHref="/stop-work"
          backLabel="Paralisações"
          eyebrow="FICHA TÉCNICA DA OCORRÊNCIA"
          icon={FileText}
          subtitle="A ocorrência solicitada não foi localizada ou você não possui permissão para acessá-la."
          title="Paralisação não encontrada"
        />
      </PageShell>
    );
  }

  const organizationId = activeOrganization?.id;

  const coordinates =
    stopWork.latitude !== null && stopWork.longitude !== null
      ? `${stopWork.latitude}, ${stopWork.longitude}`
      : null;

  return (
    <PageShell width="default">
      <PageHeader
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={stopWork.status} />
            <StatusBadge severity={stopWork.severity} />
            {stopWork.status === "INTERDICAO_CONFIRMADA" ? (
              <Badge
                className="border-status-destructive-border bg-status-destructive-bg font-medium text-status-destructive-fg"
                variant="outline"
              >
                Interdição Oficial
              </Badge>
            ) : null}
          </div>
        }
        backHref="/stop-work"
        backLabel="Paralisações"
        bordered
        eyebrow="FICHA TÉCNICA DA OCORRÊNCIA"
        icon={FileText}
        subtitle={
          <span className="font-mono font-bold tracking-wide text-primary">
            {stopWork.publicCode}
          </span>
        }
        title={stopWork.title}
      />

      {organizationId ? (
        <NotificationAwarenessBanner occurrenceId={stopWork.id} organizationId={organizationId} />
      ) : null}
      {isLegacyWithoutWorkspace ? (
        <div className="rounded-md border border-[var(--border)] bg-[var(--surface-muted)]/70 px-3 py-2 text-sm text-[var(--foreground-muted)]">
          Legado sem Workspace
        </div>
      ) : null}
      {stopWork.status === "INTERDICAO_CONFIRMADA" ? <InterdicaoBanner /> : null}
      {!(shouldShowActionPlanSection(stopWork) && stopWork.status === "EM_TRATATIVA") ? (
        <OperationalDeadEndBanner status={stopWork.status} />
      ) : null}

      <Card className="gap-4 py-4">
        <CardHeader className="px-4">
          <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80">
            Localização
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 px-4 sm:grid-cols-2">
          <DetailField label="Área" value={stopWork.areaName ?? "—"} />
          <DetailField label="Local" value={stopWork.locationDescription} />
          <DetailField label="Originadora" value={stopWork.originOrganizationName ?? "—"} />
          <DetailField
            label="Contratada"
            value={formatOccurrenceContractorDisplay({
              contractorOrganizationId: stopWork.contractorOrganizationId,
              contractId: stopWork.contractId,
              contractorOrganizationName: stopWork.contractorOrganizationName,
            })}
          />
          {coordinates ? <DetailField label="Coordenadas" value={coordinates} /> : null}
        </CardContent>
      </Card>

      <Card className="gap-4 py-4">
        <CardHeader className="px-4">
          <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80">
            Descrição
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 px-4">
          <DetailField label="Atividade" value={stopWork.taskDescription} />
          <DetailField
            className="max-w-3xl"
            label="Condição insegura"
            value={stopWork.conditionDescription}
          />
          {stopWork.immediateActionDescription ? (
            <DetailField label="Ação imediata" value={stopWork.immediateActionDescription} />
          ) : null}
        </CardContent>
      </Card>

      <Card className="py-4">
        <CardContent className="px-4">
          <CollapsibleSection
            summary={
              <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80">
                Registro
              </h2>
            }
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <DetailField label="Registrado por" value={stopWork.createdByName ?? "—"} />
              <DetailField label="Ocorrido em" value={formatDateTime(stopWork.occurredAt)} />
              <DetailField label="Paralisado em" value={formatDateTime(stopWork.stoppedAt)} />
            </div>
          </CollapsibleSection>
        </CardContent>
      </Card>

      <OccurrenceParticipantsSection occurrenceId={stopWork.id} />

      <EvidenceSection occurrenceId={stopWork.id} />

      {organizationId ? (
        <LeadershipDecisionSection
          isRefreshing={isFetching}
          occurrence={stopWork}
          organizationId={organizationId}
          onRefresh={refetch}
        />
      ) : null}

      {organizationId ? (
        <MdhoSection
          isRefreshing={isFetching}
          occurrence={stopWork}
          organizationId={organizationId}
          onRefresh={refetch}
        />
      ) : null}

      {organizationId ? (
        <ImsReferenceSection
          isRefreshing={isFetching}
          occurrence={stopWork}
          organizationId={organizationId}
          onRefresh={refetch}
        />
      ) : null}

      {organizationId ? (
        <ActionPlanSection
          isRefreshing={isFetching}
          occurrence={stopWork}
          organizationId={organizationId}
          onRefresh={refetch}
        />
      ) : null}

      {organizationId ? (
        <OccurrenceTimeline
          occurrenceId={stopWork.id}
          occurrenceStatus={stopWork.status}
          organizationId={organizationId}
        />
      ) : null}
    </PageShell>
  );
}
