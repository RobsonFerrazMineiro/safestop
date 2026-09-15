import { useContext } from "react";

import { WorkspaceContext } from "../provider/workspace-context";

export function useActiveWorkspace() {
  const context = useContext(WorkspaceContext);

  if (!context) {
    throw new Error("useActiveWorkspace deve ser usado dentro de WorkspaceProvider.");
  }

  return context;
}
