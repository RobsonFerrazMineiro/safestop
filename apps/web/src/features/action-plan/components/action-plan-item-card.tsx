"use client";

import { useState } from "react";

import { useStartActionItem } from "../hooks/use-start-action-item";
import type { ActionItemEnriched } from "../types";
import { isActionPlanRpcConflictError } from "../utils/action-plan-rpc";
import {
  formatActionItemPriority,
  formatActionItemStatus,
  isActionItemOverdue,
} from "../utils/format-labels";
import { ActionPlanSubmitDialog } from "./action-plan-submit-dialog";
import { ActionPlanValidatePanel } from "./action-plan-validate-panel";
import { ActionPlanOfflineNotice } from "./action-plan-states";

type ActionPlanItemCardProps = {
  item: ActionItemEnriched;
  organizationId: string;
  occurrenceId: string;
  planId: string;
  canManage: boolean;
  canSubmitItem: (item: ActionItemEnriched) => boolean;
  canValidateItem: (item: ActionItemEnriched) => boolean;
  isItemResponsible: (item: ActionItemEnriched) => boolean;
  currentUserId: string;
  isOffline: boolean;
  onConflict: () => void;
};

function formatDueAt(value: string): string {
  return new Date(value).toLocaleString("pt-BR");
}

function priorityBadgeClass(priority: ActionItemEnriched["priority"]): string {
  switch (priority) {
    case "CRITICAL":
      return "border-red-600/60 bg-red-950/40 text-red-300";
    case "HIGH":
      return "border-orange-600/60 bg-orange-950/40 text-orange-300";
    case "MEDIUM":
      return "border-blue-600/60 bg-blue-950/40 text-blue-300";
    default:
      return "border-gray-600 bg-gray-900 text-gray-300";
  }
}

export function ActionPlanItemCard({
  item,
  organizationId,
  occurrenceId,
  planId,
  canManage,
  canSubmitItem,
  canValidateItem,
  isItemResponsible,
  currentUserId,
  isOffline,
  onConflict,
}: ActionPlanItemCardProps) {
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const startMutation = useStartActionItem(organizationId, occurrenceId, planId, item.id);

  const overdue = isActionItemOverdue(item.dueAt, item.status);
  const isTerminal = item.status === "COMPLETED" || item.status === "CANCELLED";

  const canShowStart =
    item.status === "PENDING" && (canManage || isItemResponsible(item)) && !isTerminal;

  const canShowSubmit =
    item.status === "REJECTED"
      ? canManage || isItemResponsible(item)
      : item.status === "IN_PROGRESS" && canSubmitItem(item);

  const showSelfValidationNotice =
    item.status === "AWAITING_VALIDATION" &&
    item.completedBy !== null &&
    item.completedBy === currentUserId;

  async function handleStart() {
    setActionError(null);
    try {
      await startMutation.mutateAsync();
    } catch (error) {
      if (isActionPlanRpcConflictError(error)) {
        onConflict();
        return;
      }
      setActionError("Não foi possível iniciar a ação.");
    }
  }

  return (
    <article className="flex flex-col gap-3 rounded-lg border border-gray-700/80 bg-gray-950/40 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full border px-2 py-0.5 text-xs font-medium ${priorityBadgeClass(item.priority)}`}
        >
          {formatActionItemPriority(item.priority)}
        </span>
        <span className="rounded-full border border-gray-600 px-2 py-0.5 text-xs text-gray-300">
          {formatActionItemStatus(item.status)}
        </span>
        {overdue ? (
          <span className="rounded-full border border-amber-600/60 bg-amber-950/40 px-2 py-0.5 text-xs text-amber-200">
            Atrasada
          </span>
        ) : null}
      </div>

      <div className="flex flex-col gap-1">
        <h3 className="text-base font-medium text-gray-100">{item.title}</h3>
        {item.description ? (
          <p className="line-clamp-2 text-sm text-gray-400">{item.description}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1 text-sm text-gray-400">
        <span>
          Responsável: {item.responsibleMemberName ?? "—"}
          {item.responsibleOrganizationName ? ` · ${item.responsibleOrganizationName}` : ""}
        </span>
        <span>Prazo: {formatDueAt(item.dueAt)}</span>
      </div>

      {isOffline && (canShowStart || canShowSubmit) ? <ActionPlanOfflineNotice /> : null}

      {actionError ? (
        <p className="text-sm text-red-400" role="alert">
          {actionError}
        </p>
      ) : null}

      {canShowStart ? (
        <button
          className="w-full rounded-md bg-orange-500 px-4 py-3 text-sm font-medium text-white hover:bg-orange-400 disabled:opacity-50 sm:w-auto sm:self-start"
          disabled={startMutation.isPending || isOffline}
          type="button"
          onClick={() => {
            void handleStart();
          }}
        >
          {startMutation.isPending ? "Iniciando…" : "Iniciar"}
        </button>
      ) : null}

      {canShowSubmit ? (
        <button
          className="w-full rounded-md bg-orange-500 px-4 py-3 text-sm font-medium text-white hover:bg-orange-400 disabled:opacity-50 sm:w-auto sm:self-start"
          disabled={isOffline}
          type="button"
          onClick={() => {
            setIsSubmitOpen(true);
          }}
        >
          Concluir
        </button>
      ) : null}

      <ActionPlanValidatePanel
        canValidate={canValidateItem(item)}
        isOffline={isOffline}
        item={item}
        occurrenceId={occurrenceId}
        organizationId={organizationId}
        planId={planId}
        showSelfValidationNotice={showSelfValidationNotice}
        onConflict={onConflict}
      />

      <ActionPlanSubmitDialog
        isOffline={isOffline}
        isOpen={isSubmitOpen}
        item={item}
        occurrenceId={occurrenceId}
        organizationId={organizationId}
        planId={planId}
        onClose={() => {
          setIsSubmitOpen(false);
        }}
        onConflict={onConflict}
      />
    </article>
  );
}
