import { AuthorizationAppGate } from "@/features/authorization/components/authorization-app-gate";
import { AppSidebar } from "@/features/navigation";
import { OfflineIndicator } from "@/components/offline-indicator";
import { OrganizationAppGate } from "@/features/organization/components/organization-app-gate";
import type { ReactNode } from "react";

type AppLayoutProps = {
  children: ReactNode;
};

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <OrganizationAppGate>
      <AuthorizationAppGate>
        <div className="flex min-h-screen flex-col md:flex-row">
          <AppSidebar />
          <div className="min-h-screen flex-1">
            <OfflineIndicator />
            {children}
          </div>
        </div>
      </AuthorizationAppGate>
    </OrganizationAppGate>
  );
}
