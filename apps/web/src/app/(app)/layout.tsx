import { OrganizationAppGate } from "@/features/organization/components/organization-app-gate";
import type { ReactNode } from "react";

type AppLayoutProps = {
  children: ReactNode;
};

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <OrganizationAppGate>
      <div className="min-h-screen">{children}</div>
    </OrganizationAppGate>
  );
}
