import { Redirect } from "expo-router";

import { stopWorkNewRoute } from "@/lib/auth/routes";

export default function NewOccurrenceRedirectRoute() {
  return <Redirect href={stopWorkNewRoute} />;
}
