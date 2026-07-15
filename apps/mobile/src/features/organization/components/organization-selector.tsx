import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { authRoutes } from "@/lib/auth/routes";

import { useActiveOrganization } from "../hooks/use-active-organization";
import { OrganizationEmpty } from "./organization-empty";
import { OrganizationList } from "./organization-list";
import { OrganizationLoading } from "./organization-loading";

export function OrganizationSelectorScreen() {
  const router = useRouter();
  const {
    organizations,
    activeOrganization,
    isLoading,
    hasNoOrganizations,
    setActiveOrganization,
  } = useActiveOrganization();

  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string | null>(
    activeOrganization?.id ?? null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleConfirmSelection() {
    if (!selectedOrganizationId) {
      Alert.alert("Seleção obrigatória", "Escolha uma organização para continuar.");
      return;
    }

    setIsSubmitting(true);

    try {
      await setActiveOrganization(selectedOrganizationId);
      router.replace(authRoutes.app);
    } catch {
      Alert.alert("Erro", "Não foi possível selecionar a organização. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <OrganizationLoading />
      </SafeAreaView>
    );
  }

  if (hasNoOrganizations) {
    return (
      <SafeAreaView style={styles.container}>
        <OrganizationEmpty />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Selecionar organização</Text>
          <Text style={styles.subtitle}>
            Escolha a organização com a qual deseja operar nesta sessão.
          </Text>
        </View>

        <OrganizationList
          organizations={organizations}
          selectedOrganizationId={selectedOrganizationId}
          onSelect={setSelectedOrganizationId}
        />

        <Pressable
          accessibilityLabel="Continuar"
          accessibilityRole="button"
          disabled={!selectedOrganizationId || isSubmitting}
          style={({ pressed }) => [
            styles.button,
            (!selectedOrganizationId || isSubmitting) && styles.buttonDisabled,
            pressed && selectedOrganizationId && !isSubmitting && styles.buttonPressed,
          ]}
          onPress={() => {
            void handleConfirmSelection();
          }}
        >
          <Text style={styles.buttonText}>{isSubmitting ? "Confirmando..." : "Continuar"}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#0F1115",
    flex: 1,
  },
  content: {
    gap: 24,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  header: {
    gap: 8,
  },
  title: {
    color: "#F9FAFB",
    fontSize: 28,
    fontWeight: "700",
  },
  subtitle: {
    color: "#9CA3AF",
    fontSize: 14,
  },
  button: {
    alignItems: "center",
    backgroundColor: "#F97316",
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 48,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    color: "#0F1115",
    fontSize: 16,
    fontWeight: "700",
  },
});
