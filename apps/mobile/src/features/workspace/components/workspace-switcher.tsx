import { Layers } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radiusScale, spacing, typography } from "@safestop/ui";

import { useActiveWorkspace } from "../hooks/use-active-workspace";

const ICON_SIZE = 16;

function formatWorkspaceLabel(name: string, code: string | null): string {
  return code ? `${name} · ${code}` : name;
}

export function WorkspaceSwitcher() {
  const {
    activeWorkspace,
    workspaces,
    hasMultipleWorkspaces,
    setActiveWorkspace,
    isLoading,
    error,
  } = useActiveWorkspace();

  if (isLoading) {
    return (
      <View style={styles.card}>
        <View style={styles.iconWrap}>
          <Layers accessible={false} color={colors.primary} size={ICON_SIZE} strokeWidth={2} />
        </View>
        <View style={styles.textWrap}>
          <Text style={styles.eyebrow}>AMBIENTE</Text>
          <Text style={styles.muted}>Carregando...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.card}>
        <View style={styles.iconWrap}>
          <Layers accessible={false} color={colors.primary} size={ICON_SIZE} strokeWidth={2} />
        </View>
        <View style={styles.textWrap}>
          <Text style={styles.eyebrow}>AMBIENTE</Text>
          <Text style={styles.muted}>Falha ao carregar</Text>
        </View>
      </View>
    );
  }

  if (workspaces.length === 0) {
    return (
      <View style={styles.card}>
        <View style={styles.iconWrap}>
          <Layers accessible={false} color={colors.primary} size={ICON_SIZE} strokeWidth={2} />
        </View>
        <View style={styles.textWrap}>
          <Text style={styles.eyebrow}>AMBIENTE</Text>
          <Text style={styles.muted}>Nenhum Ambiente</Text>
        </View>
      </View>
    );
  }

  if (!hasMultipleWorkspaces && activeWorkspace) {
    return (
      <View style={styles.card}>
        <View style={styles.iconWrap}>
          <Layers accessible={false} color={colors.primary} size={ICON_SIZE} strokeWidth={2} />
        </View>
        <View style={styles.textWrap}>
          <Text style={styles.eyebrow}>AMBIENTE</Text>
          <Text numberOfLines={1} style={styles.value}>
            {formatWorkspaceLabel(activeWorkspace.name, activeWorkspace.code)}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.selector}>
      <Text style={styles.eyebrow}>AMBIENTE</Text>
      <View style={styles.options}>
        {workspaces.map((workspace) => {
          const selected = workspace.id === activeWorkspace?.id;

          return (
            <Pressable
              key={workspace.id}
              accessibilityLabel={`Selecionar Ambiente ${workspace.name}`}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              style={({ pressed }) => [
                styles.option,
                selected && styles.optionSelected,
                pressed && styles.pressed,
              ]}
              onPress={() => {
                setActiveWorkspace(workspace.id);
              }}
            >
              <Text
                numberOfLines={1}
                style={[styles.optionText, selected && styles.optionTextSelected]}
              >
                {formatWorkspaceLabel(workspace.name, workspace.code)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    alignSelf: "stretch",
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radiusScale.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing[2],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  eyebrow: {
    color: colors.foregroundMuted,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  iconWrap: {
    alignItems: "center",
    backgroundColor: colors.surfaceElevated,
    borderRadius: radiusScale.sm,
    height: 32,
    justifyContent: "center",
    width: 32,
  },
  muted: {
    color: colors.foregroundMuted,
    fontSize: typography.caption.fontSize,
    fontWeight: "500",
  },
  option: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radiusScale.sm,
    borderWidth: 1,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  optionSelected: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.primary,
  },
  optionText: {
    color: colors.foreground,
    fontSize: typography.caption.fontSize,
    fontWeight: "500",
  },
  optionTextSelected: {
    color: colors.primary,
    fontWeight: "700",
  },
  options: {
    gap: spacing[2],
  },
  pressed: {
    opacity: 0.85,
  },
  selector: {
    alignSelf: "stretch",
    gap: spacing[2],
  },
  textWrap: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  value: {
    color: colors.foreground,
    fontSize: typography.caption.fontSize,
    fontWeight: "600",
  },
});
