"use client";

import { useState } from "react";

import type { OccurrenceDetailsEnriched } from "@/features/occurrences/types";

import { ImsReferenceEditDialog } from "./ims-reference-edit-dialog";

type ImsReferenceCardProps = {
  occurrence: Pick<
    OccurrenceDetailsEnriched,
    | "id"
    | "imsReferenceCode"
    | "imsReferenceRegisteredAt"
    | "imsReferenceRegisteredByName"
    | "imsReferenceUpdatedAt"
    | "imsReferenceUpdatedByName"
  >;
  organizationId: string;
  canUpdate: boolean;
  isOffline: boolean;
  onConflict: () => void;
};

function formatDateTime(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("pt-BR");
}

export function ImsReferenceCard({
  occurrence,
  organizationId,
  canUpdate,
  isOffline,
  onConflict,
}: ImsReferenceCardProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);

  if (!occurrence.imsReferenceCode) {
    return null;
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-wide text-gray-500">Código</span>
          <span className="font-mono text-lg font-semibold text-gray-100">
            {occurrence.imsReferenceCode}
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Registrado por
            </span>
            <span className="text-sm text-gray-100">
              {occurrence.imsReferenceRegisteredByName ?? "—"}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium uppercase tracking-wide text-gray-500">Em</span>
            <span className="text-sm text-gray-100">
              {formatDateTime(occurrence.imsReferenceRegisteredAt)}
            </span>
          </div>
          {occurrence.imsReferenceUpdatedAt ? (
            <>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Atualizado por
                </span>
                <span className="text-sm text-gray-100">
                  {occurrence.imsReferenceUpdatedByName ?? "—"}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Em
                </span>
                <span className="text-sm text-gray-100">
                  {formatDateTime(occurrence.imsReferenceUpdatedAt)}
                </span>
              </div>
            </>
          ) : null}
        </div>

        {canUpdate ? (
          <button
            className="w-full rounded-md border border-gray-600 px-4 py-3 text-sm font-medium text-gray-200 hover:bg-gray-800 disabled:opacity-50 sm:w-auto sm:self-start"
            disabled={isOffline}
            type="button"
            onClick={() => {
              setIsEditOpen(true);
            }}
          >
            Corrigir referência
          </button>
        ) : null}
      </div>

      <ImsReferenceEditDialog
        currentCode={occurrence.imsReferenceCode}
        isOffline={isOffline}
        isOpen={isEditOpen}
        occurrenceId={occurrence.id}
        organizationId={organizationId}
        onClose={() => {
          setIsEditOpen(false);
        }}
        onConflict={onConflict}
      />
    </>
  );
}
