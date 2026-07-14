import type { User } from "@supabase/supabase-js";
import type { Href } from "expo-router";

export type AuthState = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isRefreshing: boolean;
  pendingRedirect: Href | null;
};

export type AuthContextValue = AuthState & {
  signIn: (credentials: { email: string; password: string }) => Promise<void>;
  signOut: () => Promise<void>;
  setPendingRedirect: (href: Href | null) => void;
  consumePendingRedirect: () => Href | null;
};

export type SignInCredentials = {
  email: string;
  password: string;
};
