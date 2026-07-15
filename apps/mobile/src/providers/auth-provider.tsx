import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import type { Href } from "expo-router";

import { PROFILE_QUERY_KEY } from "@/features/profile/types";
import { clearActiveOrganizationStorage } from "@/features/organization/services/active-organization-storage";
import { clearTenantCache } from "@/features/organization/services/clear-tenant-cache";
import { ORGANIZATION_QUERY_KEYS } from "@/features/organization/types";
import * as authService from "@/lib/auth/auth.service";
import { getSupabaseClient } from "@/lib/auth/client";
import {
  recoverSessionOnForeground,
  subscribeToAppStateRecovery,
} from "@/lib/auth/session-recovery";
import type { AuthContextValue, SignInCredentials } from "@/lib/auth/types";

import { AuthContext } from "./auth-context";

type AuthProviderProps = {
  children: ReactNode;
};

type InternalAuthState = {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isRefreshing: boolean;
  pendingRedirect: Href | null;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<InternalAuthState>({
    session: null,
    user: null,
    isLoading: true,
    isRefreshing: false,
    pendingRedirect: null,
  });

  const pendingRedirectRef = useRef<Href | null>(null);

  const setPendingRedirect = useCallback((href: Href | null) => {
    pendingRedirectRef.current = href;
    setState((current) => ({ ...current, pendingRedirect: href }));
  }, []);

  const consumePendingRedirect = useCallback(() => {
    const redirect = pendingRedirectRef.current;
    pendingRedirectRef.current = null;
    setState((current) => ({ ...current, pendingRedirect: null }));
    return redirect;
  }, []);

  const handleInvalidSession = useCallback(async () => {
    const userId = state.user?.id;
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();

    if (userId) {
      queryClient.removeQueries({ queryKey: [PROFILE_QUERY_KEY, userId] });
      queryClient.removeQueries({ queryKey: ORGANIZATION_QUERY_KEYS.list(userId) });
      await clearActiveOrganizationStorage(userId);
    } else {
      queryClient.removeQueries({ queryKey: [PROFILE_QUERY_KEY] });
      queryClient.removeQueries({ queryKey: ["organizations"] });
    }

    clearTenantCache(queryClient);

    setState((current) => ({
      ...current,
      session: null,
      user: null,
      isLoading: false,
      isRefreshing: false,
      pendingRedirect: null,
    }));

    pendingRedirectRef.current = null;
  }, [queryClient, state.user?.id]);

  const signIn = useCallback(async (credentials: SignInCredentials) => {
    await authService.signInWithPassword(credentials);
  }, []);

  const signOut = useCallback(async () => {
    const userId = state.user?.id;

    await authService.signOut();

    if (userId) {
      queryClient.removeQueries({ queryKey: [PROFILE_QUERY_KEY, userId] });
      queryClient.removeQueries({ queryKey: ORGANIZATION_QUERY_KEYS.list(userId) });
      await clearActiveOrganizationStorage(userId);
    } else {
      queryClient.removeQueries({ queryKey: [PROFILE_QUERY_KEY] });
      queryClient.removeQueries({ queryKey: ["organizations"] });
    }

    clearTenantCache(queryClient);

    setState((current) => ({
      ...current,
      session: null,
      user: null,
      isLoading: false,
      isRefreshing: false,
      pendingRedirect: null,
    }));

    pendingRedirectRef.current = null;
  }, [queryClient, state.user?.id]);

  useEffect(() => {
    let isMounted = true;
    const supabase = getSupabaseClient();

    const initializeSession = async () => {
      try {
        const session = await authService.getSession();

        if (!isMounted) {
          return;
        }

        setState((current) => ({
          ...current,
          session,
          user: session?.user ?? null,
          isLoading: false,
        }));
      } catch {
        if (!isMounted) {
          return;
        }

        setState((current) => ({
          ...current,
          session: null,
          user: null,
          isLoading: false,
        }));
      }
    };

    void initializeSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) {
        return;
      }

      setState((current) => ({
        ...current,
        session,
        user: session?.user ?? null,
        isLoading: false,
      }));
    });

    const unsubscribeAppState = subscribeToAppStateRecovery(async () => {
      if (!isMounted) {
        return;
      }

      setState((current) => ({ ...current, isRefreshing: true }));

      try {
        await recoverSessionOnForeground(supabase, handleInvalidSession);
      } finally {
        if (isMounted) {
          setState((current) => ({ ...current, isRefreshing: false }));
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      unsubscribeAppState();
    };
  }, [handleInvalidSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: state.user,
      isAuthenticated: state.user !== null,
      isLoading: state.isLoading,
      isRefreshing: state.isRefreshing,
      pendingRedirect: state.pendingRedirect,
      signIn,
      signOut,
      setPendingRedirect,
      consumePendingRedirect,
    }),
    [state, signIn, signOut, setPendingRedirect, consumePendingRedirect],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
