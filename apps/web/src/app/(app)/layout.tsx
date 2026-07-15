import { AuthorizationAppGate } from "@/features/authorization/components/authorization-app-gate";
import { OrganizationAppGate } from "@/features/organization/components/organization-app-gate";
import type { ReactNode } from "react";

type AppLayoutProps = {
  children: ReactNode;
};

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <OrganizationAppGate>
      <AuthorizationAppGate>
        <div className="min-h-screen">{children}</div>
      </AuthorizationAppGate>
    </OrganizationAppGate>
  );
}
