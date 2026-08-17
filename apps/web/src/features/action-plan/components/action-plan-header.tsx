"use client";

import { isActionPlanEditable } from "@safestop/types";

import type { ActionItemEnriched, ActionPlanEnriched } from "../types";
import { formatActionPlanStatus } from "../utils/format-labels";

type ActionPlanHeaderProps = {
  plan: ActionPlanEnriched;
  items: ActionItemEnriched[];
  canManage: boolean;
  canComplete: boolean;
  isOffline: boolean;
  onAddAction: () => void;
  onCompletePlan: () => void;
  isCompleting: boolean;
};

function computeProgress(items: ActionItemEnriched[]): { completed: number; total: number } {
  const activeItems = items.filter((item) => item.status !== "CANCELLED");
  const completed = activeItems.filter((item) => item.status === "COMPLETED").length;
  return { completed, total: activeItems.length };
}

export function ActionPlanHeader({
  plan,
  items,
  canManage,
  canComplete,
  isOffline,
  onAddAction,
  onCompletePlan,
  isCompleting,
}: ActionPlanHeaderProps) {
  const { completed, total } = computeProgress(items);
  const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;
  const editable = isActionPlanEditable(plan.status);

  const allTerminal =
    items.length > 0 &&
    items.every((item) => item.status === "COMPLETED" || item.status === "CANCELLED");
  const hasCompleted = items.some((item) => item.status === "COMPLETED");
  const showCompleteCta = canManage && canComplete && allTerminal && hasCompleted && editable;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-gray-100">Plano de Ação</span>
          <span className="rounded-full border border-gray-600 px-2 py-0.5 text-xs text-gray-300">
            {formatActionPlanStatus(plan.status)}
          </span>
        </div>
        <span className="text-xs text-gray-400">
          {completed} de {total} concluídas
        </span>
      </div>

      {total > 0 ? (
        <div
          aria-valuemax={total}
          aria-valuemin={0}
          aria-valuenow={completed}
          className="h-2 w-full overflow-hidden rounded-full bg-gray-800"
          role="progressbar"
        >
          <div
            className="h-full rounded-full bg-orange-500 transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      ) : null}

      {canManage && editable ? (
        <button
          className="w-full rounded-md border border-gray-600 px-4 py-2 text-sm font-medium text-gray-200 hover:bg-gray-800 disabled:opacity-50 sm:w-auto sm:self-start"
          disabled={isOffline}
          type="button"
          onClick={onAddAction}
        >
          Adicionar ação
        </button>
      ) : null}

      {showCompleteCta ? (
        <button
          className="w-full rounded-md bg-orange-500 px-4 py-3 text-sm font-medium text-white hover:bg-orange-400 disabled:opacity-50 sm:w-auto sm:self-start"
          disabled={isCompleting || isOffline}
          type="button"
          onClick={onCompletePlan}
        >
          {isCompleting ? "Concluindo…" : "Concluir plano"}
        </button>
      ) : null}
    </div>
  );
}
