import { useSegments } from "expo-router";
import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { AuthorizationEmpty } from "./authorization-empty";
import { AuthorizationLoading } from "./authorization-loading";
import { useAuthorization } from "../hooks/use-authorization";

type AuthorizationAppGateProps = {
  children: ReactNode;
};

const EXEMPT_SEGMENTS = new Set(["organizations", "forbidden"]);

export function AuthorizationAppGate({ children }: AuthorizationAppGateProps) {
  const segments = useSegments();
  const currentSegment = segments[1] as string | undefined;
  const isExemptRoute = currentSegment !== undefined && EXEMPT_SEGMENTS.has(currentSegment);

  const { isLoading, isReady, hasNoPermissions, isPlatformAdmin, error } = useAuthorization();

  if (isLoading) {
    return <AuthorizationLoading />;
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Não foi possível carregar suas permissões.</Text>
      </View>
    );
  }

  if (!isExemptRoute && isReady && hasNoPermissions && !isPlatformAdmin) {
    return <AuthorizationEmpty />;
  }

  return children;
}

const styles = StyleSheet.create({
  errorContainer: {
    alignItems: "center",
    backgroundColor: "#0F1115",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  errorText: {
    color: "#9CA3AF",
    fontSize: 14,
    textAlign: "center",
  },
});
