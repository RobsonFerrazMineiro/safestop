import { useLocalSearchParams } from "expo-router";

import { PreventiveStopDetailScreen } from "@/features/stop-work/components/preventive-stop-detail-screen";

export default function StopWorkDetailRoute() {
  const { id, section } = useLocalSearchParams<{ id: string; section?: string }>();

  if (!id || Array.isArray(id)) {
    return null;
  }

  const focusSection = Array.isArray(section) ? section[0] : section;

  return <PreventiveStopDetailScreen focusSection={focusSection} occurrenceId={id} />;
}
