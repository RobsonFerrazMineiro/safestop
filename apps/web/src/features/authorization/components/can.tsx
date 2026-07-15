"use client";

import type { ReactNode } from "react";
import type { PermissionCode } from "@safestop/types";

import { useAuthorization } from "../hooks/use-authorization";

type CanProps = {
  permission: PermissionCode;
  children: ReactNode;
  fallback?: ReactNode;
  mode?: "hide" | "disable";
};

export function Can({ permission, children, fallback = null, mode = "hide" }: CanProps) {
  const { can } = useAuthorization();
  const allowed = can(permission);

  if (allowed) {
    return children;
  }

  if (mode === "disable") {
    return (
      <span aria-disabled="true" className="pointer-events-none opacity-50">
        {children}
      </span>
    );
  }

  return fallback;
}
