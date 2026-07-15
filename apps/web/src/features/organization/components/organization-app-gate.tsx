"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";

import { OrganizationEmpty } from "./organization-empty";
import { OrganizationLoading } from "./organization-loading";
import { useActiveOrganization } from "../hooks/use-active-organization";

type OrganizationAppGateProps = {
  children: ReactNode;
};

export function OrganizationAppGate({ children }: OrganizationAppGateProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoading, isReady, hasMultipleOrganizations, organizations } = useActiveOrganization();
  const isOrganizationsRoute = pathname === "/organizations";

  useEffect(() => {
    if (isLoading || isOrganizationsRoute) {
      return;
    }

    if (!isReady && hasMultipleOrganizations) {
      router.replace("/organizations");
    }
  }, [hasMultipleOrganizations, isLoading, isOrganizationsRoute, isReady, router]);

  if (isLoading) {
    return <OrganizationLoading />;
  }

  if (organizations.length === 0) {
    return <OrganizationEmpty />;
  }

  if (!isReady && hasMultipleOrganizations && !isOrganizationsRoute) {
    return <OrganizationLoading />;
  }

  return children;
}
