"use client";

import { useEffect, useRef, useState } from "react";
import {
  ORGANIZATION_CONTACT_TYPES,
  ORGANIZATION_CONTACT_TYPE_MANAGING_COMPANY_SUPERVISOR,
  type OrganizationContactTypeExtended,
} from "@safestop/types";

import { useQuery } from "@tanstack/react-query";
import { TENANT_QUERY_KEY_PREFIX } from "@safestop/query-keys";

import { getOrganizationAreasForContacts } from "../services/get-organization-areas";
import { getOrganizationContracts } from "../services/get-organization-contracts";
import { getOrganizationMembersForContacts } from "../services/get-organization-members";
import { getOrganizationUnits } from "../services/get-organization-units";
import type { OrganizationContactEnriched } from "../types";
import { CONTACT_TYPES_REQUIRING_CONTRACT } from "../types";
import { formatOrganizationContactType } from "../utils/format-labels";
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

function requiresContract(contactType: OrganizationContactTypeExtended): boolean {
  return (CONTACT_TYPES_REQUIRING_CONTRACT as readonly string[]).includes(contactType);
}

export function OrganizationContactFormDialog({
  organizationId,
  isOpen,
  onClose,
  contact = null,
}: OrganizationContactFormDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
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

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  const filteredAreas = areasQuery.data?.filter((area) => !unitId || area.unitId === unitId) ?? [];
  const contractRequired = requiresContract(contactType);
  const isPending = createMutation.isPending || updateMutation.isPending;

  function handleClose() {
    onClose();
  }

  async function handleSubmit() {
    setFormError(null);

    if (!organizationMemberId) {
      setFormError("Selecione o membro responsável.");
      return;
    }

    if (contractRequired && !contractId) {
      setFormError("Contrato é obrigatório para este tipo de contato.");
      return;
    }

    const parsedPriority = Number(priority);

    if (!Number.isFinite(parsedPriority) || parsedPriority <= 0) {
      setFormError("Prioridade deve ser um número positivo.");
      return;
    }

    const payload = {
      organizationMemberId,
      contactType,
      priority: parsedPriority,
      unitId: unitId || null,
      areaId: areaId || null,
      contractId: contractId || null,
    };

    try {
      if (isEditing && contact) {
        await updateMutation.mutateAsync({ id: contact.id, ...payload });
      } else {
        await createMutation.mutateAsync(payload);
      }

      handleClose();
    } catch {
      setFormError("Não foi possível salvar o responsável.");
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="w-full max-w-lg rounded-lg border border-gray-700 bg-gray-900 p-0 text-gray-100 backdrop:bg-black/60"
      onCancel={(event) => {
        event.preventDefault();
        handleClose();
      }}
    >
      <form
        className="flex max-h-[90vh] flex-col gap-4 overflow-y-auto p-6"
        method="dialog"
        onSubmit={(event) => {
          event.preventDefault();
          void handleSubmit();
        }}
      >
        <h2 className="text-lg font-semibold">
          {isEditing ? "Editar responsável" : "Novo responsável"}
        </h2>

        <p className="text-xs text-gray-400">
          Todos os contatos ativos deste tipo no escopo recebem a notificação.
        </p>

        <label className="flex flex-col gap-2">
          <span className="text-sm text-gray-300">Tipo de contato *</span>
          <select
            className="rounded-md border border-gray-700 bg-gray-950 px-3 py-2 text-sm"
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
          <span className="text-sm text-gray-300">Membro *</span>
          <select
            className="rounded-md border border-gray-700 bg-gray-950 px-3 py-2 text-sm"
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
          <span className="text-sm text-gray-300">Unidade</span>
          <select
            className="rounded-md border border-gray-700 bg-gray-950 px-3 py-2 text-sm"
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
          <span className="text-sm text-gray-300">Área</span>
          <select
            className="rounded-md border border-gray-700 bg-gray-950 px-3 py-2 text-sm"
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
          <span className="text-sm text-gray-300">Contrato{contractRequired ? " *" : ""}</span>
          <select
            className="rounded-md border border-gray-700 bg-gray-950 px-3 py-2 text-sm"
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
          <span className="text-sm text-gray-300">Prioridade</span>
          <input
            className="rounded-md border border-gray-700 bg-gray-950 px-3 py-2 text-sm"
            min={1}
            type="number"
            value={priority}
            onChange={(event) => {
              setPriority(event.target.value);
            }}
          />
        </label>

        {formError ? (
          <p className="text-sm text-red-400" role="alert">
            {formError}
          </p>
        ) : null}

        <div className="flex justify-end gap-3">
          <button
            className="rounded-md border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800"
            type="button"
            onClick={handleClose}
          >
            Cancelar
          </button>
          <button
            className="rounded-md bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-400 disabled:opacity-50"
            disabled={isPending}
            type="submit"
          >
            {isPending ? "Salvando…" : "Salvar"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
