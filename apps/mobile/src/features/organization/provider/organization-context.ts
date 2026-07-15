import { createContext } from "react";

import type { OrganizationContextValue } from "../types";

export const defaultOrganizationContextValue: OrganizationContextValue = {
  organizations: [],
  activeOrganization: null,
  isLoading: false,
  isReady: false,
  hasMultipleOrganizations: false,
  hasNoOrganizations: false,
  setActiveOrganization: async () => undefined,
  refetchOrganizations: async () => undefined,
};

export const OrganizationContext = createContext<OrganizationContextValue>(
  defaultOrganizationContextValue,
);
