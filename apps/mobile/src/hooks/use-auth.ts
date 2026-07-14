import { useContext } from "react";

import type { AuthContextValue } from "@/lib/auth/types";
import { AuthContext } from "@/providers/auth-context";

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider.");
  }

  return context;
}
