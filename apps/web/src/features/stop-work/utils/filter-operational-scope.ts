import type { OrganizationContactScopeRow } from "@safestop/types";
import { isOccurrenceInAnyContactScope, isOccurrenceStatus } from "@safestop/types";

export type OccurrenceScopeListRow = {
  id: string;
  status: string;
  areaId: string;
  unitId: string | null;
  contractId: string | null;
  managementDepartmentId: string | null;
};

export function filterOccurrencesByOperationalScope<T extends OccurrenceScopeListRow>(
  rows: T[],
  contacts: OrganizationContactScopeRow[],
): T[] {
  if (contacts.length === 0) {
    return [];
  }

  return rows.filter((row) => {
    if (!isOccurrenceStatus(row.status)) {
      return false;
    }

    return isOccurrenceInAnyContactScope(
      {
        areaId: row.areaId,
        unitId: row.unitId,
        contractId: row.contractId,
        managementDepartmentId: row.managementDepartmentId,
      },
      contacts,
    );
  });
}
