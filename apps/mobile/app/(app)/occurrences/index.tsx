import { Redirect } from "expo-router";

import { stopWorkRoute } from "@/lib/auth/routes";

export default function OccurrencesIndexRedirectRoute() {
  return <Redirect href={stopWorkRoute} />;
}
