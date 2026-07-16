import { useLocalSearchParams } from "expo-router";

import { OccurrenceDetailsScreen } from "@/features/occurrences/components/occurrence-details-screen";

export default function OccurrenceDetailsRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();

  if (!id || Array.isArray(id)) {
    return null;
  }

  return <OccurrenceDetailsScreen occurrenceId={id} />;
}
