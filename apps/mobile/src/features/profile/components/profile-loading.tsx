import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

export function ProfileLoading() {
  return (
    <View accessibilityRole="progressbar" style={styles.container}>
      <ActivityIndicator color="#F97316" size="large" />
      <Text style={styles.text}>Carregando perfil...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: 12,
    justifyContent: "center",
    paddingVertical: 32,
  },
  text: {
    color: "#D1D5DB",
    fontSize: 16,
  },
});
