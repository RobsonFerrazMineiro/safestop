"use client";

import { useState } from "react";
import {
  ORGANIZATION_CONTACT_TYPES,
  ORGANIZATION_CONTACT_TYPE_MANAGING_COMPANY_SUPERVISOR,
  type OrganizationContactTypeExtended,
} from "@safestop/types";

import { useQuery } from "@tanstack/react-query";
import { TENANT_QUERY_KEY_PREFIX } from "@safestop/query-keys";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { getOrganizationAreasForContacts } from "../services/get-organization-areas";
import { getOrganizationContracts } from "../services/get-organization-contracts";
import { getOrganizationMembersForContacts } from "../services/get-organization-members";
import { getOrganizationUnits } from "../services/get-organization-units";
import type { OrganizationContactEnriched } from "../types";
import { CONTACT_TYPES_REQUIRING_CONTRACT } from "../types";
import { formatOrganizationContactType } from "../utils/format-labels";
import { buildOrganizationContactFormPayload } from "../utils/organization-contact-form-payload";
import { useCreateOrganizationContact } from "../hooks/use-create-organization-contact";
import { useUpdateOrganizationContact } from "../hooks/use-update-organization-contact";

type OrganizationContactFormDialogProps = {
  organizationId: string;
  isOpen: boolean;
  onClose: () => void;
  contact?: OrganizationContactEnriched | null;
};

const ALL_CONTACT_TYPES: OrganizationContactTypeExtended[] = [
  ...ORGANIZATION_CONTACT_TYPES,
  ORGANIZATION_CONTACT_TYPE_MANAGING_COMPANY_SUPERVISOR,
];

const NATIVE_SELECT_CLASS =
  "h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm text-foreground shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30";

function requiresContract(contactType: OrganizationContactTypeExtended): boolean {
  return (CONTACT_TYPES_REQUIRING_CONTRACT as readonly string[]).includes(contactType);
}

export function OrganizationContactFormDialog({
  organizationId,
  isOpen,
  onClose,
  contact = null,
}: OrganizationContactFormDialogProps) {
  const isEditing = contact !== null;

  const [contactType, setContactType] = useState<OrganizationContactTypeExtended>(
    contact?.contactType ?? ORGANIZATION_CONTACT_TYPES[0],
  );
  const [organizationMemberId, setOrganizationMemberId] = useState(
    contact?.organizationMemberId ?? "",
  );
  const [unitId, setUnitId] = useState(contact?.unitId ?? "");
  const [areaId, setAreaId] = useState(contact?.areaId ?? "");
  const [contractId, setContractId] = useState(contact?.contractId ?? "");
  const [priority, setPriority] = useState(String(contact?.priority ?? 100));
  const [formError, setFormError] = useState<string | null>(null);

  const createMutation = useCreateOrganizationContact(organizationId);
  const updateMutation = useUpdateOrganizationContact(organizationId);

  const membersQuery = useQuery({
    queryKey: [TENANT_QUERY_KEY_PREFIX, organizationId, "organization-contacts-form", "members"],
    queryFn: () => getOrganizationMembersForContacts(organizationId),
    enabled: isOpen,
  });

  const unitsQuery = useQuery({
    queryKey: [TENANT_QUERY_KEY_PREFIX, organizationId, "organization-contacts-form", "units"],
    queryFn: () => getOrganizationUnits(organizationId),
    enabled: isOpen,
  });

  const areasQuery = useQuery({
    queryKey: [TENANT_QUERY_KEY_PREFIX, organizationId, "organization-contacts-form", "areas"],
    queryFn: () => getOrganizationAreasForContacts(organizationId),
    enabled: isOpen,
  });

  const contractsQuery = useQuery({
    queryKey: [TENANT_QUERY_KEY_PREFIX, organizationId, "organization-contacts-form", "contracts"],
    queryFn: () => getOrganizationContracts(organizationId),
    enabled: isOpen,
  });

  const filteredAreas = areasQuery.data?.filter((area) => !unitId || area.unitId === unitId) ?? [];
  const contractRequired = requiresContract(contactType);
  const isPending = createMutation.isPending || updateMutation.isPending;

  function handleClose() {
    onClose();
  }

  async function handleSubmit() {
    setFormError(null);

    const result = buildOrganizationContactFormPayload(
      {
        organizationMemberId,
        contactType,
        priority,
        unitId,
        areaId,
        contractId,
      },
      contractRequired,
    );

    if ("error" in result) {
      setFormError(result.error);
      return;
    }

    try {
      if (isEditing && contact) {
        await updateMutation.mutateAsync({ id: contact.id, ...result.payload });
      } else {
        await createMutation.mutateAsync(result.payload);
      }

      handleClose();
    } catch {
      setFormError("Não foi possível salvar o responsável.");
    }
  }

  return (
    <Dialog
      onOpenChange={(open) => {
        if (!open) {
          handleClose();
        }
      }}
      open={isOpen}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg" showCloseButton={false}>
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            void handleSubmit();
          }}
        >
          <DialogHeader>
            <DialogTitle>{isEditing ? "Editar responsável" : "Novo responsável"}</DialogTitle>
            <DialogDescription>
              Todos os contatos ativos deste tipo no escopo recebem a notificação.
            </DialogDescription>
          </DialogHeader>

          <label className="flex flex-col gap-2">
            <span className="text-sm text-muted-foreground">Tipo de contato *</span>
            <select
              className={NATIVE_SELECT_CLASS}
              value={contactType}
              onChange={(event) => {
                setContactType(event.target.value as OrganizationContactTypeExtended);
              }}
            >
              {ALL_CONTACT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {formatOrganizationContactType(type)}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm text-muted-foreground">Membro *</span>
            <select
              className={NATIVE_SELECT_CLASS}
              value={organizationMemberId}
              onChange={(event) => {
                setOrganizationMemberId(event.target.value);
              }}
            >
              <option value="">Selecione…</option>
              {(membersQuery.data ?? []).map((member) => (
                <option key={member.id} value={member.id}>
                  {member.fullName ?? member.id}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm text-muted-foreground">Unidade</span>
            <select
              className={NATIVE_SELECT_CLASS}
              value={unitId}
              onChange={(event) => {
                setUnitId(event.target.value);
                setAreaId("");
              }}
            >
              <option value="">Todas / org</option>
              {(unitsQuery.data ?? []).map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm text-muted-foreground">Área</span>
            <select
              className={NATIVE_SELECT_CLASS}
              value={areaId}
              onChange={(event) => {
                setAreaId(event.target.value);
              }}
            >
              <option value="">Todas / org</option>
              {filteredAreas.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm text-muted-foreground">
              Contrato{contractRequired ? " *" : ""}
            </span>
            <select
              className={NATIVE_SELECT_CLASS}
              value={contractId}
              onChange={(event) => {
                setContractId(event.target.value);
              }}
            >
              <option value="">Selecione…</option>
              {(contractsQuery.data ?? []).map((contract) => (
                <option key={contract.id} value={contract.id}>
                  {contract.name}
                  {contract.contractNumber ? ` (${contract.contractNumber})` : ""}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm text-muted-foreground">Prioridade</span>
            <Input
              min={1}
              type="number"
              value={priority}
              onChange={(event) => {
                setPriority(event.target.value);
              }}
            />
          </label>

          {formError ? (
            <p className="text-sm text-destructive" role="alert">
              {formError}
            </p>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button disabled={isPending} type="submit">
              {isPending ? "Salvando…" : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
