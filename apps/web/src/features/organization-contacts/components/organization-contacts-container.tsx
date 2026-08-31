"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  OrganizationContactListFilters,
  OrganizationContactTypeExtended,
} from "@safestop/types";
import {
  ORGANIZATION_CONTACT_TYPES,
  ORGANIZATION_CONTACT_TYPE_MANAGING_COMPANY_SUPERVISOR,
} from "@safestop/types";

import { Plus, Users } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { useActiveOrganization } from "@/features/organization/hooks/use-active-organization";

import { OrganizationContactFormDialog } from "./organization-contact-form-dialog";
import { OrganizationContactsTable } from "./organization-contacts-table";
import {
  OrganizationContactsEmptyState,
  OrganizationContactsErrorState,
  OrganizationContactsForbiddenState,
  OrganizationContactsLoadingSkeleton,
} from "./organization-contacts-states";
import { useOrganizationContactsContext } from "../hooks/use-organization-contacts-context";
import { useOrganizationContacts } from "../hooks/use-organization-contacts";
import { useUpdateOrganizationContact } from "../hooks/use-update-organization-contact";
import type { OrganizationContactEnriched } from "../types";
import { formatOrganizationContactType } from "../utils/format-labels";

const ALL_TYPES = [
  ...ORGANIZATION_CONTACT_TYPES,
  ORGANIZATION_CONTACT_TYPE_MANAGING_COMPANY_SUPERVISOR,
] as const;

const CONTACTS_SHELL_CLASS = "flex w-full flex-1 flex-col gap-6 px-6 py-10";

const NATIVE_SELECT_CLASS =
  "h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm text-foreground shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30";

export function OrganizationContactsContainer() {
  const router = useRouter();
  const { activeOrganization } = useActiveOrganization();
  const organizationId = activeOrganization?.id ?? "";
  const { canManage } = useOrganizationContactsContext();

  const [filters, setFilters] = useState<OrganizationContactListFilters>({});
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<OrganizationContactEnriched | null>(null);

  const { contacts, isLoading, isError, refetch } = useOrganizationContacts(
    organizationId,
    filters,
    canManage,
  );
  const updateMutation = useUpdateOrganizationContact(organizationId);

  useEffect(() => {
    if (canManage === false && organizationId) {
      router.replace("/forbidden");
    }
  }, [canManage, organizationId, router]);

  const activeFilterKey = useMemo(() => JSON.stringify(filters), [filters]);

  if (!canManage) {
    return <OrganizationContactsForbiddenState />;
  }

  function handleCreate() {
    setEditingContact(null);
    setIsFormOpen(true);
  }

  function handleEdit(contact: OrganizationContactEnriched) {
    setEditingContact(contact);
    setIsFormOpen(true);
  }

  function handleToggleActive(contact: OrganizationContactEnriched) {
    void updateMutation.mutateAsync({
      id: contact.id,
      isActive: !contact.isActive,
    });
  }

  return (
    <section className={CONTACTS_SHELL_CLASS}>
      <PageHeader
        actions={
          <Button type="button" onClick={handleCreate}>
            <Plus />
            Novo responsável
          </Button>
        }
        subtitle="Todos os contatos ativos deste tipo no escopo recebem a notificação."
        title="Responsáveis da comunicação"
        icon={Users}
      />

      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm text-foreground">
          Tipo
          <select
            className={NATIVE_SELECT_CLASS}
            value={filters.contactType ?? ""}
            onChange={(event) => {
              const value = event.target.value as OrganizationContactTypeExtended | "";
              setFilters((current) => ({
                ...current,
                contactType: value || undefined,
              }));
            }}
          >
            <option value="">Todos</option>
            {ALL_TYPES.map((type) => (
              <option key={type} value={type}>
                {formatOrganizationContactType(type)}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm text-foreground">
          Status
          <select
            className={NATIVE_SELECT_CLASS}
            value={filters.isActive === undefined ? "" : filters.isActive ? "active" : "inactive"}
            onChange={(event) => {
              const value = event.target.value;
              setFilters((current) => ({
                ...current,
                isActive: value === "" ? undefined : value === "active",
              }));
            }}
          >
            <option value="">Todos</option>
            <option value="active">Ativos</option>
            <option value="inactive">Inativos</option>
          </select>
        </label>
      </div>

      {isLoading ? <OrganizationContactsLoadingSkeleton /> : null}

      {!isLoading && isError ? (
        <OrganizationContactsErrorState
          onRetry={() => {
            void refetch();
          }}
        />
      ) : null}

      {!isLoading && !isError && contacts.length === 0 ? <OrganizationContactsEmptyState /> : null}

      {!isLoading && !isError && contacts.length > 0 ? (
        <OrganizationContactsTable
          contacts={contacts}
          isUpdating={updateMutation.isPending}
          onEdit={handleEdit}
          onToggleActive={handleToggleActive}
        />
      ) : null}

      <OrganizationContactFormDialog
        key={editingContact?.id ?? "create"}
        contact={editingContact}
        isOpen={isFormOpen}
        organizationId={organizationId}
        onClose={() => {
          setIsFormOpen(false);
          setEditingContact(null);
          void refetch();
        }}
      />

      <p className="sr-only" key={activeFilterKey}>
        Filtros aplicados
      </p>
    </section>
  );
}
