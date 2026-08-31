import type { ComponentType, ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SurfaceIcon } from "@/components/surface-icon";
import { cn } from "@/lib/utils";

export type PageHeaderProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  backHref?: string;
  backLabel?: string;
  icon?: ComponentType<{ className?: string }>;
  className?: string;
};

export function PageHeader({
  title,
  subtitle,
  actions,
  backHref,
  backLabel = "Voltar",
  icon: Icon,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn("flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between", className)}
    >
      <div className="flex min-w-0 flex-col gap-2">
        {backHref ? (
          <Button asChild className="h-auto w-fit justify-start px-0" size="sm" variant="link">
            <Link href={backHref}>
              <ArrowLeft />
              {backLabel}
            </Link>
          </Button>
        ) : null}
        <div className="flex items-start gap-3">
          {Icon ? (
            <SurfaceIcon className="mt-1.5 text-muted-foreground" icon={Icon} variant="page" />
          ) : null}
          <div className="flex min-w-0 flex-col gap-2">
            <h1 className="text-3xl font-bold text-foreground">{title}</h1>
            {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
          </div>
        </div>
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </header>
  );
}
