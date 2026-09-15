import type { ElementType, ReactNode } from "react";
import { Filter } from "lucide-react";

import { cn } from "@/lib/utils";

export type FilterShellProps = {
  title?: string;
  meta?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  as?: ElementType;
};

export type FilterFieldProps = {
  label: ReactNode;
  children: ReactNode;
  className?: string;
  htmlFor?: string;
};

export function FilterField({ label, children, className, htmlFor }: FilterFieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {typeof label === "string" ? (
        <label className="text-xs font-medium text-muted-foreground" htmlFor={htmlFor}>
          {label}
        </label>
      ) : (
        label
      )}
      {children}
    </div>
  );
}

export function FilterShell({
  title,
  meta,
  actions,
  children,
  className,
  contentClassName,
  as: Component = "section",
}: FilterShellProps) {
  const hasHeader = Boolean(title || meta || actions);

  return (
    <Component
      aria-label={title ?? (Component === "section" ? "Filtros e busca" : undefined)}
      className={cn(
        "flex flex-col gap-3 rounded-lg border border-border bg-card/60 p-4 shadow-sm",
        className,
      )}
    >
      {hasHeader ? (
        <div className="flex flex-col gap-2 border-b border-border/50 pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Filter aria-hidden="true" className="size-3.5 shrink-0 text-muted-foreground/80" />
            {title ? (
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80">
                {title}
              </span>
            ) : null}
            {meta ? (
              <div className="flex items-center text-xs text-muted-foreground">{meta}</div>
            ) : null}
          </div>
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </div>
      ) : null}
      <div className={cn("min-w-0", contentClassName)}>{children}</div>
    </Component>
  );
}
