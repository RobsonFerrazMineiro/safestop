import { StopWorkDetailContainer } from "@/features/stop-work/components/stop-work-detail-container";

/**
 * Detail não usa WorkspaceOperationalGate global: deep link / legado NULL
 * podem precisar resolver Workspace após a occurrence autorizada pelo servidor.
 */
export default function StopWorkDetailPage() {
  return <StopWorkDetailContainer />;
}
