import type { ReactNode } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type PageHeaderProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  backHref?: string;
  backLabel?: string;
  className?: string;
};

export function PageHeader({
  title,
  subtitle,
  actions,
  backHref,
  backLabel = "Voltar",
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn("flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between", className)}
    >
      <div className="flex min-w-0 flex-col gap-2">
        {backHref ? (
          <Button asChild className="h-auto w-fit justify-start px-0" size="sm" variant="link">
            <Link href={backHref}>{backLabel}</Link>
          </Button>
        ) : null}
        <h1 className="text-3xl font-bold text-foreground">{title}</h1>
        {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </header>
  );
}
