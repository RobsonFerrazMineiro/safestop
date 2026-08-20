"use client";

import type { OrganizationContactEnriched } from "../types";
import { formatContactScope, formatOrganizationContactType } from "../utils/format-labels";

type OrganizationContactsTableProps = {
  contacts: OrganizationContactEnriched[];
  onEdit: (contact: OrganizationContactEnriched) => void;
  onToggleActive: (contact: OrganizationContactEnriched) => void;
  isUpdating: boolean;
};

export function OrganizationContactsTable({
  contacts,
  onEdit,
  onToggleActive,
  isUpdating,
}: OrganizationContactsTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-800">
      <table className="min-w-full divide-y divide-gray-800 text-sm">
        <thead className="bg-gray-950/70 text-left text-xs uppercase tracking-wide text-gray-400">
          <tr>
            <th className="px-4 py-3">Tipo</th>
            <th className="px-4 py-3">Membro</th>
            <th className="px-4 py-3">Escopo</th>
            <th className="px-4 py-3">Prioridade</th>
            <th className="px-4 py-3">Ativo</th>
            <th className="px-4 py-3">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800">
          {contacts.map((contact) => (
            <tr key={contact.id} className="bg-gray-900/30">
              <td className="px-4 py-3 text-gray-200">
                {formatOrganizationContactType(contact.contactType)}
              </td>
              <td className="px-4 py-3 text-gray-300">{contact.memberName ?? "—"}</td>
              <td className="px-4 py-3 text-gray-400">{formatContactScope(contact)}</td>
              <td className="px-4 py-3 text-gray-300">{contact.priority}</td>
              <td className="px-4 py-3">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    contact.isActive
                      ? "border border-green-700/50 text-green-300"
                      : "border border-gray-600 text-gray-400"
                  }`}
                >
                  {contact.isActive ? "Ativo" : "Inativo"}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  <button
                    className="text-xs text-orange-400 hover:text-orange-300"
                    type="button"
                    onClick={() => {
                      onEdit(contact);
                    }}
                  >
                    Editar
                  </button>
                  <button
                    className="text-xs text-gray-300 hover:text-gray-100 disabled:opacity-50"
                    disabled={isUpdating}
                    type="button"
                    onClick={() => {
                      onToggleActive(contact);
                    }}
                  >
                    {contact.isActive ? "Desativar" : "Ativar"}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
