"use client";

import { useQuery } from "@tanstack/react-query";
import type { PermissionCode } from "@safestop/types";
import { DASHBOARD_STALE_TIME_MS } from "@safestop/types";

import { useAuthorization } from "@/features/authorization";
import { useActiveOrganization } from "@/features/organization/hooks/use-active-organization";

import { dashboardKeys } from "../queries/dashboard-keys";
import { getDashboardKpis } from "../services/get-dashboard-kpis";
import { buildDashboardAccessContext } from "../services/utils/dashboard-access";
import type { DashboardKpiFilters } from "../types";

async function hasOrganizationContactScope(
  organizationId: string,
  organizationMemberId: string,
): Promise<boolean> {
  const { createClient } = await import("@/lib/auth/client");
  const supabase = createClient();

  const { count, error } = await supabase
    .from("organization_contacts")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("organization_member_id", organizationMemberId)
    .eq("is_active", true);

  if (error) {
    throw new Error("Não foi possível verificar escopo operacional.");
  }

  return (count ?? 0) > 0;
}

export function useDashboardKpis(filters: DashboardKpiFilters = {}) {
  const { permissions } = useAuthorization();
  const { activeOrganization } = useActiveOrganization();
  const organizationId = activeOrganization?.id ?? "";
  const recipientMemberId = activeOrganization?.organizationMemberId ?? "";
  const enabled = organizationId.length > 0 && recipientMemberId.length > 0;

  const query = useQuery({
    queryKey: dashboardKeys.kpis(organizationId, filters),
    queryFn: async () => {
      const contactScope = await hasOrganizationContactScope(organizationId, recipientMemberId);

      const access = buildDashboardAccessContext({
        recipientMemberId,
        hasOrganizationContactScope: contactScope,
        permissions: permissions as ReadonlySet<PermissionCode>,
      });

      return getDashboardKpis(organizationId, access, filters);
    },
    enabled,
    staleTime: DASHBOARD_STALE_TIME_MS,
    refetchOnWindowFocus: true,
  });

  return {
    kpis: query.data,
    isLoading: enabled && query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    enabled,
  };
}
