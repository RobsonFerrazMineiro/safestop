/**
 * Catálogo oficial de permissões (docs/database.md §6.2).
 * Fonte única para PermissionCode — não duplicar nos apps.
 */
export const PERMISSION_CODES = [
  "occurrence.create",
  "occurrence.read",
  "occurrence.evaluate",
  "occurrence.confirm_interdiction",
  "occurrence.validate_correction",
  "occurrence.release",
  "occurrence.cancel",
  "mdho.fill",
  "mdho.submit",
  "mdho.approve",
  "mdho.return",
  "ims_reference.register",
  "ims_reference.update",
  "action_plan.create",
  "action_plan.manage",
  "action_plan.validate",
  "notification.read",
  "notification.confirm_awareness",
  "user.manage",
  "organization.manage",
  "area.manage",
  "contract.manage",
  "settings.manage",
  "report.read",
  "audit.read",
] as const;

export type PermissionCode = (typeof PERMISSION_CODES)[number];

export function isPermissionCode(value: string): value is PermissionCode {
  return (PERMISSION_CODES as readonly string[]).includes(value);
}
