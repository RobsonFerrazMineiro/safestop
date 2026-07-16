import { StyleSheet, Text, View } from "react-native";

type OccurrenceEmptyProps = {
  title?: string;
  description?: string;
};

export function OccurrenceEmpty({
  title = "Nenhuma ocorrência encontrada",
  description = "As Paralisações Preventivas registradas na organização ativa aparecerão aqui.",
}: OccurrenceEmptyProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    flex: 1,
    gap: 8,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  description: {
    color: "#9CA3AF",
    fontSize: 14,
    textAlign: "center",
  },
  title: {
    color: "#F9FAFB",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
});
