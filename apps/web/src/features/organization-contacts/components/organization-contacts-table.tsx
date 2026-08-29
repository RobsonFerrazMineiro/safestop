"use client";

import { Button } from "@/components/ui/button";

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
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="min-w-full divide-y divide-border text-sm">
        <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-3">Tipo</th>
            <th className="px-4 py-3">Membro</th>
            <th className="px-4 py-3">Escopo</th>
            <th className="px-4 py-3">Prioridade</th>
            <th className="px-4 py-3">Ativo</th>
            <th className="px-4 py-3">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {contacts.map((contact) => (
            <tr key={contact.id} className="bg-card">
              <td className="px-4 py-3 text-foreground">
                {formatOrganizationContactType(contact.contactType)}
              </td>
              <td className="px-4 py-3 text-foreground">{contact.memberName ?? "—"}</td>
              <td className="px-4 py-3 text-muted-foreground">{formatContactScope(contact)}</td>
              <td className="px-4 py-3 text-foreground">{contact.priority}</td>
              <td className="px-4 py-3">
                <span
                  className={`rounded-full border px-2 py-0.5 text-xs ${
                    contact.isActive
                      ? "border-status-success-border bg-status-success-bg text-status-success-fg"
                      : "border-status-muted-border bg-status-muted-bg text-status-muted-fg"
                  }`}
                >
                  {contact.isActive ? "Ativo" : "Inativo"}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  <Button
                    className="h-auto px-0"
                    size="sm"
                    type="button"
                    variant="link"
                    onClick={() => {
                      onEdit(contact);
                    }}
                  >
                    Editar
                  </Button>
                  <Button
                    className="h-auto px-0"
                    disabled={isUpdating}
                    size="sm"
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      onToggleActive(contact);
                    }}
                  >
                    {contact.isActive ? "Desativar" : "Ativar"}
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
