import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, controlHeight, radius, spacing, typography } from "@safestop/ui";

import { useOccurrenceParticipants } from "../hooks/use-occurrence-participants";
import { getParticipantTypeLabel } from "../services/get-occurrence-participants";

const COLLAPSE_THRESHOLD = 3;

type OccurrenceParticipantsSectionProps = {
  occurrenceId: string;
};

export function OccurrenceParticipantsSection({
  occurrenceId,
}: OccurrenceParticipantsSectionProps) {
  const { participants, isLoading, isError } = useOccurrenceParticipants(occurrenceId);
  const [isExpanded, setIsExpanded] = useState(false);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>
          Quem está envolvido
        </Text>
        <ActivityIndicator color={colors.primary} size="small" />
      </View>
    );
  }

  if (isError || participants.length === 0) {
    return null;
  }

  const shouldCollapse = participants.length > COLLAPSE_THRESHOLD;
  const visibleParticipants =
    shouldCollapse && !isExpanded ? participants.slice(0, COLLAPSE_THRESHOLD) : participants;
  const hiddenCount = participants.length - COLLAPSE_THRESHOLD;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>
          Quem está envolvido
        </Text>
        <Text style={styles.counter}>{participants.length}</Text>
      </View>

      <View style={styles.list}>
        {visibleParticipants.map((participant) => (
          <View key={participant.id} style={styles.row}>
            <View style={styles.dot} />
            <Text style={styles.label}>
              {getParticipantTypeLabel(participant.participantType)}
              {" — "}
              <Text style={styles.name}>{participant.memberName ?? "—"}</Text>
            </Text>
          </View>
        ))}
      </View>

      {shouldCollapse ? (
        <Pressable
          accessibilityLabel={
            isExpanded ? "Mostrar menos participantes" : `Mostrar mais ${hiddenCount} participantes`
          }
          accessibilityRole="button"
          accessibilityState={{ expanded: isExpanded }}
          style={({ pressed }) => [styles.toggleHit, pressed && styles.pressed]}
          onPress={() => {
            setIsExpanded((current) => !current);
          }}
        >
          <Text style={styles.toggle}>
            {isExpanded ? "Mostrar menos" : `Mostrar mais (${hiddenCount})`}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[2],
  },
  counter: {
    color: colors.foregroundMuted,
    fontSize: typography.helper.fontSize,
    fontWeight: "600",
  },
  dot: {
    backgroundColor: colors.primary,
    borderRadius: radius.badge,
    height: 6,
    marginTop: 6,
    width: 6,
  },
  headerRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  label: {
    color: colors.foregroundMuted,
    flex: 1,
    fontSize: typography.helper.fontSize,
    lineHeight: 18,
  },
  list: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: 1,
    gap: spacing[2],
    padding: spacing[3],
  },
  name: {
    color: colors.foreground,
    fontWeight: "600",
  },
  pressed: {
    opacity: 0.85,
  },
  row: {
    flexDirection: "row",
    gap: spacing[2],
  },
  sectionTitle: {
    color: colors.foreground,
    fontSize: typography.label.fontSize,
    fontWeight: "700",
  },
  toggle: {
    color: colors.primary,
    fontSize: typography.helper.fontSize,
    fontWeight: "600",
  },
  toggleHit: {
    justifyContent: "center",
    minHeight: controlHeight.mobile,
  },
});
