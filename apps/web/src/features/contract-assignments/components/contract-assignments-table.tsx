"use client";

import { Button } from "@/components/ui/button";

import type { ContractAssignment } from "../types";
import { canEditContractAssignment, formatContractAssignmentRole } from "../utils/assignment-rules";

type ContractAssignmentsTableProps = {
  assignments: ContractAssignment[];
  actingOrganizationId: string;
  isRevoking: boolean;
  onRevoke: (assignment: ContractAssignment) => void;
};

export function ContractAssignmentsTable({
  assignments,
  actingOrganizationId,
  isRevoking,
  onRevoke,
}: ContractAssignmentsTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="min-w-full divide-y divide-border text-sm">
        <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-3">Pessoa</th>
            <th className="px-4 py-3">EMPRESA do membro</th>
            <th className="px-4 py-3">Responsabilidade no contrato</th>
            <th className="px-4 py-3">Ativo</th>
            <th className="px-4 py-3">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {assignments.map((assignment) => {
            const canRevoke = canEditContractAssignment({
              assignmentOrganizationId: assignment.organizationId,
              actingOrganizationId,
            });

            return (
              <tr key={assignment.id} className="bg-card">
                <td className="px-4 py-3 text-foreground">{assignment.memberName ?? "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {assignment.organizationName ?? "Outra EMPRESA"}
                </td>
                <td className="px-4 py-3 text-foreground">
                  {formatContractAssignmentRole(assignment.assignmentRole)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full border px-2 py-0.5 text-xs ${
                      assignment.isActive
                        ? "border-status-success-border bg-status-success-bg text-status-success-fg"
                        : "border-status-muted-border bg-status-muted-bg text-status-muted-fg"
                    }`}
                  >
                    {assignment.isActive ? "Ativo" : "Revogado"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {canRevoke && assignment.isActive ? (
                    <Button
                      className="h-auto px-0"
                      disabled={isRevoking}
                      size="sm"
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        onRevoke(assignment);
                      }}
                    >
                      Revogar
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground">Somente leitura</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
