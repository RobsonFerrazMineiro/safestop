"use client";

import { createContext } from "react";

import type { WorkspaceContextValue } from "../types";

export const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);
