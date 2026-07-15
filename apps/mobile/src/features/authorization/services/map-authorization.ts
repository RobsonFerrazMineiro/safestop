import { isPermissionCode, type PermissionCode } from "@safestop/types";

import type { AuthorizationSnapshot, EffectiveRole } from "./types";

type PermissionRow = {
  code: string;
};

type RolePermissionRow = {
  permissions: PermissionRow | PermissionRow[] | null;
};

type RoleRow = {
  id: string;
  name: string;
  organization_id: string | null;
  is_active: boolean;
  role_permissions: RolePermissionRow | RolePermissionRow[] | null;
};

type MemberRoleRow = {
  roles: RoleRow | RoleRow[] | null;
};

function normalizeRolePermissions(
  rolePermissions: RolePermissionRow | RolePermissionRow[] | null,
): PermissionCode[] {
  if (!rolePermissions) {
    return [];
  }

  const rows = Array.isArray(rolePermissions) ? rolePermissions : [rolePermissions];
  const codes: PermissionCode[] = [];

  for (const row of rows) {
    const permissionData = row.permissions;
    const permissions = Array.isArray(permissionData)
      ? permissionData
      : permissionData
        ? [permissionData]
        : [];

    for (const permission of permissions) {
      if (isPermissionCode(permission.code)) {
        codes.push(permission.code);
      }
    }
  }

  return codes;
}

export function mapAuthorizationRows(
  rows: MemberRoleRow[],
  membershipType: string,
): AuthorizationSnapshot {
  const roles: EffectiveRole[] = [];
  const permissionSet = new Set<PermissionCode>();

  for (const row of rows) {
    const roleData = row.roles;
    const role = Array.isArray(roleData) ? roleData[0] : roleData;

    if (!role || !role.is_active) {
      continue;
    }

    roles.push({
      id: role.id,
      name: role.name,
      isGlobal: role.organization_id === null,
    });

    for (const code of normalizeRolePermissions(role.role_permissions)) {
      permissionSet.add(code);
    }
  }

  return {
    roles,
    permissions: [...permissionSet],
    isPlatformAdmin: membershipType === "PLATFORM_ADMIN",
  };
}
