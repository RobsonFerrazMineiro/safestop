"use client";

import { useState } from "react";
import { ClipboardList } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { PageShell } from "@/components/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRequirePermission } from "@/features/authorization";
import { useAuthorization } from "@/features/authorization";
import { useActiveOrganization } from "@/features/organization/hooks/use-active-organization";
import { formatWorkspaceContractLabel } from "@/features/occurrences/services/get-workspace-contracts";

import {
  useAssignableMembers,
  useContractAssignments,
  useCreateContractAssignment,
  useRevokeContractAssignment,
  useWorkspaceContractsForAssignments,
} from "../hooks/use-contract-assignments";
import { canEditContractAssignment } from "../utils/assignment-rules";
import { ContractAssignmentAddForm } from "./contract-assignment-add-form";
import { ContractAssignmentsTable } from "./contract-assignments-table";
import {
  ContractAssignmentsEmpty,
  ContractAssignmentsError,
  ContractAssignmentsForbidden,
  ContractAssignmentsLoading,
} from "./contract-assignments-states";

export function ContractAssignmentsContainer() {
  useRequirePermission("organization.manage");

  const { can, isReady: isAuthzReady } = useAuthorization();
  const { activeOrganization } = useActiveOrganization();
  const actingOrganizationId = activeOrganization?.id ?? "";
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);

  const contractsQuery = useWorkspaceContractsForAssignments();
  const assignmentsQuery = useContractAssignments(selectedContractId);
  const membersQuery = useAssignableMembers();
  const createMutation = useCreateContractAssignment(selectedContractId);
  const revokeMutation = useRevokeContractAssignment(selectedContractId);

  if (isAuthzReady && !can("organization.manage")) {
    return <ContractAssignmentsForbidden />;
  }

  const selectedContract = contractsQuery.contracts.find(
    (contract) => contract.id === selectedContractId,
  );

  return (
    <PageShell className="gap-6" width="wide">
      <PageHeader
        eyebrow="GOVERNANÇA DO CONTRATO"
        icon={ClipboardList}
        subtitle="Visualize os responsáveis do contrato neste Ambiente. Você só pode gerir membros da sua EMPRESA."
        title="Responsáveis do contrato"
      />

      <Card className="gap-4 py-4">
        <CardHeader className="px-4">
          <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80">
            Contrato do Ambiente
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4">
          {contractsQuery.isLoading ? (
            <ContractAssignmentsLoading />
          ) : contractsQuery.isError ? (
            <ContractAssignmentsError
              message={
                contractsQuery.error instanceof Error ? contractsQuery.error.message : undefined
              }
              onRetry={() => {
                void contractsQuery.refetch();
              }}
            />
          ) : contractsQuery.contracts.length === 0 ? (
            <ContractAssignmentsEmpty message="Nenhum contrato neste Ambiente." />
          ) : (
            <Select
              value={selectedContractId ?? undefined}
              onValueChange={(value) => {
                setSelectedContractId(value);
                createMutation.reset();
              }}
            >
              <SelectTrigger aria-label="Selecionar contrato" className="w-full max-w-xl">
                <SelectValue placeholder="Selecione um contrato" />
              </SelectTrigger>
              <SelectContent>
                {contractsQuery.contracts.map((contract) => (
                  <SelectItem key={contract.id} value={contract.id}>
                    {formatWorkspaceContractLabel(contract)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>

      {selectedContract ? (
        <>
          <Card className="gap-4 py-4">
            <CardHeader className="px-4">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80">
                Responsáveis no contrato
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4">
              {assignmentsQuery.isLoading ? (
                <ContractAssignmentsLoading />
              ) : assignmentsQuery.isError ? (
                <ContractAssignmentsError
                  message={
                    assignmentsQuery.error instanceof Error
                      ? assignmentsQuery.error.message
                      : undefined
                  }
                  onRetry={() => {
                    void assignmentsQuery.refetch();
                  }}
                />
              ) : assignmentsQuery.assignments.length === 0 ? (
                <ContractAssignmentsEmpty message="Nenhum responsável neste contrato." />
              ) : (
                <ContractAssignmentsTable
                  actingOrganizationId={actingOrganizationId}
                  assignments={assignmentsQuery.assignments}
                  isRevoking={revokeMutation.isRevoking}
                  onRevoke={(assignment) => {
                    if (
                      !canEditContractAssignment({
                        assignmentOrganizationId: assignment.organizationId,
                        actingOrganizationId,
                      })
                    ) {
                      return;
                    }

                    void revokeMutation.revokeAssignment(assignment.id);
                  }}
                />
              )}
              {revokeMutation.error instanceof Error ? (
                <p className="mt-3 text-sm text-destructive">{revokeMutation.error.message}</p>
              ) : null}
            </CardContent>
          </Card>

          <ContractAssignmentAddForm
            errorMessage={
              createMutation.error instanceof Error ? createMutation.error.message : null
            }
            isSubmitting={createMutation.isCreating}
            members={membersQuery.members}
            membersErrorMessage={
              membersQuery.isError
                ? membersQuery.error instanceof Error
                  ? membersQuery.error.message
                  : "Não foi possível carregar os membros atribuíveis."
                : null
            }
            onSubmit={async (input) => {
              await createMutation.createAssignment(input);
            }}
          />
        </>
      ) : null}
    </PageShell>
  );
}
