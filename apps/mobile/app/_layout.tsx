import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { OrganizationProvider } from "@/features/organization/provider/organization-provider";
import { AuthorizationProvider } from "@/features/authorization";
import { AuthProvider, QueryProvider } from "@/providers";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryProvider>
        <AuthProvider>
          <OrganizationProvider>
            <AuthorizationProvider>
              <StatusBar style="light" />
              <Stack screenOptions={{ headerShown: false }} />
            </AuthorizationProvider>
          </OrganizationProvider>
        </AuthProvider>
      </QueryProvider>
    </SafeAreaProvider>
  );
}
