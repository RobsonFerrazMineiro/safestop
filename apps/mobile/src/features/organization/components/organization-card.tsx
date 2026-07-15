import { Pressable, StyleSheet, Text, View } from "react-native";

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
      style={({ pressed }) => [
        styles.card,
        isSelected && styles.cardSelected,
        pressed && styles.cardPressed,
      ]}
      onPress={() => {
        onSelect(organization.id);
      }}
    >
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
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    backgroundColor: "#1F2937",
    borderColor: "#374151",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 16,
    padding: 16,
  },
  cardSelected: {
    borderColor: "#F97316",
  },
  cardPressed: {
    opacity: 0.85,
  },
  logoPlaceholder: {
    alignItems: "center",
    backgroundColor: "#374151",
    borderRadius: 24,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  logoText: {
    color: "#F97316",
    fontSize: 20,
    fontWeight: "700",
  },
  content: {
    flex: 1,
    gap: 4,
  },
  name: {
    color: "#F9FAFB",
    fontSize: 16,
    fontWeight: "700",
  },
  code: {
    color: "#9CA3AF",
    fontSize: 13,
  },
  id: {
    color: "#6B7280",
    fontFamily: "monospace",
    fontSize: 11,
  },
  type: {
    color: "#6B7280",
    fontSize: 12,
    textTransform: "uppercase",
  },
});
