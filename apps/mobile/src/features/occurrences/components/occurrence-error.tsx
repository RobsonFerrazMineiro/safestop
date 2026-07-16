import { StyleSheet, Text, View } from "react-native";

type OccurrenceErrorProps = {
  message?: string;
};

export function OccurrenceError({
  message = "Não foi possível carregar as ocorrências.",
}: OccurrenceErrorProps) {
  return (
    <View accessibilityRole="alert" style={styles.container}>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  message: {
    color: "#F87171",
    fontSize: 14,
    textAlign: "center",
  },
});
