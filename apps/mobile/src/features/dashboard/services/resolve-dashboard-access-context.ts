import {
  buildDashboardAccessContext,
  type DashboardAccessContext,
  type PermissionCode,
} from "@safestop/types";

import { hasOrganizationContactScope } from "./has-organization-contact-scope";

export async function resolveDashboardAccessContext(
  organizationId: string,
  recipientMemberId: string,
  permissions: ReadonlySet<PermissionCode>,
): Promise<DashboardAccessContext> {
  const contactScope = await hasOrganizationContactScope(organizationId, recipientMemberId);

  return buildDashboardAccessContext({
    recipientMemberId,
    hasOrganizationContactScope: contactScope,
    permissions,
  });
}
