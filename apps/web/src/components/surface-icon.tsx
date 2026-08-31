import type { ComponentType } from "react";

import { cn } from "@/lib/utils";

export type SurfaceIconVariant = "page" | "kpi" | "chart" | "empty" | "action";

type SurfaceIconProps = {
  icon: ComponentType<{ className?: string }>;
  variant: SurfaceIconVariant;
  className?: string;
};

const ICON_SIZE_CLASS: Record<SurfaceIconVariant, string> = {
  page: "h-6 w-6",
  kpi: "h-5 w-5",
  chart: "h-4 w-4",
  empty: "h-8 w-8",
  action: "h-4 w-4",
};

export function SurfaceIcon({ icon: Icon, variant, className }: SurfaceIconProps) {
  return (
    <Icon aria-hidden="true" className={cn("shrink-0", ICON_SIZE_CLASS[variant], className)} />
  );
}
