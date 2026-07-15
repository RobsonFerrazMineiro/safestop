import { StyleSheet, Text, View } from "react-native";

export function ProfileNotFound() {
  return (
    <View accessibilityRole="text" style={styles.container}>
      <Text style={styles.text}>
        Perfil não encontrado. Entre em contato com o administrador da plataforma.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "rgba(120, 53, 15, 0.3)",
    borderColor: "rgba(120, 53, 15, 0.6)",
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  text: {
    color: "#FDE68A",
    fontSize: 14,
  },
});
