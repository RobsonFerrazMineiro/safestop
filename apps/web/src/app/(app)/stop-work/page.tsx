import { Suspense } from "react";

import { StopWorkListContainer } from "@/features/stop-work/components/stop-work-list-container";
import { StopWorkLoading } from "@/features/stop-work/components/stop-work-states";

export default function StopWorkPage() {
  return (
    <Suspense fallback={<StopWorkLoading />}>
      <StopWorkListContainer />
    </Suspense>
  );
}
