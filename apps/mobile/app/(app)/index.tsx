import { useRouter } from "expo-router";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/hooks/use-auth";
import { useActiveOrganization } from "@/features/organization/hooks/use-active-organization";
import { authRoutes } from "@/lib/auth/routes";

export default function AuthenticatedHomeScreen() {
  const router = useRouter();
  const { user, signOut, isRefreshing } = useAuth();
  const { activeOrganization, hasMultipleOrganizations } = useActiveOrganization();

  async function handleSignOut() {
    await signOut();
    router.replace(authRoutes.login);
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>SafeStop</Text>
        <Text style={styles.subtitle}>Sessão autenticada</Text>
        <Text style={styles.email}>{user?.email ?? "Usuário autenticado"}</Text>

        {activeOrganization ? (
          <View style={styles.organizationBadge}>
            <Text style={styles.organizationLabel}>Organização ativa</Text>
            <Text style={styles.organizationName}>{activeOrganization.name}</Text>
            {activeOrganization.code ? (
              <Text style={styles.organizationCode}>{activeOrganization.code}</Text>
            ) : null}
          </View>
        ) : null}

        {hasMultipleOrganizations ? (
          <Pressable
            accessibilityLabel="Trocar organização"
            accessibilityRole="button"
            style={({ pressed }) => [styles.switchOrgButton, pressed && styles.buttonPressed]}
            onPress={() => {
              router.push(authRoutes.organizations);
            }}
          >
            <Text style={styles.switchOrgButtonText}>Trocar organização</Text>
          </Pressable>
        ) : null}

        {isRefreshing ? (
          <View style={styles.refreshing}>
            <ActivityIndicator color="#F97316" size="small" />
            <Text style={styles.refreshingText}>Revalidando sessão…</Text>
          </View>
        ) : null}

        <Pressable
          accessibilityLabel="Ocorrências"
          accessibilityRole="button"
          style={({ pressed }) => [styles.occurrencesButton, pressed && styles.buttonPressed]}
          onPress={() => {
            router.push(authRoutes.occurrences);
          }}
        >
          <Text style={styles.occurrencesButtonText}>Ocorrências</Text>
        </Pressable>

        <Pressable
          accessibilityLabel="Meu perfil"
          accessibilityRole="button"
          style={({ pressed }) => [styles.profileButton, pressed && styles.buttonPressed]}
          onPress={() => {
            router.push(authRoutes.profile);
          }}
        >
          <Text style={styles.profileButtonText}>Meu perfil</Text>
        </Pressable>

        <Pressable
          accessibilityLabel="Sair"
          accessibilityRole="button"
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          onPress={() => {
            void handleSignOut();
          }}
        >
          <Text style={styles.buttonText}>Sair</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F1115",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#F97316",
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#F9FAFB",
    textAlign: "center",
  },
  email: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
  },
  organizationBadge: {
    alignItems: "center",
    backgroundColor: "#1F2937",
    borderColor: "#374151",
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    width: "100%",
  },
  organizationLabel: {
    color: "#9CA3AF",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  organizationName: {
    color: "#F9FAFB",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  organizationCode: {
    color: "#6B7280",
    fontSize: 13,
    textAlign: "center",
  },
  switchOrgButton: {
    alignItems: "center",
    backgroundColor: "#374151",
    borderRadius: 8,
    justifyContent: "center",
    marginTop: 4,
    minHeight: 44,
    minWidth: 200,
    paddingHorizontal: 20,
  },
  switchOrgButtonText: {
    color: "#F9FAFB",
    fontSize: 14,
    fontWeight: "600",
  },
  refreshing: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  refreshingText: {
    color: "#9CA3AF",
    fontSize: 13,
  },
  occurrencesButton: {
    alignItems: "center",
    backgroundColor: "#F97316",
    borderRadius: 8,
    justifyContent: "center",
    marginTop: 8,
    minHeight: 48,
    minWidth: 200,
    paddingHorizontal: 24,
  },
  occurrencesButtonText: {
    color: "#0F1115",
    fontSize: 16,
    fontWeight: "700",
  },
  profileButton: {
    alignItems: "center",
    backgroundColor: "#374151",
    borderRadius: 8,
    justifyContent: "center",
    marginTop: 8,
    minHeight: 48,
    minWidth: 160,
    paddingHorizontal: 24,
  },
  profileButtonText: {
    color: "#F9FAFB",
    fontSize: 16,
    fontWeight: "600",
  },
  button: {
    alignItems: "center",
    backgroundColor: "#374151",
    borderRadius: 8,
    justifyContent: "center",
    marginTop: 16,
    minHeight: 48,
    minWidth: 160,
    paddingHorizontal: 24,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    color: "#F9FAFB",
    fontSize: 16,
    fontWeight: "600",
  },
});
