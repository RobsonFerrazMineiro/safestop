import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing, typography } from "@safestop/ui";

import { Button } from "@/components/ui";
import { authRoutes } from "@/lib/auth/routes";

import { useActiveOrganization } from "../hooks/use-active-organization";
import { OrganizationEmpty } from "./organization-empty";
import { OrganizationList } from "./organization-list";
import { OrganizationLoading } from "./organization-loading";

const CONTENT_MAX_WIDTH = 480;

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

        <Button
          accessibilityLabel="Continuar"
          disabled={!selectedOrganizationId || isSubmitting}
          loading={isSubmitting}
          onPress={() => {
            void handleConfirmSelection();
          }}
        >
          Continuar
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    alignSelf: "center",
    gap: spacing[6],
    maxWidth: CONTENT_MAX_WIDTH,
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[4],
    width: "100%",
  },
  header: {
    gap: spacing[2],
  },
  subtitle: {
    color: colors.foregroundMuted,
    fontSize: typography.body.fontSize,
  },
  title: {
    color: colors.foreground,
    fontSize: typography.sectionTitle.fontSize,
    fontWeight: typography.sectionTitle.fontWeight,
  },
});
