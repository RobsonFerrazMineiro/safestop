import type { OccurrenceSummary } from "@safestop/types";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { occurrenceDetailRoute } from "@/lib/auth/routes";

import {
  formatOccurrenceDate,
  getOccurrenceSeverityLabel,
  getOccurrenceStatusLabel,
} from "../utils/occurrence-labels";

type OccurrenceCardProps = {
  occurrence: OccurrenceSummary;
};

export function OccurrenceCard({ occurrence }: OccurrenceCardProps) {
  const router = useRouter();

  return (
    <Pressable
      accessibilityLabel={`Ocorrência ${occurrence.publicCode}`}
      accessibilityRole="button"
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => {
        router.push(occurrenceDetailRoute(occurrence.id));
      }}
    >
      <View style={styles.header}>
        <Text style={styles.code}>{occurrence.publicCode}</Text>
        <Text style={styles.severity}>{getOccurrenceSeverityLabel(occurrence.severity)}</Text>
      </View>

      <Text style={styles.title}>{occurrence.title}</Text>

      <Text style={styles.meta}>
        {getOccurrenceStatusLabel(occurrence.status)}
        {occurrence.areaName ? ` · ${occurrence.areaName}` : ""}
      </Text>

      <Text style={styles.date}>{formatOccurrenceDate(occurrence.createdAt)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#1F2937",
    borderColor: "#374151",
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    padding: 16,
  },
  cardPressed: {
    opacity: 0.85,
  },
  code: {
    color: "#F97316",
    fontFamily: "monospace",
    fontSize: 13,
    fontWeight: "700",
  },
  date: {
    color: "#6B7280",
    fontSize: 12,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  meta: {
    color: "#9CA3AF",
    fontSize: 13,
  },
  severity: {
    color: "#FBBF24",
    fontSize: 12,
    fontWeight: "600",
  },
  title: {
    color: "#F9FAFB",
    fontSize: 16,
    fontWeight: "600",
  },
});
