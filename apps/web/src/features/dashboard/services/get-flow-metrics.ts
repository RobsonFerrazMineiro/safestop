import type { DashboardAccessContext, DashboardPeriodFilter, FlowMetrics } from "@safestop/types";
import {
  canAccessActionPlanMetrics,
  canAccessOccurrenceMetrics,
  computeActionCompletionRateForPeriod,
  computeAvgEvaluationTimeMinutes,
  computeAvgReleaseTimeMinutes,
  countNewOccurrencesInPeriod,
} from "@safestop/types";

import { createClient } from "@/lib/auth/client";

const EMPTY_FLOW: FlowMetrics = {
  newOccurrencesInPeriod: null,
  avgEvaluationTimeMinutes: null,
  avgReleaseTimeMinutes: null,
  actionCompletionRate: null,
};

type OccurrenceFlowRow = {
  created_at: string;
  evaluated_at: string | null;
  stopped_at: string | null;
  released_at: string | null;
};

type ActionItemFlowRow = {
  status: string;
  completed_at: string | null;
  updated_at: string;
};

export async function getFlowMetrics(
  organizationId: string,
  access: DashboardAccessContext,
  period: DashboardPeriodFilter | null | undefined,
): Promise<FlowMetrics> {
  if (!period) {
    return EMPTY_FLOW;
  }

  const canOccurrence = canAccessOccurrenceMetrics(access);
  const canActionPlan = canAccessActionPlanMetrics(access);

  if (!canOccurrence && !canActionPlan) {
    return EMPTY_FLOW;
  }

  const supabase = createClient();

  const [occurrenceResult, actionItemResult] = await Promise.all([
    canOccurrence
      ? supabase
          .from("occurrences")
          .select("created_at, evaluated_at, stopped_at, released_at")
          .eq("organization_id", organizationId)
      : Promise.resolve({ data: [], error: null }),
    canActionPlan
      ? supabase
          .from("action_items")
          .select("status, completed_at, updated_at")
          .eq("organization_id", organizationId)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (occurrenceResult.error || actionItemResult.error) {
    throw new Error("Não foi possível carregar métricas de fluxo.");
  }

  const occurrenceRows = (occurrenceResult.data ?? []) as OccurrenceFlowRow[];
  const actionItemRows = (actionItemResult.data ?? []) as ActionItemFlowRow[];

  return {
    newOccurrencesInPeriod: canOccurrence
      ? countNewOccurrencesInPeriod(
          occurrenceRows.map((row) => ({ createdAt: row.created_at })),
          period,
        )
      : null,
    avgEvaluationTimeMinutes: canOccurrence
      ? computeAvgEvaluationTimeMinutes(
          occurrenceRows.map((row) => ({
            createdAt: row.created_at,
            evaluatedAt: row.evaluated_at,
          })),
          period,
        )
      : null,
    avgReleaseTimeMinutes: canOccurrence
      ? computeAvgReleaseTimeMinutes(
          occurrenceRows.map((row) => ({
            createdAt: row.created_at,
            stoppedAt: row.stopped_at,
            releasedAt: row.released_at,
          })),
          period,
        )
      : null,
    actionCompletionRate: canActionPlan
      ? computeActionCompletionRateForPeriod(
          actionItemRows.map((row) => ({
            status: row.status as Parameters<
              typeof computeActionCompletionRateForPeriod
            >[0][number]["status"],
            completedAt: row.completed_at,
            updatedAt: row.updated_at,
          })),
          period,
        )
      : null,
  };
}
