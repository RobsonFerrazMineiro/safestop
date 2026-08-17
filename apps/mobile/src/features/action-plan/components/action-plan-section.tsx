import { useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from "react-native";
import type { OccurrenceDetails } from "@safestop/types";
import {
  canCompleteActionPlan,
  canCreateActionPlan,
  canManageActionPlan,
  isActionPlanActiveStatus,
  shouldShowActionPlanSection,
} from "@safestop/types";

import { useAuthorization } from "@/features/authorization/hooks/use-authorization";
import { useActiveOrganization } from "@/features/organization/hooks/use-active-organization";
import { EvaluationConflictCard } from "@/features/ver-e-agir/components/evaluation-conflict-card";
import { useAuth } from "@/hooks/use-auth";

import { ActionPlanAddItemForm } from "./action-plan-add-item-form";
import { ActionPlanItemCard } from "./action-plan-item-card";
import { ActionPlanOfflineNotice } from "./action-plan-offline-notice";
import { ActionPlanSubmitSheet } from "./action-plan-submit-sheet";
import { ActionPlanValidateSheet } from "./action-plan-validate-sheet";
import {
  useActionPlan,
  useActionPlanItems,
  useAddActionItem,
  useCompleteActionPlan,
  useCreateActionPlan,
  useOrganizationMembers,
  useStartActionItem,
  useSubmitActionItem,
  useValidateActionItem,
} from "../hooks";
import type { ActionItemEnriched, ActionPlanViewMode } from "../types";
import {
  isActionPlanRpcConflictError,
  ActionPlanRpcSelfValidationError,
  ActionPlanRpcValidationError,
} from "../utils/action-plan-rpc";
import { ACTION_PLAN_COPY } from "../utils/action-plan-copy";
import { formatActionPlanStatus } from "../utils/format-labels";

type ActionPlanSectionProps = {
  occurrence: OccurrenceDetails;
  isOnline: boolean;
  isRefreshing?: boolean;
  onRefresh: () => Promise<unknown>;
};

export function ActionPlanSection({
  occurrence,
  isOnline,
  isRefreshing = false,
  onRefresh,
}: ActionPlanSectionProps) {
  const { user } = useAuth();
  const { can, isPlatformAdmin } = useAuthorization();
  const { activeOrganization } = useActiveOrganization();
  const memberId = activeOrganization?.organizationMemberId ?? "";

  const { plan, isLoading: isPlanLoading, refetch: refetchPlan } = useActionPlan(occurrence.id);
  const {
    items,
    isLoading: isItemsLoading,
    refetch: refetchItems,
  } = useActionPlanItems(plan?.id ?? null);
  const { members } = useOrganizationMembers();

  const { createPlan, isCreating } = useCreateActionPlan(occurrence.id);
  const { addItem, isAdding } = useAddActionItem(occurrence.id, plan?.id ?? "");
  const { startItem, isStarting } = useStartActionItem(occurrence.id, plan?.id ?? "");
  const { submitItem, isSubmitting } = useSubmitActionItem(occurrence.id, plan?.id ?? "");
  const { validateItem, isValidating } = useValidateActionItem(occurrence.id, plan?.id ?? "");
  const { completePlan, isCompleting } = useCompleteActionPlan(occurrence.id);

  const [viewMode, setViewMode] = useState<ActionPlanViewMode>("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showConflict, setShowConflict] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitItemTarget, setSubmitItemTarget] = useState<ActionItemEnriched | null>(null);
  const [validateItemTarget, setValidateItemTarget] = useState<ActionItemEnriched | null>(null);

  const canRead = can("occurrence.read");
  const shouldRender = canRead && shouldShowActionPlanSection(occurrence);

  const hasActivePlan = plan !== null && isActionPlanActiveStatus(plan.status);

  const guardContext = useMemo(
    () => ({
      isPlatformAdmin,
      permissions: {
        actionPlanCreate: can("action_plan.create"),
        actionPlanManage: can("action_plan.manage"),
        actionPlanValidate: can("action_plan.validate"),
      },
      isResponsibleMember: false,
    }),
    [can, isPlatformAdmin],
  );

  const canCreate = canCreateActionPlan({
    occurrence,
    context: { ...guardContext, hasActivePlan },
  });

  const canManage = plan ? canManageActionPlan(guardContext) : false;

  const canComplete =
    plan && canCompleteActionPlan({ plan, context: guardContext }) && hasActivePlan;

  const completedCount = items.filter((item) => item.status === "COMPLETED").length;
  const totalCount = items.filter((item) => item.status !== "CANCELLED").length;

  const visibleItems = useMemo(() => {
    if (viewMode === "mine") {
      return items.filter((item) => item.responsibleMemberId === memberId);
    }

    return items;
  }, [items, memberId, viewMode]);

  const isBusy =
    isCreating || isAdding || isStarting || isSubmitting || isValidating || isCompleting;

  async function handleRefresh() {
    setShowConflict(false);
    await Promise.all([onRefresh(), refetchPlan(), refetchItems()]);
  }

  function handleMutationError(error: unknown, fallback: string) {
    if (isActionPlanRpcConflictError(error)) {
      setShowConflict(true);
      Alert.alert(ACTION_PLAN_COPY.conflict);
      return;
    }

    if (error instanceof ActionPlanRpcSelfValidationError) {
      Alert.alert(ACTION_PLAN_COPY.selfValidation);
      return;
    }

    if (error instanceof ActionPlanRpcValidationError) {
      Alert.alert(error.message);
      return;
    }

    Alert.alert("Erro", error instanceof Error ? error.message : fallback);
  }

  function assertOnline() {
    if (!isOnline) {
      Alert.alert(ACTION_PLAN_COPY.offline);
      return false;
    }

    return true;
  }

  async function handleCreatePlan() {
    if (!assertOnline()) {
      return;
    }

    Alert.alert(ACTION_PLAN_COPY.confirmCreateTitle, ACTION_PLAN_COPY.confirmCreateBody, [
      { text: ACTION_PLAN_COPY.cancel, style: "cancel" },
      {
        text: ACTION_PLAN_COPY.createPlan,
        onPress: () => {
          void (async () => {
            try {
              await createPlan({ occurrenceId: occurrence.id });
              setSuccessMessage(ACTION_PLAN_COPY.successCreate);
              await handleRefresh();
            } catch (error) {
              handleMutationError(error, "Não foi possível criar o Plano de Ação.");
            }
          })();
        },
      },
    ]);
  }

  async function handleAddItem(input: {
    title: string;
    responsibleMemberId: string;
    dueAt: string;
    priority: ActionItemEnriched["priority"];
  }) {
    if (!plan || !assertOnline()) {
      return;
    }

    try {
      await addItem({
        actionPlanId: plan.id,
        title: input.title,
        responsibleMemberId: input.responsibleMemberId,
        dueAt: input.dueAt,
        priority: input.priority,
      });
      setShowAddForm(false);
      await handleRefresh();
    } catch (error) {
      handleMutationError(error, "Não foi possível adicionar a ação.");
    }
  }

  async function handleStart(item: ActionItemEnriched) {
    if (!assertOnline()) {
      return;
    }

    try {
      await startItem(item.id);
      await handleRefresh();
    } catch (error) {
      handleMutationError(error, "Não foi possível iniciar a ação.");
    }
  }

  async function handleSubmit(completionDescription: string) {
    if (!submitItemTarget || !assertOnline()) {
      return;
    }

    try {
      await submitItem({
        itemId: submitItemTarget.id,
        completionDescription,
      });
      setSuccessMessage(ACTION_PLAN_COPY.successSubmit);
      setSubmitItemTarget(null);
      await handleRefresh();
    } catch (error) {
      handleMutationError(error, "Não foi possível concluir a ação.");
    }
  }

  async function handleApprove() {
    if (!validateItemTarget || !assertOnline()) {
      return;
    }

    try {
      await validateItem({ itemId: validateItemTarget.id, outcome: "COMPLETED" });
      setSuccessMessage(ACTION_PLAN_COPY.successValidate);
      setValidateItemTarget(null);
      await handleRefresh();
    } catch (error) {
      handleMutationError(error, "Não foi possível validar a ação.");
    }
  }

  async function handleReject(note: string) {
    if (!validateItemTarget || !assertOnline()) {
      return;
    }

    try {
      await validateItem({ itemId: validateItemTarget.id, outcome: "REJECTED", note });
      setSuccessMessage(ACTION_PLAN_COPY.successReject);
      setValidateItemTarget(null);
      await handleRefresh();
    } catch (error) {
      handleMutationError(error, "Não foi possível rejeitar a ação.");
    }
  }

  async function handleCompletePlan() {
    if (!plan || !assertOnline()) {
      return;
    }

    Alert.alert(ACTION_PLAN_COPY.completePlan, ACTION_PLAN_COPY.completePlanConfirm, [
      { text: ACTION_PLAN_COPY.cancel, style: "cancel" },
      {
        text: ACTION_PLAN_COPY.confirm,
        onPress: () => {
          void (async () => {
            try {
              await completePlan(plan.id);
              setSuccessMessage(ACTION_PLAN_COPY.completePlanSuccess);
              await handleRefresh();
            } catch (error) {
              handleMutationError(error, "Não foi possível concluir o plano.");
            }
          })();
        },
      },
    ]);
  }

  if (!shouldRender) {
    return null;
  }

  if (isPlanLoading) {
    return (
      <View style={styles.container}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>
          {ACTION_PLAN_COPY.sectionTitle}
        </Text>
        <ActivityIndicator color="#93C5FD" />
        <Text style={styles.loading}>{ACTION_PLAN_COPY.loading}</Text>
      </View>
    );
  }

  if (!plan) {
    return (
      <View style={styles.container}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>
          {ACTION_PLAN_COPY.sectionTitle}
        </Text>

        {!isOnline ? <ActionPlanOfflineNotice /> : null}

        {canCreate ? (
          <>
            <Text style={styles.emptyBody}>{ACTION_PLAN_COPY.emptyBody}</Text>
            <Pressable
              accessibilityRole="button"
              disabled={!isOnline || isCreating}
              style={[styles.primaryButton, (!isOnline || isCreating) && styles.disabled]}
              onPress={handleCreatePlan}
            >
              <Text style={styles.primaryButtonText}>{ACTION_PLAN_COPY.createPlan}</Text>
            </Pressable>
          </>
        ) : (
          <View accessibilityRole="text" style={styles.awaitingBanner}>
            <Text style={styles.awaitingText}>{ACTION_PLAN_COPY.awaitingPlan}</Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text accessibilityRole="header" style={styles.sectionTitle}>
        {ACTION_PLAN_COPY.sectionTitle}
      </Text>

      {!isOnline ? <ActionPlanOfflineNotice /> : null}

      {successMessage ? <Text style={styles.success}>{successMessage}</Text> : null}

      <View style={styles.headerRow}>
        <Text style={styles.planStatus}>{formatActionPlanStatus(plan.status)}</Text>
        <Text accessibilityRole="text" style={styles.progress}>
          {ACTION_PLAN_COPY.progress(completedCount, totalCount)}
        </Text>
      </View>

      {plan.status === "COMPLETED" ? (
        <Text style={styles.completeHint}>{ACTION_PLAN_COPY.completePlanSuccess}</Text>
      ) : null}

      {showConflict ? (
        <EvaluationConflictCard
          isRefreshing={isRefreshing}
          message={ACTION_PLAN_COPY.conflict}
          title="Conflito"
          onRefresh={() => {
            void handleRefresh();
          }}
        />
      ) : null}

      <View style={styles.filterRow}>
        <Pressable
          style={[styles.filterChip, viewMode === "all" && styles.filterChipActive]}
          onPress={() => {
            setViewMode("all");
          }}
        >
          <Text style={[styles.filterText, viewMode === "all" && styles.filterTextActive]}>
            {ACTION_PLAN_COPY.allActions}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.filterChip, viewMode === "mine" && styles.filterChipActive]}
          onPress={() => {
            setViewMode("mine");
          }}
        >
          <Text style={[styles.filterText, viewMode === "mine" && styles.filterTextActive]}>
            {ACTION_PLAN_COPY.myActions}
          </Text>
        </Pressable>
      </View>

      {isItemsLoading ? <ActivityIndicator color="#93C5FD" /> : null}

      {visibleItems.map((item) => (
        <ActionPlanItemCard
          key={item.id}
          currentUserId={user?.id ?? ""}
          guardContext={{
            ...guardContext,
            isResponsibleMember: item.responsibleMemberId === memberId,
          }}
          isBusy={isBusy}
          isOnline={isOnline}
          item={item}
          onStart={() => {
            void handleStart(item);
          }}
          onSubmit={() => {
            setSubmitItemTarget(item);
          }}
          onValidate={() => {
            setValidateItemTarget(item);
          }}
        />
      ))}

      {canManage && hasActivePlan && !showAddForm ? (
        <Pressable
          accessibilityRole="button"
          disabled={!isOnline || isBusy}
          style={[styles.secondaryButton, (!isOnline || isBusy) && styles.disabled]}
          onPress={() => {
            setShowAddForm(true);
          }}
        >
          <Text style={styles.secondaryButtonText}>{ACTION_PLAN_COPY.addAction}</Text>
        </Pressable>
      ) : null}

      {showAddForm && canManage ? (
        <ActionPlanAddItemForm
          isOnline={isOnline}
          isSubmitting={isAdding}
          members={members}
          onCancel={() => {
            setShowAddForm(false);
          }}
          onSubmit={(input) => {
            void handleAddItem(input);
          }}
        />
      ) : null}

      {canComplete ? (
        <Pressable
          accessibilityRole="button"
          disabled={!isOnline || isCompleting}
          style={[styles.completeButton, (!isOnline || isCompleting) && styles.disabled]}
          onPress={handleCompletePlan}
        >
          <Text style={styles.completeButtonText}>{ACTION_PLAN_COPY.completePlan}</Text>
        </Pressable>
      ) : null}

      <ActionPlanSubmitSheet
        isOnline={isOnline}
        isSubmitting={isSubmitting}
        itemId={submitItemTarget?.id ?? ""}
        occurrenceId={occurrence.id}
        priority={submitItemTarget?.priority ?? "MEDIUM"}
        visible={submitItemTarget !== null}
        onClose={() => {
          setSubmitItemTarget(null);
        }}
        onSubmit={handleSubmit}
      />

      <ActionPlanValidateSheet
        isOnline={isOnline}
        isValidating={isValidating}
        itemId={validateItemTarget?.id ?? ""}
        visible={validateItemTarget !== null}
        onClose={() => {
          setValidateItemTarget(null);
        }}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  awaitingBanner: {
    backgroundColor: "#1E3A5F",
    borderColor: "#2563EB",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  awaitingText: {
    color: "#DBEAFE",
    fontSize: 14,
    fontWeight: "600",
  },
  completeButton: {
    alignItems: "center",
    backgroundColor: "#312E81",
    borderRadius: 10,
    justifyContent: "center",
    minHeight: 44,
    marginTop: 4,
  },
  completeButtonText: {
    color: "#E0E7FF",
    fontSize: 15,
    fontWeight: "700",
  },
  completeHint: {
    color: "#A5B4FC",
    fontSize: 13,
    fontWeight: "600",
  },
  container: {
    gap: 12,
    marginTop: 8,
  },
  disabled: {
    opacity: 0.45,
  },
  emptyBody: {
    color: "#D1D5DB",
    fontSize: 14,
    lineHeight: 20,
  },
  filterChip: {
    backgroundColor: "#1F2937",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  filterChipActive: {
    backgroundColor: "#1E3A5F",
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
  },
  filterText: {
    color: "#9CA3AF",
    fontSize: 13,
    fontWeight: "600",
  },
  filterTextActive: {
    color: "#DBEAFE",
  },
  headerRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  loading: {
    color: "#9CA3AF",
    fontSize: 13,
  },
  planStatus: {
    color: "#E5E7EB",
    fontSize: 14,
    fontWeight: "600",
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#2563EB",
    borderRadius: 10,
    justifyContent: "center",
    minHeight: 48,
  },
  primaryButtonText: {
    color: "#EFF6FF",
    fontSize: 16,
    fontWeight: "700",
  },
  progress: {
    color: "#93C5FD",
    fontSize: 13,
    fontWeight: "600",
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: "#1E3A5F",
    borderColor: "#2563EB",
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 44,
  },
  secondaryButtonText: {
    color: "#DBEAFE",
    fontSize: 15,
    fontWeight: "700",
  },
  sectionTitle: {
    borderTopColor: "#1F2937",
    borderTopWidth: 1,
    color: "#93C5FD",
    fontSize: 13,
    fontWeight: "700",
    paddingTop: 12,
    textTransform: "uppercase",
  },
  success: {
    color: "#86EFAC",
    fontSize: 14,
    fontWeight: "600",
  },
});
