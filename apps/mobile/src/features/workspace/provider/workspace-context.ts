import { createContext } from "react";

import type { WorkspaceContextValue } from "../types";

export const defaultWorkspaceContextValue: WorkspaceContextValue = {
  workspaces: [],
  activeWorkspace: null,
  isLoading: false,
  isReady: false,
  error: null,
  hasMultipleWorkspaces: false,
  setActiveWorkspace: () => undefined,
  refresh: () => undefined,
};

export const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);
