"use client";

import { useContext } from "react";

import { WorkspaceContext } from "../provider/workspace-context";
import type { WorkspaceContextValue } from "../types";

export function useActiveWorkspace(): WorkspaceContextValue {
  const context = useContext(WorkspaceContext);

  if (!context) {
    throw new Error("useActiveWorkspace deve ser usado dentro de WorkspaceProvider.");
  }

  return context;
}
