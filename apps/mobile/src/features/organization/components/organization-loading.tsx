import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

export function OrganizationLoading() {
  return (
    <View accessibilityRole="progressbar" style={styles.container}>
      <ActivityIndicator color="#F97316" size="large" />
      <Text style={styles.text}>Carregando organizações...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: "#0F1115",
    flex: 1,
    gap: 12,
    justifyContent: "center",
  },
  text: {
    color: "#D1D5DB",
    fontSize: 16,
  },
});
