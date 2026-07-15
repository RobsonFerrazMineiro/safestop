"use client";

import { useQueryClient } from "@tanstack/react-query";
import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import type { User } from "@supabase/supabase-js";

import * as authService from "@/lib/auth/auth.service";
import { createClient } from "@/lib/auth/client";
import type { AuthContextValue } from "@/lib/auth/types";
import { PROFILE_QUERY_KEY } from "@/features/profile/types";
import { clearOrganizationSession } from "@/features/organization/provider/organization-provider";

export const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    void supabase.auth.getUser().then(({ data: { user: currentUser } }) => {
      setUser(currentUser);
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setUser(nextSession?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(
    async (credentials: { email: string; password: string }) => {
      await authService.signInWithPassword(credentials);
      router.refresh();
      router.push("/");
    },
    [router],
  );

  const signOut = useCallback(async () => {
    const userId = user?.id;

    await authService.signOut();

    if (userId) {
      queryClient.removeQueries({ queryKey: [PROFILE_QUERY_KEY, userId] });
    } else {
      queryClient.removeQueries({ queryKey: [PROFILE_QUERY_KEY] });
    }

    clearOrganizationSession(queryClient, userId);

    setUser(null);
    router.refresh();
    router.push("/login");
  }, [queryClient, router, user?.id]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isLoading,
      signIn,
      signOut,
    }),
    [user, isLoading, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
