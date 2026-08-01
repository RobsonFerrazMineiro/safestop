import { StyleSheet, Text, View } from "react-native";

export function PreventiveStopCallout() {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>⚡</Text>
      <Text style={styles.text}>Preenchimento otimizado para menos de 60 segundos</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: "#1E3A8A",
    borderRadius: 12,
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  icon: {
    fontSize: 16,
  },
  text: {
    color: "#DBEAFE",
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
  },
});
