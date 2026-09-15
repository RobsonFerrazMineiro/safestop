import { Suspense } from "react";

import { StopWorkListContainer } from "@/features/stop-work/components/stop-work-list-container";
import { StopWorkLoading } from "@/features/stop-work/components/stop-work-states";
import { WorkspaceOperationalGate } from "@/features/workspace";

export default function StopWorkPage() {
  return (
    <WorkspaceOperationalGate>
      <Suspense fallback={<StopWorkLoading />}>
        <StopWorkListContainer />
      </Suspense>
    </WorkspaceOperationalGate>
  );
}
