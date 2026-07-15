import type { ReactNode } from "react";
import type { PermissionCode } from "@safestop/types";
import { StyleSheet, View } from "react-native";

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
    return <View style={styles.disabled}>{children}</View>;
  }

  return fallback;
}

const styles = StyleSheet.create({
  disabled: {
    opacity: 0.5,
  },
});
