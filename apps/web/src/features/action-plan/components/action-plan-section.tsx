"use client";

import { useState } from "react";

import type { OccurrenceDetailsEnriched } from "@/features/occurrences/types";

import { useActionPlanContext } from "../hooks/use-action-plan-context";
import { useActionPlan } from "../hooks/use-action-plan";
import { useActionPlanItems } from "../hooks/use-action-plan-items";
import { useCompleteActionPlan } from "../hooks/use-complete-action-plan";
import { useInvalidateActionPlanCaches } from "../hooks/use-invalidate-action-plan-caches";
import { isActionPlanRpcConflictError } from "../utils/action-plan-rpc";
import { ActionPlanCompleteDialog } from "./action-plan-complete-dialog";
import { ActionPlanEmpty } from "./action-plan-empty";
import { ActionPlanHeader } from "./action-plan-header";
import { ActionPlanItemCard } from "./action-plan-item-card";
import { ActionPlanItemFormDialog } from "./action-plan-item-form-dialog";
import {
  ActionPlanCompletedBanner,
  ActionPlanConflictCard,
  ActionPlanLoadingSkeleton,
  ActionPlanWaitingBanner,
} from "./action-plan-states";

type ActionPlanSectionProps = {
  occurrence: OccurrenceDetailsEnriched;
  organizationId: string;
  onRefresh: () => Promise<unknown>;
  isRefreshing: boolean;
};

export function ActionPlanSection({
  occurrence,
  organizationId,
  onRefresh,
  isRefreshing,
}: ActionPlanSectionProps) {
  const context = useActionPlanContext(occurrence, null, []);
  const invalidateCaches = useInvalidateActionPlanCaches();

  const shouldFetch = context.shouldRenderSection;
  const {
    plan,
    isLoading: isPlanLoading,
    isError: isPlanError,
    refetch: refetchPlan,
  } = useActionPlan(organizationId, occurrence.id, shouldFetch);

  const hasPlan = plan !== null;
  const {
    items,
    isLoading: isItemsLoading,
    isError: isItemsError,
    refetch: refetchItems,
  } = useActionPlanItems(organizationId, plan?.id, shouldFetch && hasPlan);

  const fullContext = useActionPlanContext(occurrence, plan, isItemsError ? [] : items);
  const completeMutation = useCompleteActionPlan(organizationId, occurrence.id);

  const [showConflict, setShowConflict] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isCompleteOpen, setIsCompleteOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  if (!fullContext.shouldRenderSection) {
    return null;
  }

  async function handleRefresh() {
    await invalidateCaches(
      {
        organizationId,
        occurrenceId: occurrence.id,
        planId: plan?.id,
      },
      "plan",
    );
    await refetchPlan();
    await refetchItems();
    await onRefresh();
    setShowConflict(false);
  }

  async function handleCompletePlan() {
    if (!plan) return;
    setActionError(null);

    try {
      await completeMutation.mutateAsync(plan.id);
      setIsCompleteOpen(false);
    } catch (error) {
      setIsCompleteOpen(false);
      if (isActionPlanRpcConflictError(error)) {
        setShowConflict(true);
        return;
      }
      setActionError("Não foi possível concluir o plano.");
    }
  }

  const isLoading = isPlanLoading || (hasPlan && isItemsLoading);
  const planCompleted = plan?.status === "COMPLETED";
  const showPlanBody = !showConflict && !isLoading && !isPlanError && hasPlan && plan !== null;
  const showItemsError = showPlanBody && isItemsError;
  const showItemsSuccess = showPlanBody && !isItemsError;

  return (
    <section
      aria-label="Plano de Ação"
      className="flex flex-col gap-4 rounded-lg border border-border bg-card/60 p-4"
    >
      <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80">
        Plano de Ação
      </h2>

      {showConflict ? (
        <ActionPlanConflictCard
          isRefreshing={isRefreshing}
          onRefresh={() => {
            void handleRefresh();
          }}
        />
      ) : null}

      {!showConflict && isLoading ? <ActionPlanLoadingSkeleton /> : null}

      {!showConflict && !isLoading && isPlanError ? (
        <div className="flex flex-col items-start gap-2" role="alert">
          <p className="text-sm text-destructive">Não foi possível carregar o Plano de Ação.</p>
          <button
            className="text-sm text-primary hover:text-primary/80"
            type="button"
            onClick={() => {
              void refetchPlan();
            }}
          >
            Tentar novamente
          </button>
        </div>
      ) : null}

      {!showConflict && !isLoading && !isPlanError && !hasPlan && fullContext.canCreate ? (
        <ActionPlanEmpty
          isOffline={fullContext.isOffline}
          occurrenceId={occurrence.id}
          organizationId={organizationId}
          onConflict={() => {
            setShowConflict(true);
          }}
        />
      ) : null}

      {!showConflict && !isLoading && !isPlanError && !hasPlan && !fullContext.canCreate ? (
        <ActionPlanWaitingBanner />
      ) : null}

      {showItemsError ? (
        <div className="flex flex-col items-start gap-2" role="alert">
          <p className="text-sm text-destructive">Não foi possível carregar as ações do plano.</p>
          <button
            className="text-sm text-primary hover:text-primary/80"
            type="button"
            onClick={() => {
              void refetchItems();
            }}
          >
            Tentar novamente
          </button>
        </div>
      ) : null}

      {showItemsSuccess && plan ? (
        <>
          <ActionPlanHeader
            canComplete={fullContext.canComplete}
            canManage={fullContext.canManage && !planCompleted}
            isCompleting={completeMutation.isPending}
            isOffline={fullContext.isOffline}
            items={items}
            plan={plan}
            onAddAction={() => {
              setIsAddOpen(true);
            }}
            onCompletePlan={() => {
              setIsCompleteOpen(true);
            }}
          />

          {planCompleted ? <ActionPlanCompletedBanner /> : null}

          {actionError ? (
            <p className="text-sm text-destructive" role="alert">
              {actionError}
            </p>
          ) : null}

          <div className="flex flex-col gap-3">
            {items.map((item) => (
              <ActionPlanItemCard
                key={item.id}
                canManage={fullContext.canManage}
                canSubmitItem={fullContext.canSubmitItem}
                canValidateItem={fullContext.canValidateItem}
                currentUserId={fullContext.currentUserId}
                isItemResponsible={fullContext.isItemResponsible}
                isOffline={fullContext.isOffline}
                item={item}
                occurrenceId={occurrence.id}
                organizationId={organizationId}
                planId={plan.id}
                onConflict={() => {
                  setShowConflict(true);
                }}
              />
            ))}
          </div>

          <ActionPlanItemFormDialog
            actionPlanId={plan.id}
            isOffline={fullContext.isOffline}
            isOpen={isAddOpen}
            occurrenceId={occurrence.id}
            organizationId={organizationId}
            onClose={() => {
              setIsAddOpen(false);
            }}
            onConflict={() => {
              setIsAddOpen(false);
              setShowConflict(true);
            }}
          />

          <ActionPlanCompleteDialog
            isOpen={isCompleteOpen}
            isPending={completeMutation.isPending}
            onClose={() => {
              setIsCompleteOpen(false);
            }}
            onConfirm={() => {
              void handleCompletePlan();
            }}
          />
        </>
      ) : null}
    </section>
  );
}
