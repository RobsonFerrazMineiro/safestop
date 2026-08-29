import { StyleSheet, View } from "react-native";
import { spacing } from "@safestop/ui";

import type { UserOrganization } from "../types";
import { OrganizationCard } from "./organization-card";

type OrganizationListProps = {
  organizations: UserOrganization[];
  selectedOrganizationId: string | null;
  onSelect: (organizationId: string) => void;
};

const LIST_MAX_WIDTH = 480;

export function OrganizationList({
  organizations,
  selectedOrganizationId,
  onSelect,
}: OrganizationListProps) {
  return (
    <View style={styles.list}>
      {organizations.map((organization) => (
        <OrganizationCard
          key={organization.id}
          isSelected={selectedOrganizationId === organization.id}
          organization={organization}
          onSelect={onSelect}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    alignSelf: "center",
    gap: spacing[3],
    maxWidth: LIST_MAX_WIDTH,
    width: "100%",
  },
});
