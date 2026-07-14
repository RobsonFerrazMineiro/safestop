import { useRouter } from "expo-router";
import { useEffect } from "react";

import { authRoutes } from "@/lib/auth/routes";

import { useAuth } from "./use-auth";

type AuthGuardRequirement = "authenticated" | "unauthenticated";

export function useAuthGuard(requirement: AuthGuardRequirement): void {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (requirement === "authenticated" && !isAuthenticated) {
      router.replace(authRoutes.login);
      return;
    }

    if (requirement === "unauthenticated" && isAuthenticated) {
      router.replace(authRoutes.app);
    }
  }, [requirement, isAuthenticated, isLoading, router]);
}
