"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Building2, Check, LogOut, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NotificationBell } from "@/features/notifications";
import { useActiveOrganization } from "@/features/organization/hooks/use-active-organization";
import { WorkspaceSwitcher } from "@/features/workspace";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

const HIDDEN_PATH_PREFIXES = ["/organizations", "/login"];

function getUserDisplayName(user: ReturnType<typeof useAuth>["user"]): string {
  const metadata = user?.user_metadata as
    | {
        full_name?: string;
        name?: string;
      }
    | undefined;

  return metadata?.full_name ?? metadata?.name ?? user?.email?.split("@")[0] ?? "Usuário";
}

function getUserInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "US";
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function OrganizationSwitcher() {
  const { activeOrganization, organizations, hasMultipleOrganizations, setActiveOrganization } =
    useActiveOrganization();

  if (!activeOrganization) {
    return null;
  }

  const label = activeOrganization.code
    ? `${activeOrganization.name} - ${activeOrganization.code}`
    : activeOrganization.name;

  if (!hasMultipleOrganizations) {
    return (
      <div className="flex min-w-0 max-w-sm items-center gap-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)]/60 px-3 py-1.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[var(--primary)]/15 text-[var(--primary)]">
          <Building2 className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <span className="block text-[10px] font-bold uppercase tracking-widest text-[var(--foreground-muted)]/70">
            EMPRESA
          </span>
          <p className="truncate text-xs font-medium text-[var(--foreground)]" title={label}>
            {label}
          </p>
        </div>
      </div>
    );
  }

  return (
    <Select value={activeOrganization.id} onValueChange={setActiveOrganization}>
      <SelectTrigger
        aria-label="Alterar organização ativa"
        className="h-auto min-h-10 w-full min-w-0 max-w-sm justify-start gap-2.5 rounded-lg border-[var(--border)] bg-[var(--surface-muted)]/60 px-3 py-1.5 text-left shadow-none transition-colors hover:bg-[var(--surface-muted)] sm:w-[22rem]"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[var(--primary)]/15 text-[var(--primary)]">
          <Building2 className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[10px] font-bold uppercase tracking-widest text-[var(--foreground-muted)]/70">
            EMPRESA
          </span>
          <span className="block truncate text-xs font-medium text-[var(--foreground)]">
            <SelectValue placeholder="Selecionar organização" />
          </span>
        </span>
      </SelectTrigger>
      <SelectContent align="start" position="popper">
        {organizations.map((organization) => (
          <SelectItem key={organization.id} value={organization.id}>
            <span className="flex min-w-0 items-center gap-2">
              <span className="truncate">{organization.name}</span>
              {organization.code ? (
                <span className="text-xs text-[var(--foreground-muted)]">{organization.code}</span>
              ) : null}
              {organization.id === activeOrganization.id ? (
                <Check className="ml-auto h-3.5 w-3.5 text-[var(--primary)]" />
              ) : null}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function UserMenu() {
  const { user, signOut } = useAuth();
  const { activeOrganization } = useActiveOrganization();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const displayName = getUserDisplayName(user);
  const initials = getUserInitials(displayName);

  const metadata = user?.user_metadata as Record<string, unknown> | undefined;
  const jobTitle =
    typeof metadata?.job_title === "string" && metadata.job_title.trim().length > 0
      ? metadata.job_title.trim()
      : null;

  async function handleSignOut() {
    setIsSigningOut(true);

    try {
      await signOut();
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label="Abrir menu do perfil"
          className="h-9 gap-2 rounded-full border-[var(--border)] bg-[var(--surface-muted)]/50 px-2 pr-3 hover:bg-[var(--surface-muted)]"
          type="button"
          variant="outline"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--primary)]/15 text-[11px] font-semibold text-[var(--primary)]">
            {initials}
          </span>
          <span className="hidden max-w-36 truncate text-xs font-medium text-[var(--foreground)] lg:inline">
            {displayName}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex flex-col gap-1.5 p-3">
          <div className="flex flex-col">
            <span className="truncate text-sm font-semibold text-[var(--foreground)]">
              {displayName}
            </span>
            {user?.email ? (
              <span className="truncate text-xs font-normal text-[var(--foreground-muted)]">
                {user.email}
              </span>
            ) : null}
          </div>

          {activeOrganization ? (
            <div className="mt-0.5 flex items-center gap-1.5 rounded-md border border-[var(--border)]/60 bg-[var(--surface-muted)] px-2 py-1 text-[11px] text-[var(--foreground-muted)]">
              <Building2 className="h-3 w-3 shrink-0 text-[var(--foreground-muted)]/70" />
              <span
                className="truncate font-medium text-[var(--foreground)]"
                title={activeOrganization.name}
              >
                {activeOrganization.name}
              </span>
            </div>
          ) : null}

          {jobTitle ? (
            <span className="truncate text-[11px] font-normal text-[var(--foreground-muted)]/90">
              {jobTitle}
            </span>
          ) : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile">
            <User className="h-4 w-4" />
            Meu perfil
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={isSigningOut}
          variant="destructive"
          onSelect={(event) => {
            event.preventDefault();
            void handleSignOut();
          }}
        >
          <LogOut className="h-4 w-4" />
          {isSigningOut ? "Saindo..." : "Sair"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppTopbar() {
  const pathname = usePathname();
  const hidden = HIDDEN_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (hidden) {
    return null;
  }

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur">
      <div
        className={cn("flex min-h-14 items-center justify-between gap-3 px-4 py-2 sm:px-6 lg:px-6")}
      >
        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <OrganizationSwitcher />
          <WorkspaceSwitcher />
        </div>
        <div className="flex shrink-0 items-center justify-end gap-2 sm:gap-2.5">
          <NotificationBell />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
