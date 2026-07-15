import { Stack, useSegments } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { AuthorizationAppGate } from "@/features/authorization/components/authorization-app-gate";
import { OrganizationEmpty } from "@/features/organization/components/organization-empty";
import { OrganizationLoading } from "@/features/organization/components/organization-loading";
import { useActiveOrganization } from "@/features/organization/hooks/use-active-organization";
import { useOrganizationGate } from "@/features/organization/hooks/use-organization-gate";
import { useAuth } from "@/hooks/use-auth";
import { useAuthGuard } from "@/hooks/use-auth-guard";

export default function AppLayout() {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { isLoading: isOrgLoading, isReady, hasNoOrganizations } = useActiveOrganization();
  const segments = useSegments();

  const currentSegment = segments[1] as string | undefined;
  const isOrganizationsScreen = currentSegment === "organizations";

  useAuthGuard("authenticated");
  useOrganizationGate({ enabled: !isOrganizationsScreen });

  if (isAuthLoading || (isAuthenticated && isOrgLoading)) {
    return (
      <View style={styles.loading}>
        <OrganizationLoading />
      </View>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (!isOrganizationsScreen && hasNoOrganizations) {
    return (
      <View style={styles.loading}>
        <OrganizationEmpty />
      </View>
    );
  }

  if (!isOrganizationsScreen && !isReady) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#F97316" size="large" />
      </View>
    );
  }

  return (
    <AuthorizationAppGate>
      <Stack screenOptions={{ headerShown: false }} />
    </AuthorizationAppGate>
  );
}

const styles = StyleSheet.create({
  loading: {
    alignItems: "center",
    backgroundColor: "#0F1115",
    flex: 1,
    justifyContent: "center",
  },
});
