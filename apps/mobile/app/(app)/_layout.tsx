import { Stack } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { useAuth } from "@/hooks/use-auth";
import { useAuthGuard } from "@/hooks/use-auth-guard";

export default function AppLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  useAuthGuard("authenticated");

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#F97316" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

const styles = StyleSheet.create({
  loading: {
    alignItems: "center",
    backgroundColor: "#0F1115",
    flex: 1,
    justifyContent: "center",
  },
});
