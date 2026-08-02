import { StyleSheet, Text, View } from "react-native";

export function InterdicaoBanner() {
  return (
    <View accessibilityRole="text" style={styles.banner}>
      <Text style={styles.icon}>⚠</Text>
      <Text style={styles.text}>Atividade formalmente interditada</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    alignItems: "center",
    backgroundColor: "#7F1D1D",
    borderColor: "#DC2626",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  icon: {
    color: "#FCA5A5",
    fontSize: 16,
    fontWeight: "700",
  },
  text: {
    color: "#FEE2E2",
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
});
