import type { ListOperationalOccurrencesResult, OccurrenceListFilters } from "@safestop/types";
import {
  OperationalOccurrenceListRpcError,
  buildListOperationalOccurrencesRpcArgs,
  isOperationalOccurrenceListRpcUnavailableError,
  mapListOperationalOccurrencesResult,
} from "@safestop/types";

import { createClient } from "@/lib/auth/client";

/**
 * Lista operacional padrão (PR-2D / PO-UX-10).
 * Consome somente `list_operational_occurrences`. Sem fallback para PostgREST unbounded.
 */
export async function listOperationalOccurrences(
  organizationId: string,
  filters: OccurrenceListFilters = {},
): Promise<ListOperationalOccurrencesResult> {
  const supabase = createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new OperationalOccurrenceListRpcError({ message: "UNAUTHORIZED" });
  }

  const { data, error } = await supabase.rpc(
    "list_operational_occurrences",
    buildListOperationalOccurrencesRpcArgs(organizationId, filters),
  );

  if (error) {
    if (isOperationalOccurrenceListRpcUnavailableError(error)) {
      throw new OperationalOccurrenceListRpcError(error);
    }

    throw new OperationalOccurrenceListRpcError(error);
  }

  return mapListOperationalOccurrencesResult(data);
}
