import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { OrganizationProvider } from "@/features/organization/provider/organization-provider";
import { AuthorizationProvider } from "@/features/authorization";
import { WorkspaceProvider } from "@/features/workspace";
import { AuthProvider, QueryProvider } from "@/providers";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryProvider>
        <AuthProvider>
          <OrganizationProvider>
            <WorkspaceProvider>
              <AuthorizationProvider>
                <StatusBar style="light" />
                <Stack screenOptions={{ headerShown: false }} />
              </AuthorizationProvider>
            </WorkspaceProvider>
          </OrganizationProvider>
        </AuthProvider>
      </QueryProvider>
    </SafeAreaProvider>
  );
}
