"use client";

import { useRouter } from "next/navigation";

import { OrganizationCard } from "./organization-card";
import { OrganizationLoading } from "./organization-loading";
import { useActiveOrganization } from "../hooks/use-active-organization";
import { useOrganizations } from "../hooks/use-organizations";

export function OrganizationSelector() {
  const router = useRouter();
  const { activeOrganization, setActiveOrganization } = useActiveOrganization();
  const { organizations, isLoading, isError } = useOrganizations();

  if (isLoading) {
    return <OrganizationLoading />;
  }

  if (isError) {
    return (
      <div
        className="rounded-lg border border-red-900/60 bg-red-950/40 px-4 py-3 text-sm text-red-200"
        role="alert"
      >
        Não foi possível carregar suas organizações. Tente novamente mais tarde.
      </div>
    );
  }

  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-gray-100">Selecionar organização</h1>
        <p className="text-sm text-gray-400">
          Escolha a organização ativa para continuar no painel.
        </p>
      </header>

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
    </section>
  );
}
