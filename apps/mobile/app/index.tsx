import { Redirect } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { colors } from "@safestop/ui";

import { useAuth } from "@/hooks/use-auth";
import { authRoutes } from "@/lib/auth/routes";

export default function IndexScreen() {
  const { isAuthenticated, isLoading, pendingRedirect } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (isAuthenticated) {
    if (pendingRedirect) {
      return <Redirect href={pendingRedirect} />;
    }

    return <Redirect href={authRoutes.app} />;
  }

  return <Redirect href={authRoutes.login} />;
}

const styles = StyleSheet.create({
  loading: {
    alignItems: "center",
    backgroundColor: "#0F1115",
    flex: 1,
    justifyContent: "center",
  },
});
