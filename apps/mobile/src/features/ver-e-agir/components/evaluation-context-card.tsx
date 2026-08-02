import { StyleSheet, Text, View } from "react-native";

type EvaluationContextCardProps = {
  conditionDescription: string;
  immediateActionDescription: string | null;
  assignedEvaluatorName: string | null;
};

function ContextField({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value}</Text>
    </View>
  );
}

export function EvaluationContextCard({
  conditionDescription,
  immediateActionDescription,
  assignedEvaluatorName,
}: EvaluationContextCardProps) {
  return (
    <View style={styles.container}>
      <ContextField label="Condição insegura" value={conditionDescription} />
      <ContextField
        label="Ação imediata"
        value={immediateActionDescription?.trim() ? immediateActionDescription : "—"}
      />
      {assignedEvaluatorName ? (
        <ContextField label="Avaliador" value={assignedEvaluatorName} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#1F2937",
    borderColor: "#374151",
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
    padding: 16,
  },
  field: {
    gap: 4,
  },
  fieldLabel: {
    color: "#9CA3AF",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  fieldValue: {
    color: "#F9FAFB",
    fontSize: 15,
    lineHeight: 22,
  },
});
