import { Suspense } from "react";

import { ActionItemsReportPage } from "@/features/reports";
import { ReportPageSkeleton } from "@/features/reports/components/report-states";

export default function ActionItemsReportRoutePage() {
  return (
    <Suspense fallback={<ReportPageSkeleton />}>
      <ActionItemsReportPage />
    </Suspense>
  );
}
