import type { Href } from "expo-router";
import { Redirect, useLocalSearchParams } from "expo-router";

import { stopWorkDetailRoute } from "@/lib/auth/routes";

export default function OccurrenceDetailsRedirectRoute() {
  const { id, section } = useLocalSearchParams<{ id: string; section?: string }>();

  if (!id || Array.isArray(id)) {
    return null;
  }

  const focusSection = Array.isArray(section) ? section[0] : section;

  if (focusSection) {
    const href = `${stopWorkDetailRoute(id)}?section=${encodeURIComponent(focusSection)}` as Href;

    return <Redirect href={href} />;
  }

  return <Redirect href={stopWorkDetailRoute(id)} />;
}
