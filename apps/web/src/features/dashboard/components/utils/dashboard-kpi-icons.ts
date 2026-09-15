import type { ComponentType } from "react";
import {
  AlarmClock,
  Bell,
  CircleCheck,
  ClipboardCheck,
  Clock,
  Hourglass,
  ListChecks,
  ListTodo,
  OctagonAlert,
  ShieldAlert,
  Timer,
  TrendingUp,
} from "lucide-react";
import type { DashboardMetricKey } from "@safestop/types";

export function iconForMetric(key: DashboardMetricKey): ComponentType<{ className?: string }> {
  switch (key) {
    case "myPendingActions":
      return ListTodo;
    case "myOverdueActions":
    case "overdueActionItems":
      return AlarmClock;
    case "myPendingAwareness":
    case "scopedPendingAwareness":
    case "pendingAwarenessOrg":
      return Bell;
    case "scopedOpenOccurrences":
    case "activeOccurrences":
      return OctagonAlert;
    case "pendingEvaluation":
      return Clock;
    case "activeInterdictions":
      return ShieldAlert;
    case "awaitingValidation":
      return Hourglass;
    case "mdhoPendingApproval":
      return ClipboardCheck;
    case "dueSoonActionItems":
    case "myDueSoonActions":
      return Clock;
    case "openActionPlans":
      return ListChecks;
    case "newOccurrencesInPeriod":
      return TrendingUp;
    case "avgEvaluationTimeMinutes":
    case "avgReleaseTimeMinutes":
      return Timer;
    case "actionCompletionRate":
      return CircleCheck;
  }
}
