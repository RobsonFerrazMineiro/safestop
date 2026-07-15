import type { PermissionCode } from "@safestop/types";

export type EffectiveRole = {
  id: string;
  name: string;
  isGlobal: boolean;
};

export type AuthorizationSnapshot = {
  roles: EffectiveRole[];
  permissions: PermissionCode[];
  isPlatformAdmin: boolean;
};
