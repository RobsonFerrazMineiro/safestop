import { Suspense } from "react";

import { AwarenessReportPage } from "@/features/reports";
import { ReportPageSkeleton } from "@/features/reports/components/report-states";

export default function AwarenessReportRoutePage() {
  return (
    <Suspense fallback={<ReportPageSkeleton />}>
      <AwarenessReportPage />
    </Suspense>
  );
}
