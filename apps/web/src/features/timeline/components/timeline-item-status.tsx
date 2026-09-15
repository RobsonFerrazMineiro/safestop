import type { OccurrenceTimelineItem } from "@safestop/types";

import { getTimelineItemTitle } from "../services/map-timeline-item";

type TimelineItemStatusProps = {
  item: OccurrenceTimelineItem;
};

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function TimelineItemStatus({ item }: TimelineItemStatusProps) {
  const title = getTimelineItemTitle(item);
  const isCreate = item.kind === "OCCURRENCE_CREATED";
  const railClass =
    isCreate || item.kind === "STATUS_CHANGED" ? "border-primary" : "border-gray-600";

  return (
    <li className={`flex gap-3 border-l-2 ${railClass} pl-4`}>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <span className="text-sm font-medium text-gray-100">{title}</span>
          <time className="shrink-0 text-xs text-gray-500" dateTime={item.occurredAt}>
            {formatDateTime(item.occurredAt)}
          </time>
        </div>
        {item.body ? <p className="text-sm text-gray-300">{item.body}</p> : null}
        {item.actorName ? <span className="text-xs text-gray-500">{item.actorName}</span> : null}
      </div>
    </li>
  );
}
