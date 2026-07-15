"use client";

import { useContext } from "react";

import { OrganizationContext } from "../provider/organization-context";
import type { OrganizationContextValue } from "../types";

export function useActiveOrganization(): OrganizationContextValue {
  const context = useContext(OrganizationContext);

  if (!context) {
    throw new Error("useActiveOrganization deve ser usado dentro de OrganizationProvider.");
  }

  return context;
}
