"use client";

import { useState } from "react";

import { isOccurrenceRpcConflictError } from "@/features/occurrences/utils/occurrence-decision-rpc";
import { useStartEvaluation } from "../hooks/use-start-evaluation";
import { StartEvaluationConfirmDialog } from "./start-evaluation-confirm-dialog";

type StartEvaluationButtonProps = {
  occurrenceId: string;
  organizationId: string;
  isOffline: boolean;
  onConflict: () => void;
};

export function StartEvaluationButton({
  occurrenceId,
  organizationId,
  isOffline,
  onConflict,
}: StartEvaluationButtonProps) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const { mutateAsync, isPending } = useStartEvaluation(occurrenceId, organizationId);

  async function handleConfirm() {
    try {
      await mutateAsync();
      setIsConfirmOpen(false);
    } catch (error) {
      setIsConfirmOpen(false);

      if (isOccurrenceRpcConflictError(error)) {
        onConflict();
      }
    }
  }

  return (
    <>
      <button
        className="w-full rounded-md bg-orange-600 px-4 py-3 text-sm font-medium text-white hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={isPending || isOffline}
        type="button"
        onClick={() => {
          setIsConfirmOpen(true);
        }}
      >
        {isPending ? "Iniciando…" : "Iniciar avaliação"}
      </button>

      <StartEvaluationConfirmDialog
        isOpen={isConfirmOpen}
        isPending={isPending}
        onCancel={() => {
          setIsConfirmOpen(false);
        }}
        onConfirm={() => {
          void handleConfirm();
        }}
      />
    </>
  );
}
