"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { AuthorizationEmpty } from "./authorization-empty";
import { AuthorizationLoading } from "./authorization-loading";
import { useAuthorization } from "../hooks/use-authorization";

type AuthorizationAppGateProps = {
  children: ReactNode;
};

const ROUTES_WITHOUT_PERMISSION_REQUIREMENT = ["/organizations", "/forbidden"];

export function AuthorizationAppGate({ children }: AuthorizationAppGateProps) {
  const pathname = usePathname();
  const { isLoading, isReady, hasNoPermissions, isPlatformAdmin, error } = useAuthorization();

  const isExemptRoute = ROUTES_WITHOUT_PERMISSION_REQUIREMENT.includes(pathname);

  if (isLoading) {
    return <AuthorizationLoading />;
  }

  if (error) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-base text-gray-400">Não foi possível carregar suas permissões.</p>
      </main>
    );
  }

  if (!isExemptRoute && isReady && hasNoPermissions && !isPlatformAdmin) {
    return <AuthorizationEmpty />;
  }

  return children;
}
