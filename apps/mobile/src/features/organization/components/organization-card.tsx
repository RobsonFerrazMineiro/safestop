import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "@safestop/ui";

import { Card } from "@/components/ui";

import type { UserOrganization } from "../types";

type OrganizationCardProps = {
  organization: UserOrganization;
  isSelected: boolean;
  onSelect: (organizationId: string) => void;
};

export function OrganizationCard({ organization, isSelected, onSelect }: OrganizationCardProps) {
  return (
    <Pressable
      accessibilityLabel={`Selecionar ${organization.name}`}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}
      onPress={() => {
        onSelect(organization.id);
      }}
    >
      <Card style={[styles.card, isSelected && styles.cardSelected]}>
        <View style={styles.row}>
          <View style={styles.logoPlaceholder}>
            <Text style={styles.logoText}>{organization.name.slice(0, 1).toUpperCase()}</Text>
          </View>

          <View style={styles.content}>
            <Text style={styles.name}>{organization.name}</Text>
            {organization.code ? <Text style={styles.code}>{organization.code}</Text> : null}
            <Text selectable style={styles.id}>
              {organization.id}
            </Text>
            <Text style={styles.type}>{organization.organizationType}</Text>
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing[4],
  },
  cardSelected: {
    borderColor: colors.primary,
  },
  code: {
    color: colors.foregroundMuted,
    fontSize: typography.caption.fontSize,
  },
  content: {
    flex: 1,
    gap: spacing[1],
  },
  id: {
    color: colors.foregroundMuted,
    fontFamily: "monospace",
    fontSize: typography.caption.fontSize,
  },
  logoPlaceholder: {
    alignItems: "center",
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.badge,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  logoText: {
    color: colors.primary,
    fontSize: typography.cardTitle.fontSize,
    fontWeight: "700",
  },
  name: {
    color: colors.foreground,
    fontSize: typography.body.fontSize,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.85,
  },
  pressable: {
    width: "100%",
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[4],
  },
  type: {
    color: colors.foregroundMuted,
    fontSize: typography.caption.fontSize,
    textTransform: "uppercase",
  },
});
