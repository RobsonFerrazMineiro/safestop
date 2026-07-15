import { StyleSheet, Text, View } from "react-native";

export function OrganizationEmpty() {
  return (
    <View accessibilityRole="text" style={styles.container}>
      <Text style={styles.title}>Nenhuma organização disponível</Text>
      <Text style={styles.text}>
        Você não possui vínculo ativo com nenhuma organização. Entre em contato com o administrador
        da plataforma.
      </Text>
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
    paddingHorizontal: 24,
  },
  title: {
    color: "#F9FAFB",
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  text: {
    color: "#9CA3AF",
    fontSize: 14,
    textAlign: "center",
  },
});
