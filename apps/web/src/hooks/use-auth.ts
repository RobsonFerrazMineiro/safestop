"use client";

import { useContext } from "react";

import { AuthContext } from "@/providers/auth-provider";
import type { AuthContextValue } from "@/lib/auth/types";

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider.");
  }

  return context;
}
