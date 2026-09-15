import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

import { cn } from "@/lib/utils";

export type PageShellWidth = "default" | "wide" | "full";

export type PageShellProps<T extends ElementType = "main"> = {
  as?: T;
  width?: PageShellWidth;
  className?: string;
  children?: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "width" | "className" | "children">;

const WIDTH_CLASSES: Record<PageShellWidth, string> = {
  default: "max-w-5xl mx-auto",
  wide: "max-w-7xl mx-auto",
  full: "w-full",
};

export function PageShell<T extends ElementType = "main">({
  as,
  width = "default",
  className,
  children,
  ...props
}: PageShellProps<T>) {
  const Component = as ?? "main";

  return (
    <Component
      className={cn(
        "flex w-full min-w-0 flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10",
        WIDTH_CLASSES[width],
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  );
}
