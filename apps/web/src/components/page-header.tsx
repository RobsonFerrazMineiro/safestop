import type { ComponentType, ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SurfaceIcon } from "@/components/surface-icon";
import { cn } from "@/lib/utils";

export type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  backHref?: string;
  backLabel?: string;
  icon?: ComponentType<{ className?: string }>;
  bordered?: boolean;
  className?: string;
};

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
  backHref,
  backLabel = "Voltar",
  icon: Icon,
  bordered = false,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between",
        bordered && "border-b border-border/70 pb-4",
        className,
      )}
    >
      <div className="flex min-w-0 flex-col gap-2">
        {backHref ? (
          <Button
            asChild
            className="h-auto w-fit justify-start px-0 text-muted-foreground hover:text-foreground"
            size="sm"
            variant="link"
          >
            <Link href={backHref}>
              <ArrowLeft />
              {backLabel}
            </Link>
          </Button>
        ) : null}
        <div className="flex items-start gap-3">
          {Icon ? (
            <SurfaceIcon className="mt-1 text-muted-foreground" icon={Icon} variant="page" />
          ) : null}
          <div className="flex min-w-0 flex-col gap-1">
            {eyebrow ? (
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                {eyebrow}
              </span>
            ) : null}
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
            {subtitle ? (
              typeof subtitle === "string" ? (
                <p className="text-sm text-muted-foreground">{subtitle}</p>
              ) : (
                <div className="text-sm text-muted-foreground">{subtitle}</div>
              )
            ) : null}
          </div>
        </div>
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </header>
  );
}
