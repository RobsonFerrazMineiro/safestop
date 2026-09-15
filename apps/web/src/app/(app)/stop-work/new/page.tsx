import { StopWorkCreateContainer } from "@/features/stop-work/components/stop-work-create-container";
import { WorkspaceOperationalGate } from "@/features/workspace";

export default function StopWorkNewPage() {
  return (
    <WorkspaceOperationalGate>
      <StopWorkCreateContainer />
    </WorkspaceOperationalGate>
  );
}
