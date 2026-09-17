import { WorkspaceOperationalGate } from "@/features/workspace";
import { ContractAssignmentsContainer } from "@/features/contract-assignments";

export default function ContractAssignmentsPage() {
  return (
    <WorkspaceOperationalGate>
      <ContractAssignmentsContainer />
    </WorkspaceOperationalGate>
  );
}
