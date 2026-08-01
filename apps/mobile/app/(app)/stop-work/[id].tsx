import { useLocalSearchParams } from "expo-router";

import { PreventiveStopDetailScreen } from "@/features/stop-work/components/preventive-stop-detail-screen";

export default function StopWorkDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();

  if (!id || Array.isArray(id)) {
    return null;
  }

  return <PreventiveStopDetailScreen occurrenceId={id} />;
}
