import { createContext } from "react";
import type { PermissionCode } from "@safestop/types";

import type { EffectiveRole } from "../services/types";

export type AuthorizationContextValue = {
  roles: EffectiveRole[];
  permissions: ReadonlySet<PermissionCode>;
  isPlatformAdmin: boolean;
  isLoading: boolean;
  isReady: boolean;
  isSwitching: boolean;
  error: Error | null;
  hasNoPermissions: boolean;
  can: (code: PermissionCode) => boolean;
  canAny: (codes: PermissionCode[]) => boolean;
  canAll: (codes: PermissionCode[]) => boolean;
  refreshAuthorization: () => Promise<void>;
};

export const AuthorizationContext = createContext<AuthorizationContextValue | null>(null);
