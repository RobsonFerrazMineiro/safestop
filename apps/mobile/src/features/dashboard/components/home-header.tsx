import { useRouter } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, spacing, typography } from "@safestop/ui";

import { authRoutes } from "@/lib/auth/routes";
import { WorkspaceSwitcher } from "@/features/workspace";

import { DASHBOARD_COPY } from "../utils/dashboard-copy";
import { extractFirstName } from "../utils/extract-first-name";

type HomeHeaderProps = {
  fullName: string | null | undefined;
  jobTitle: string | null | undefined;
  organizationName: string;
  hasMultipleOrganizations: boolean;
};

export function HomeHeader({
  fullName,
  jobTitle,
  organizationName,
  hasMultipleOrganizations,
}: HomeHeaderProps) {
  const router = useRouter();

  const trimmedName = fullName?.trim() ?? "";
  const firstName = trimmedName.length > 0 ? extractFirstName(trimmedName) : "";
  const greeting =
    firstName.length > 0
      ? DASHBOARD_COPY.greetingWithName(firstName)
      : DASHBOARD_COPY.greetingFallback;

  const trimmedJobTitle = jobTitle?.trim() ?? "";
  const showJobTitle = trimmedJobTitle.length > 0;

  return (
    <View style={styles.container}>
      <Text accessibilityRole="header" style={styles.greeting}>
        {greeting}
      </Text>

      {showJobTitle ? (
        <Text numberOfLines={2} style={styles.jobTitle}>
          {trimmedJobTitle}
        </Text>
      ) : null}

      <View style={styles.organizationBlock}>
        <Text style={styles.contextLabel}>EMPRESA</Text>
        <View style={styles.organizationRow}>
          <Text numberOfLines={2} style={styles.organizationName}>
            {organizationName}
          </Text>

          {hasMultipleOrganizations ? (
            <Pressable
              accessibilityLabel="Trocar organização"
              accessibilityRole="button"
              hitSlop={8}
              style={({ pressed }) => [styles.switchButton, pressed && styles.pressed]}
              onPress={() => {
                router.push(authRoutes.organizations);
              }}
            >
              <Text style={styles.switchText}>{DASHBOARD_COPY.switchOrganization}</Text>
              <ChevronRight accessible={false} color={colors.primary} size={16} strokeWidth={2} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <WorkspaceSwitcher />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: "stretch",
    gap: spacing[2],
  },
  contextLabel: {
    color: colors.foregroundMuted,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },
  greeting: {
    color: colors.foreground,
    fontSize: typography.sectionTitle.fontSize,
    fontWeight: typography.sectionTitle.fontWeight,
  },
  jobTitle: {
    color: colors.foregroundMuted,
    fontSize: typography.body.fontSize,
    lineHeight: 20,
  },
  organizationBlock: {
    gap: spacing[1] / 2,
  },
  organizationName: {
    color: colors.foregroundMuted,
    flex: 1,
    fontSize: typography.helper.fontSize,
    lineHeight: 18,
  },
  organizationRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[2],
  },
  pressed: {
    opacity: 0.85,
  },
  switchButton: {
    alignItems: "center",
    flexDirection: "row",
    flexShrink: 0,
    gap: spacing[1] / 2,
    minHeight: 32,
    paddingVertical: spacing[1],
  },
  switchText: {
    color: colors.primary,
    fontSize: typography.helper.fontSize,
    fontWeight: "600",
  },
});
