import { StyleSheet, Text, View } from "react-native";

type ProfileErrorProps = {
  message?: string;
};

export function ProfileError({ message }: ProfileErrorProps) {
  return (
    <View accessibilityRole="alert" style={styles.container}>
      <Text style={styles.text}>
        {message ?? "Não foi possível carregar o perfil. Tente novamente mais tarde."}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "rgba(127, 29, 29, 0.4)",
    borderColor: "rgba(127, 29, 29, 0.6)",
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  text: {
    color: "#FECACA",
    fontSize: 14,
  },
});
