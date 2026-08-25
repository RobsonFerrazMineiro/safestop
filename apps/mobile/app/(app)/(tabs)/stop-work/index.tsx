import { useLocalSearchParams } from "expo-router";

import { PreventiveStopListScreen } from "@/features/stop-work/components/preventive-stop-list-screen";

export default function StopWorkListRoute() {
  const { dashboardAttention } = useLocalSearchParams<{
    dashboardAttention?: string | string[];
  }>();

  const attentionParam = Array.isArray(dashboardAttention)
    ? dashboardAttention[0]
    : dashboardAttention;

  return <PreventiveStopListScreen dashboardAttention={attentionParam} />;
}
