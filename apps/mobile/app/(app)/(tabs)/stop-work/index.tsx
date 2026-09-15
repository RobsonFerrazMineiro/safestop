import { useLocalSearchParams } from "expo-router";

import { PreventiveStopListScreen } from "@/features/stop-work/components/preventive-stop-list-screen";

export default function StopWorkListRoute() {
  const { dashboardAttention, dashboardAttentionScope } = useLocalSearchParams<{
    dashboardAttention?: string | string[];
    dashboardAttentionScope?: string | string[];
  }>();

  const attentionParam = Array.isArray(dashboardAttention)
    ? dashboardAttention[0]
    : dashboardAttention;

  const attentionScopeParam = Array.isArray(dashboardAttentionScope)
    ? dashboardAttentionScope[0]
    : dashboardAttentionScope;

  return (
    <PreventiveStopListScreen
      dashboardAttention={attentionParam}
      dashboardAttentionScope={attentionScopeParam}
    />
  );
}
