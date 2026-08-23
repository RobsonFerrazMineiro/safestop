import { Suspense } from "react";

import { OccurrencesReportPage } from "@/features/reports";
import { ReportPageSkeleton } from "@/features/reports/components/report-states";

export default function OccurrencesReportRoutePage() {
  return (
    <Suspense fallback={<ReportPageSkeleton />}>
      <OccurrencesReportPage />
    </Suspense>
  );
}
