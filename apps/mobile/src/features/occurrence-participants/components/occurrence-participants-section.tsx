import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

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
        <ActivityIndicator color="#2563EB" size="small" />
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
      <Text accessibilityRole="header" style={styles.sectionTitle}>
        Quem está envolvido
      </Text>

      <View style={styles.list}>
        {visibleParticipants.map((participant) => (
          <View key={participant.id} style={styles.row}>
            <Text style={styles.bullet}>●</Text>
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
  bullet: {
    color: "#2563EB",
    fontSize: 10,
    marginTop: 4,
  },
  container: {
    gap: 8,
  },
  label: {
    color: "#D1D5DB",
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  list: {
    backgroundColor: "#1F2937",
    borderColor: "#374151",
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    padding: 14,
  },
  name: {
    color: "#F9FAFB",
    fontWeight: "600",
  },
  row: {
    flexDirection: "row",
    gap: 8,
  },
  sectionTitle: {
    borderTopColor: "#1F2937",
    borderTopWidth: 1,
    color: "#D1D5DB",
    fontSize: 13,
    fontWeight: "700",
    paddingTop: 12,
    textTransform: "uppercase",
  },
  toggle: {
    color: "#FB923C",
    fontSize: 14,
    fontWeight: "600",
  },
});
