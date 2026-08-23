import { Suspense } from "react";

import { ReportsHubPage } from "@/features/reports";
import { ReportPageSkeleton } from "@/features/reports/components/report-states";

export default function ReportsPage() {
  return (
    <Suspense fallback={<ReportPageSkeleton />}>
      <ReportsHubPage />
    </Suspense>
  );
}
