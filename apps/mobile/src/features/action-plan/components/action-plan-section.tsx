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
import { colors, spacing, statusChip, typography } from "@safestop/ui";

import { Button } from "@/components/ui";

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
        <ActivityIndicator color={colors.info} />
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
            <Button
              accessibilityRole="button"
              disabled={!isOnline || isCreating}
              loading={isCreating}
              onPress={handleCreatePlan}
            >
              {ACTION_PLAN_COPY.createPlan}
            </Button>
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

      {isItemsLoading ? <ActivityIndicator color={colors.info} /> : null}

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
        <Button
          accessibilityRole="button"
          disabled={!isOnline || isBusy}
          variant="secondary"
          onPress={() => {
            setShowAddForm(true);
          }}
        >
          {ACTION_PLAN_COPY.addAction}
        </Button>
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
        <Button
          accessibilityRole="button"
          disabled={!isOnline || isCompleting}
          loading={isCompleting}
          style={styles.completeButton}
          variant="secondary"
          onPress={handleCompletePlan}
        >
          {ACTION_PLAN_COPY.completePlan}
        </Button>
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
    backgroundColor: statusChip.info.background,
    borderColor: statusChip.info.border,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: spacing[3],
  },
  awaitingText: {
    color: statusChip.info.foreground,
    fontSize: typography.body.fontSize,
    fontWeight: "600",
  },
  completeButton: {
    marginTop: spacing[1],
  },
  completeHint: {
    color: statusChip.info.foreground,
    fontSize: typography.caption.fontSize,
    fontWeight: "600",
  },
  container: {
    gap: spacing[3],
    marginTop: spacing[2],
  },
  emptyBody: {
    color: colors.foregroundMuted,
    fontSize: typography.body.fontSize,
    lineHeight: 20,
  },
  filterChip: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: spacing[2],
  },
  filterChipActive: {
    backgroundColor: statusChip.info.background,
  },
  filterRow: {
    flexDirection: "row",
    gap: spacing[2],
  },
  filterText: {
    color: colors.foregroundMuted,
    fontSize: typography.caption.fontSize,
    fontWeight: "600",
  },
  filterTextActive: {
    color: statusChip.info.foreground,
  },
  headerRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  loading: {
    color: colors.foregroundMuted,
    fontSize: typography.caption.fontSize,
  },
  planStatus: {
    color: colors.foreground,
    fontSize: typography.body.fontSize,
    fontWeight: "600",
  },
  progress: {
    color: statusChip.info.foreground,
    fontSize: typography.caption.fontSize,
    fontWeight: "600",
  },
  sectionTitle: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    color: statusChip.info.foreground,
    fontSize: typography.caption.fontSize,
    fontWeight: "700",
    paddingTop: spacing[3],
    textTransform: "uppercase",
  },
  success: {
    color: statusChip.success.foreground,
    fontSize: typography.body.fontSize,
    fontWeight: "600",
  },
});
