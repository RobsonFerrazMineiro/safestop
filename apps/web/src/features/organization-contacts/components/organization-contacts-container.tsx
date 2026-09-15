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

import { FilterField, FilterShell } from "@/components/filter-shell";
import { PageHeader } from "@/components/page-header";
import { PageShell } from "@/components/page-shell";
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

const NATIVE_SELECT_CLASS =
  "h-9 w-full min-w-[10rem] rounded-md border border-input bg-transparent px-3 py-1 text-sm text-foreground shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30";

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
  const activeFilterCount =
    (filters.contactType ? 1 : 0) + (filters.isActive !== undefined ? 1 : 0);

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

  function handleClearFilters() {
    setFilters({});
  }

  return (
    <PageShell className="gap-6" width="wide">
      <PageHeader
        actions={
          <Button size="sm" type="button" onClick={handleCreate}>
            <Plus className="size-4" />
            Novo responsável
          </Button>
        }
        eyebrow="ADMINISTRAÇÃO DA COMUNICAÇÃO"
        icon={Users}
        subtitle="Todos os contatos ativos deste tipo no escopo recebem a notificação."
        title="Responsáveis da comunicação"
      />

      <FilterShell
        actions={
          activeFilterCount > 0 ? (
            <Button
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={handleClearFilters}
              size="sm"
              type="button"
              variant="ghost"
            >
              Limpar filtros
            </Button>
          ) : null
        }
        meta={
          activeFilterCount > 0 ? (
            <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
              {activeFilterCount} {activeFilterCount === 1 ? "filtro ativo" : "filtros ativos"}
            </span>
          ) : null
        }
        title="Filtros"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <FilterField className="min-w-[10rem] flex-1" htmlFor="contact-type-filter" label="Tipo">
            <select
              className={NATIVE_SELECT_CLASS}
              id="contact-type-filter"
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
          </FilterField>

          <FilterField
            className="min-w-[10rem] flex-1"
            htmlFor="contact-status-filter"
            label="Status"
          >
            <select
              className={NATIVE_SELECT_CLASS}
              id="contact-status-filter"
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
          </FilterField>
        </div>
      </FilterShell>

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
    </PageShell>
  );
}
