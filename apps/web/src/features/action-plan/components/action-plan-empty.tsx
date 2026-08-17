"use client";

import { useEffect, useRef, useState } from "react";

import { useCreateActionPlan } from "../hooks/use-create-action-plan";
import { ActionPlanOfflineNotice } from "./action-plan-states";

type ActionPlanEmptyProps = {
  occurrenceId: string;
  organizationId: string;
  isOffline: boolean;
  onConflict: () => void;
};

export function ActionPlanEmpty({
  occurrenceId,
  organizationId,
  isOffline,
  onConflict,
}: ActionPlanEmptyProps) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const createMutation = useCreateActionPlan(organizationId, occurrenceId);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isConfirmOpen && !dialog.open) dialog.showModal();
    if (!isConfirmOpen && dialog.open) dialog.close();
  }, [isConfirmOpen]);

  async function handleCreate() {
    setActionError(null);
    try {
      await createMutation.mutateAsync({ occurrenceId });
      setIsConfirmOpen(false);
    } catch {
      setIsConfirmOpen(false);
      onConflict();
    }
  }

  return (
    <div className="flex flex-col items-start gap-4 rounded-lg border border-dashed border-gray-700 bg-gray-900/30 px-4 py-6">
      <div className="flex flex-col gap-1">
        <p className="text-base font-medium text-gray-200">Nenhum Plano de Ação</p>
        <p className="text-sm text-gray-400">Defina ações corretivas com responsável e prazo.</p>
      </div>

      {isOffline ? <ActionPlanOfflineNotice /> : null}
      {actionError ? (
        <p className="text-sm text-red-400" role="alert">
          {actionError}
        </p>
      ) : null}

      <button
        className="rounded-md bg-orange-500 px-4 py-3 text-sm font-medium text-white hover:bg-orange-400 disabled:opacity-50"
        disabled={createMutation.isPending || isOffline}
        type="button"
        onClick={() => {
          setIsConfirmOpen(true);
        }}
      >
        {createMutation.isPending ? "Criando…" : "Criar Plano de Ação"}
      </button>

      <dialog
        ref={dialogRef}
        className="w-full max-w-md rounded-lg border border-gray-700 bg-gray-900 p-0 text-gray-100 backdrop:bg-black/60"
        onCancel={(event) => {
          event.preventDefault();
          setIsConfirmOpen(false);
        }}
      >
        <form
          className="flex flex-col gap-4 p-6"
          method="dialog"
          onSubmit={(event) => {
            event.preventDefault();
            void handleCreate();
          }}
        >
          <h2 className="text-lg font-semibold">Criar Plano de Ação para esta interdição?</h2>
          <div className="flex justify-end gap-3">
            <button
              className="rounded-md border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800"
              type="button"
              onClick={() => {
                setIsConfirmOpen(false);
              }}
            >
              Cancelar
            </button>
            <button
              className="rounded-md bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-400 disabled:opacity-50"
              disabled={createMutation.isPending}
              type="submit"
            >
              Criar Plano de Ação
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
