import type { OccurrenceTimelineItem } from "@safestop/types";

import { TimelineItemComment } from "./timeline-item-comment";
import { TimelineItemEvidence } from "./timeline-item-evidence";
import { TimelineItemStatus } from "./timeline-item-status";

type TimelineItemProps = {
  item: OccurrenceTimelineItem;
  occurrenceId: string;
  organizationId: string;
  occurrenceStatus: string;
};

export function TimelineItem({
  item,
  occurrenceId,
  organizationId,
  occurrenceStatus,
}: TimelineItemProps) {
  if (item.kind === "SYSTEM") {
    return null;
  }

  if (item.kind === "COMMENT_ADDED" || item.kind === "COMMENT_REMOVED") {
    return (
      <TimelineItemComment
        item={item}
        occurrenceId={occurrenceId}
        occurrenceStatus={occurrenceStatus}
        organizationId={organizationId}
      />
    );
  }

  if (item.kind === "EVIDENCE_ADDED" || item.kind === "EVIDENCE_REMOVED") {
    return <TimelineItemEvidence item={item} occurrenceId={occurrenceId} />;
  }

  return <TimelineItemStatus item={item} />;
}
