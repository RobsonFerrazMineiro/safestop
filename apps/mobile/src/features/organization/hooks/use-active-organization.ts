import { useContext } from "react";

import type { OrganizationContextValue } from "../types";
import { OrganizationContext } from "../provider/organization-context";

export function useActiveOrganization(): OrganizationContextValue {
  return useContext(OrganizationContext);
}
