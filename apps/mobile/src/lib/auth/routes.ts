import type { Href } from "expo-router";

export const authRoutes = {
  login: "/(auth)/login" as Href,
  app: "/(app)" as Href,
  profile: "/(app)/profile" as Href,
  organizations: "/(app)/organizations" as Href,
  occurrences: "/(app)/occurrences" as Href,
  occurrenceNew: "/(app)/occurrences/new" as Href,
  forbidden: "/(app)/forbidden" as Href,
  root: "/" as Href,
} as const;

export function occurrenceDetailRoute(occurrenceId: string): Href {
  return `/(app)/occurrences/${occurrenceId}` as Href;
}
