import { cn } from "@/lib/utils";

import type { UserOrganization } from "../types";

type OrganizationCardProps = {
  organization: UserOrganization;
  isActive?: boolean;
  onSelect: (organizationId: string) => void;
};

export function OrganizationCard({
  organization,
  isActive = false,
  onSelect,
}: OrganizationCardProps) {
  return (
    <button
      aria-pressed={isActive}
      className={cn(
        "flex w-full flex-col gap-2 rounded-lg border px-4 py-4 text-left transition-colors",
        isActive
          ? "border-primary bg-primary/10"
          : "border-border bg-card/60 hover:border-primary/50 hover:bg-accent/40",
      )}
      onClick={() => {
        onSelect(organization.id);
      }}
      type="button"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-semibold text-primary">
          {organization.name.slice(0, 1).toUpperCase()}
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-base font-semibold text-foreground">{organization.name}</span>
          {organization.code ? (
            <span className="text-xs text-muted-foreground">{organization.code}</span>
          ) : null}
          <span className="break-all font-mono text-xs text-muted-foreground">
            {organization.id}
          </span>
        </div>
      </div>
      <span className="text-xs uppercase tracking-wide text-muted-foreground">
        {organization.organizationType}
      </span>
    </button>
  );
}
