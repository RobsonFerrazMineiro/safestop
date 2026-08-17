"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import { useRequirePermission } from "@/features/authorization";
import { EvidenceSection } from "@/features/evidence";
import {
  formatOccurrenceSeverity,
  formatOccurrenceStatus,
} from "@/features/occurrences/utils/format-labels";
import { useActiveOrganization } from "@/features/organization/hooks/use-active-organization";
import { OccurrenceTimeline } from "@/features/timeline";
import { InterdicaoBanner } from "@/features/interdicao-oficial";
import { ImsReferenceSection } from "@/features/ims-reference";
import { ActionPlanSection, shouldShowActionPlanSection } from "@/features/action-plan";
import { MdhoSection } from "@/features/mdho";

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

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-medium text-gray-400">{label}</span>
      <span className="text-base text-gray-100">{value}</span>
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

  if (isLoading) {
    return <StopWorkLoading message="Carregando paralisação..." />;
  }

  if (isError) {
    return <StopWorkError message={error instanceof Error ? error.message : undefined} />;
  }

  if (isNotFound || !stopWork) {
    return (
      <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-4 px-6 py-10">
        <Link className="text-sm text-orange-400 hover:text-orange-300" href="/stop-work">
          ← Voltar para paralisações
        </Link>
        <p className="text-base text-gray-300">Ocorrência não encontrada.</p>
      </main>
    );
  }

  const organizationId = activeOrganization?.id;

  const coordinates =
    stopWork.latitude !== null && stopWork.longitude !== null
      ? `${stopWork.latitude}, ${stopWork.longitude}`
      : null;

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-6 py-10">
      <nav aria-label="Breadcrumb" className="text-sm text-gray-400">
        <Link className="text-orange-400 hover:text-orange-300" href="/stop-work">
          Paralisações
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-300">{stopWork.publicCode}</span>
      </nav>

      <header className="flex flex-col gap-2">
        <span className="font-mono text-sm text-orange-400">{stopWork.publicCode}</span>
        <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-wide text-gray-500">
          <span>{formatOccurrenceStatus(stopWork.status)}</span>
          {stopWork.status === "INTERDICAO_CONFIRMADA" ? (
            <span className="rounded-full border border-red-600/60 bg-red-950/40 px-2 py-0.5 text-red-300">
              Interdição Oficial
            </span>
          ) : null}
          <span>{formatOccurrenceSeverity(stopWork.severity)}</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-100">{stopWork.title}</h1>
      </header>

      {stopWork.status === "INTERDICAO_CONFIRMADA" ? <InterdicaoBanner /> : null}
      {!(shouldShowActionPlanSection(stopWork) && stopWork.status === "EM_TRATATIVA") ? (
        <OperationalDeadEndBanner status={stopWork.status} />
      ) : null}

      <section className="flex flex-col gap-4 rounded-lg border border-gray-800 bg-gray-900/40 p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400">Localização</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <DetailField label="Área" value={stopWork.areaName ?? "—"} />
          <DetailField label="Local" value={stopWork.locationDescription} />
          <DetailField label="Empresa" value={stopWork.contractorOrganizationName ?? "—"} />
          {coordinates ? <DetailField label="Coordenadas" value={coordinates} /> : null}
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-lg border border-gray-800 bg-gray-900/40 p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400">Descrição</h2>
        <DetailField label="Atividade" value={stopWork.taskDescription} />
        <DetailField label="Condição insegura" value={stopWork.conditionDescription} />
        {stopWork.immediateActionDescription ? (
          <DetailField label="Ação imediata" value={stopWork.immediateActionDescription} />
        ) : null}
      </section>

      <section className="flex flex-col gap-4 rounded-lg border border-gray-800 bg-gray-900/40 p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400">Registro</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <DetailField label="Registrado por" value={stopWork.createdByName ?? "—"} />
          <DetailField label="Ocorrido em" value={formatDateTime(stopWork.occurredAt)} />
          <DetailField label="Paralisado em" value={formatDateTime(stopWork.stoppedAt)} />
        </div>
      </section>

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
    </main>
  );
}
