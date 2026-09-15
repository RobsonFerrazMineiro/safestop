"use client";

import { useRouter } from "next/navigation";

import { Building2 } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { PageShell } from "@/components/page-shell";

import { OrganizationCard } from "./organization-card";
import { OrganizationLoading } from "./organization-loading";
import { useActiveOrganization } from "../hooks/use-active-organization";
import { useOrganizations } from "../hooks/use-organizations";

export function OrganizationSelector() {
  const router = useRouter();
  const { activeOrganization, setActiveOrganization } = useActiveOrganization();
  const { organizations, isLoading, isError } = useOrganizations();

  if (isLoading) {
    return (
      <PageShell className="gap-6" width="default">
        <PageHeader
          eyebrow="ACESSO ORGANIZACIONAL"
          icon={Building2}
          subtitle="Escolha a organização ativa para continuar no painel."
          title="Selecionar organização"
        />
        <OrganizationLoading />
      </PageShell>
    );
  }

  if (isError) {
    return (
      <PageShell className="gap-6" width="default">
        <PageHeader
          eyebrow="ACESSO ORGANIZACIONAL"
          icon={Building2}
          subtitle="Escolha a organização ativa para continuar no painel."
          title="Selecionar organização"
        />
        <div
          className="rounded-lg border border-status-destructive-border bg-status-destructive-bg/40 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          Não foi possível carregar suas organizações. Tente novamente mais tarde.
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell className="gap-6" width="default">
      <PageHeader
        eyebrow="ACESSO ORGANIZACIONAL"
        icon={Building2}
        subtitle="Escolha a organização ativa para continuar no painel."
        title="Selecionar organização"
      />

      <div className="flex flex-col gap-3">
        {organizations.map((organization) => (
          <OrganizationCard
            isActive={activeOrganization?.id === organization.id}
            key={organization.id}
            onSelect={(organizationId) => {
              setActiveOrganization(organizationId);
              router.push("/");
            }}
            organization={organization}
          />
        ))}
      </div>
    </PageShell>
  );
}
