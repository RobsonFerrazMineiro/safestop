import type { DashboardKpiFilters, DashboardKpisRpcPayload } from "@safestop/types";
import {
  buildDashboardKpisRpcArgs,
  isDashboardKpisRpcUnavailableError,
  mapDashboardKpisRpcPayload,
} from "@safestop/types";

import { getSupabaseClient } from "@/lib/auth/client";

export async function fetchDashboardKpisRpc(
  organizationId: string,
  filters: DashboardKpiFilters = {},
): Promise<DashboardKpisRpcPayload | null> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.rpc(
    "get_dashboard_kpis",
    buildDashboardKpisRpcArgs(organizationId, filters),
  );

  if (error) {
    if (isDashboardKpisRpcUnavailableError(error)) {
      return null;
    }

    throw new Error("Não foi possível carregar os indicadores do dashboard.");
  }

  return mapDashboardKpisRpcPayload(data);
}
