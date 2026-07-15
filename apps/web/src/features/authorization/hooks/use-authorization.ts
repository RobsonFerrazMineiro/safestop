"use client";

import { useContext } from "react";

import { AuthorizationContext } from "../provider/authorization-context";
import type { AuthorizationContextValue } from "../provider/authorization-context";

export function useAuthorization(): AuthorizationContextValue {
  const context = useContext(AuthorizationContext);

  if (!context) {
    throw new Error("useAuthorization deve ser usado dentro de AuthorizationProvider.");
  }

  return context;
}
