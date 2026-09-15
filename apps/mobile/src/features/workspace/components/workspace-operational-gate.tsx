import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, spacing, typography } from "@safestop/ui";

import { Button } from "@/components/ui";
import { OccurrenceLoading } from "@/features/occurrences/components/occurrence-loading";

import { WorkspaceSwitcher } from "./workspace-switcher";
import { useActiveWorkspace } from "../hooks/use-active-workspace";

type WorkspaceOperationalGateProps = {
  children: ReactNode;
};

/**
 * Bloqueia somente features Workspace-scoped.
 * Não impede Perfil, Organizations nem Notifications.
 */
export function WorkspaceOperationalGate({ children }: WorkspaceOperationalGateProps) {
  const { activeWorkspace, isLoading, workspaces, hasMultipleWorkspaces, error, refresh } =
    useActiveWorkspace();

  if (isLoading) {
    return <OccurrenceLoading />;
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text accessibilityRole="header" style={styles.title}>
          Não foi possível carregar os Ambientes
        </Text>
        <Text style={styles.subtitle}>{error.message}</Text>
        <Button
          accessibilityLabel="Tentar novamente"
          onPress={() => {
            refresh();
          }}
        >
          Tentar novamente
        </Button>
      </View>
    );
  }

  if (workspaces.length === 0) {
    return (
      <View style={styles.container}>
        <Text accessibilityRole="header" style={styles.title}>
          Sem Ambiente acessível
        </Text>
        <Text style={styles.subtitle}>Você não possui acesso a nenhum Ambiente nesta empresa.</Text>
      </View>
    );
  }

  if (!activeWorkspace) {
    return (
      <View style={styles.container}>
        <Text accessibilityRole="header" style={styles.title}>
          Selecione um Ambiente
        </Text>
        <Text style={styles.subtitle}>
          {hasMultipleWorkspaces
            ? "Escolha um Ambiente para continuar com a lista e o registro operacional."
            : "Aguardando definição do Ambiente ativo."}
        </Text>
        <WorkspaceSwitcher />
      </View>
    );
  }

  return children;
}

const styles = StyleSheet.create({
  container: {
    alignSelf: "stretch",
    backgroundColor: colors.background,
    flex: 1,
    gap: spacing[4],
    justifyContent: "center",
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[4],
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
