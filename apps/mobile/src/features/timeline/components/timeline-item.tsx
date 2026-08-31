import { Camera, Circle, MessageCircle, Trash2, type LucideIcon } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { OccurrenceStatus, OccurrenceTimelineItem } from "@safestop/types";
import { formatTimelineTitle } from "@safestop/types";
import { colors } from "@safestop/ui";

import { formatOccurrenceDate } from "@/features/occurrences/utils/occurrence-labels";

import {
  canDeleteComment,
  canEditComment,
  getEvidenceAttachmentId,
} from "../utils/timeline-permissions";

const TIMELINE_ICON_SIZE = 14;

type TimelineItemProps = {
  item: OccurrenceTimelineItem;
  occurrenceStatus: OccurrenceStatus;
  currentUserId?: string;
  canCancelOccurrence: boolean;
  onEditComment?: (item: OccurrenceTimelineItem) => void;
  onDeleteComment?: (item: OccurrenceTimelineItem) => void;
  onPreviewEvidence?: (attachmentId: string, item: OccurrenceTimelineItem) => void;
};

function getRailColor(kind: OccurrenceTimelineItem["kind"]): string {
  if (kind === "OCCURRENCE_CREATED" || kind === "STATUS_CHANGED") {
    return colors.primary;
  }

  if (kind === "COMMENT_REMOVED" || kind === "EVIDENCE_REMOVED") {
    return colors.foregroundMuted;
  }

  return colors.border;
}

function getKindIcon(kind: OccurrenceTimelineItem["kind"]): LucideIcon {
  switch (kind) {
    case "COMMENT_ADDED":
      return MessageCircle;
    case "COMMENT_REMOVED":
      return Trash2;
    case "EVIDENCE_ADDED":
    case "EVIDENCE_REMOVED":
      return Camera;
    default:
      return Circle;
  }
}

function getIconColor(kind: OccurrenceTimelineItem["kind"]): string {
  if (kind === "COMMENT_REMOVED" || kind === "EVIDENCE_REMOVED") {
    return colors.foregroundMuted;
  }

  if (kind === "OCCURRENCE_CREATED" || kind === "STATUS_CHANGED") {
    return colors.primary;
  }

  return colors.foregroundMuted;
}

function getDisplayTitle(item: OccurrenceTimelineItem): string {
  if (item.kind === "COMMENT_ADDED") {
    return item.actorName ?? "Usuário";
  }

  if (item.kind === "COMMENT_REMOVED") {
    return "Comentário removido";
  }

  if (item.kind === "EVIDENCE_REMOVED") {
    const fileName = item.metadata.originalFileName;
    return typeof fileName === "string" && fileName.length > 0
      ? `Evidência removida · ${fileName}`
      : "Evidência removida";
  }

  if (item.kind === "EVIDENCE_ADDED") {
    const fileName = item.metadata.originalFileName;
    return typeof fileName === "string" && fileName.length > 0 ? fileName : item.title;
  }

  if (item.kind === "OCCURRENCE_CREATED") {
    return "Paralisação registrada";
  }

  return formatTimelineTitle(item.kind, item.title);
}

export function TimelineItem({
  item,
  occurrenceStatus,
  currentUserId,
  canCancelOccurrence,
  onEditComment,
  onDeleteComment,
  onPreviewEvidence,
}: TimelineItemProps) {
  const isEdited = item.metadata.isEdited === true;
  const isRemoved = item.kind === "COMMENT_REMOVED" || item.metadata.isRemoved === true;
  const showActions =
    item.kind === "COMMENT_ADDED" &&
    !isRemoved &&
    (canEditComment({ item, currentUserId, occurrenceStatus }) ||
      canDeleteComment({ item, currentUserId, canCancelOccurrence, occurrenceStatus }));

  const attachmentId = getEvidenceAttachmentId(item);
  const isEvidencePreviewable = item.kind === "EVIDENCE_ADDED" && attachmentId !== null;

  const timestamp = formatOccurrenceDate(item.occurredAt);
  const meta = `${timestamp}${isEdited ? " (editado)" : ""}`;
  const KindIcon = getKindIcon(item.kind);
  const iconColor = getIconColor(item.kind);

  return (
    <View accessibilityRole="text" style={[styles.row, isRemoved && styles.removedRow]}>
      <View style={[styles.rail, { backgroundColor: getRailColor(item.kind) }]} />
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <KindIcon
            accessible={false}
            color={iconColor}
            size={TIMELINE_ICON_SIZE}
            strokeWidth={2}
            style={styles.icon}
          />
          <Text
            style={[
              styles.title,
              item.kind === "EVIDENCE_REMOVED" && styles.strikethrough,
              isRemoved && styles.mutedTitle,
            ]}
          >
            {getDisplayTitle(item)}
          </Text>
          <Text style={styles.time}>{meta}</Text>
        </View>

        {item.body && item.kind !== "COMMENT_REMOVED" ? (
          <Text selectable style={styles.body}>
            {item.body}
          </Text>
        ) : null}

        {item.actorName && item.kind !== "COMMENT_ADDED" ? (
          <Text style={styles.actor}>{item.actorName}</Text>
        ) : null}

        {isEvidencePreviewable ? (
          <Pressable
            accessibilityLabel={`Evidência ${getDisplayTitle(item)}, tocar para ampliar`}
            accessibilityRole="button"
            onPress={() => {
              if (attachmentId && onPreviewEvidence) {
                onPreviewEvidence(attachmentId, item);
              }
            }}
          >
            <Text style={styles.previewLink}>Ver evidência</Text>
          </Pressable>
        ) : null}

        {showActions ? (
          <View style={styles.actions}>
            {canEditComment({ item, currentUserId, occurrenceStatus }) && onEditComment ? (
              <Pressable
                accessibilityLabel="Editar comentário"
                accessibilityRole="button"
                hitSlop={8}
                onPress={() => {
                  onEditComment(item);
                }}
              >
                <Text style={styles.actionLink}>Editar</Text>
              </Pressable>
            ) : null}

            {canDeleteComment({ item, currentUserId, canCancelOccurrence, occurrenceStatus }) &&
            onDeleteComment ? (
              <Pressable
                accessibilityLabel="Remover comentário"
                accessibilityRole="button"
                hitSlop={8}
                onPress={() => {
                  onDeleteComment(item);
                }}
              >
                <Text style={styles.removeLink}>Remover</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  actionLink: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "600",
    minHeight: 44,
    textAlignVertical: "center",
  },
  actions: {
    flexDirection: "row",
    gap: 16,
    marginTop: 4,
  },
  actor: {
    color: colors.foregroundMuted,
    fontSize: 13,
  },
  body: {
    color: colors.foreground,
    fontSize: 15,
    lineHeight: 22,
  },
  content: {
    flex: 1,
    gap: 6,
  },
  headerRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  icon: {
    marginTop: 2,
  },
  mutedTitle: {
    color: colors.foregroundMuted,
  },
  previewLink: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "600",
    marginTop: 2,
  },
  rail: {
    borderRadius: 999,
    marginTop: 6,
    minHeight: 12,
    width: 4,
  },
  removeLink: {
    color: colors.destructive,
    fontSize: 13,
    fontWeight: "600",
    minHeight: 44,
    textAlignVertical: "center",
  },
  removedRow: {
    opacity: 0.75,
  },
  row: {
    flexDirection: "row",
    gap: 12,
    paddingVertical: 10,
  },
  strikethrough: {
    textDecorationLine: "line-through",
  },
  time: {
    color: colors.foregroundMuted,
    fontSize: 12,
    marginLeft: "auto",
  },
  title: {
    color: colors.foreground,
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
  },
});
