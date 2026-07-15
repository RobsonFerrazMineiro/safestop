import { StyleSheet, Text, View } from "react-native";

import { useAuthorization } from "../hooks/use-authorization";

export function AuthorizationEmpty() {
  const { roles } = useAuthorization();
  const roleNames = roles.map((role) => role.name).join(", ");

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sem permissões operacionais</Text>
      <Text style={styles.description}>
        Você possui vínculo com a organização ativa, mas ainda não tem permissões efetivas
        atribuídas. Entre em contato com o administrador da sua organização.
      </Text>
      {roleNames ? (
        <Text style={styles.roles}>
          Papéis atribuídos: <Text style={styles.rolesHighlight}>{roleNames}</Text>
        </Text>
      ) : null}
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
  description: {
    color: "#9CA3AF",
    fontSize: 14,
    textAlign: "center",
  },
  roles: {
    color: "#6B7280",
    fontSize: 13,
    textAlign: "center",
  },
  rolesHighlight: {
    color: "#D1D5DB",
  },
  title: {
    color: "#F9FAFB",
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
  },
});
