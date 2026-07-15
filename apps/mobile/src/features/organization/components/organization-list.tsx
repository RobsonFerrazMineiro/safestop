import { StyleSheet, View } from "react-native";

import type { UserOrganization } from "../types";
import { OrganizationCard } from "./organization-card";

type OrganizationListProps = {
  organizations: UserOrganization[];
  selectedOrganizationId: string | null;
  onSelect: (organizationId: string) => void;
};

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
    gap: 12,
  },
});
