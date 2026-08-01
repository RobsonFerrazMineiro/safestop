import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getOccurrenceStatusLabel } from "@/features/occurrences/utils/occurrence-labels";

type PreventiveStopSuccessViewProps = {
  publicCode: string;
  onViewDetail: () => void;
  onCreateAnother: () => void;
};

export function PreventiveStopSuccessView({
  publicCode,
  onViewDetail,
  onCreateAnother,
}: PreventiveStopSuccessViewProps) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Text style={styles.icon}>✓</Text>
        </View>

        <Text style={styles.title}>Atividade paralisada</Text>

        <Text style={styles.code}>{publicCode}</Text>

        <View style={styles.badge}>
          <Text style={styles.badgeText}>{getOccurrenceStatusLabel("PARALISACAO_PREVENTIVA")}</Text>
        </View>

        <Text style={styles.body}>A ocorrência foi registrada no servidor.</Text>

        <Pressable
          accessibilityLabel="Ver ocorrência"
          accessibilityRole="button"
          style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
          onPress={onViewDetail}
        >
          <Text style={styles.primaryButtonText}>Ver ocorrência</Text>
        </Pressable>

        <Pressable
          accessibilityLabel="Nova Paralisação"
          accessibilityRole="button"
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
          onPress={onCreateAnother}
        >
          <Text style={styles.secondaryButtonText}>Nova paralisação</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: "#1F2937",
    borderColor: "#374151",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeText: {
    color: "#D1D5DB",
    fontSize: 13,
    fontWeight: "600",
  },
  body: {
    color: "#9CA3AF",
    fontSize: 15,
    textAlign: "center",
  },
  buttonPressed: {
    opacity: 0.85,
  },
  code: {
    color: "#F97316",
    fontFamily: "monospace",
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
  },
  container: {
    backgroundColor: "#0F1115",
    flex: 1,
  },
  content: {
    alignItems: "center",
    flex: 1,
    gap: 16,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  icon: {
    color: "#16A34A",
    fontSize: 36,
    fontWeight: "700",
  },
  iconCircle: {
    alignItems: "center",
    backgroundColor: "#14532D",
    borderRadius: 999,
    height: 72,
    justifyContent: "center",
    width: 72,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#F97316",
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 52,
    width: "100%",
  },
  primaryButtonText: {
    color: "#0F1115",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: "transparent",
    borderColor: "#374151",
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 52,
    width: "100%",
  },
  secondaryButtonText: {
    color: "#F9FAFB",
    fontSize: 16,
    fontWeight: "600",
  },
  title: {
    color: "#F9FAFB",
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
  },
});
