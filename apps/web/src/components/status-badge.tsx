import type { OccurrenceSeverity, OccurrenceStatus } from "@safestop/types";
import { occurrenceSeverityTone, occurrenceStatusTone, type StatusChipFamily } from "@safestop/ui";

import { Badge } from "@/components/ui/badge";
import {
  formatOccurrenceSeverity,
  formatOccurrenceStatus,
} from "@/features/occurrences/utils/format-labels";
import { cn } from "@/lib/utils";

const STATUS_CHIP_CLASSES: Record<StatusChipFamily, string> = {
  success: "border-status-success-border bg-status-success-bg text-status-success-fg",
  warning: "border-status-warning-border bg-status-warning-bg text-status-warning-fg",
  destructive:
    "border-status-destructive-border bg-status-destructive-bg text-status-destructive-fg",
  info: "border-status-info-border bg-status-info-bg text-status-info-fg",
  primary: "border-status-primary-border bg-status-primary-bg text-status-primary-fg",
  muted: "border-status-muted-border bg-status-muted-bg text-status-muted-fg",
};

export type StatusBadgeProps =
  | { status: OccurrenceStatus; severity?: never; className?: string }
  | { severity: OccurrenceSeverity; status?: never; className?: string };

export function StatusBadge(props: StatusBadgeProps) {
  const { family, label, className } =
    "status" in props && props.status !== undefined
      ? {
          family: occurrenceStatusTone[props.status],
          label: formatOccurrenceStatus(props.status),
          className: props.className,
        }
      : {
          family: occurrenceSeverityTone[props.severity],
          label: formatOccurrenceSeverity(props.severity),
          className: props.className,
        };

  return (
    <Badge className={cn("font-medium", STATUS_CHIP_CLASSES[family], className)} variant="outline">
      {label}
    </Badge>
  );
}
