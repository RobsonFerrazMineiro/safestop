import type { Href } from "expo-router";

export const authRoutes = {
  login: "/(auth)/login" as Href,
  app: "/(app)" as Href,
  profile: "/(app)/profile" as Href,
  organizations: "/(app)/organizations" as Href,
  root: "/" as Href,
} as const;
