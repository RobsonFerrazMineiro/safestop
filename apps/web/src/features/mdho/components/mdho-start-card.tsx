"use client";

import { useState } from "react";

import { isMdhoRpcConflictError } from "../utils/mdho-rpc";
import { useStartMdhoAssessment } from "../hooks/use-start-mdho-assessment";
import { MdhoOfflineNotice } from "./mdho-states";

type MdhoStartCardProps = {
  occurrenceId: string;
  organizationId: string;
  isOffline: boolean;
  onConflict: () => void;
};

export function MdhoStartCard({
  occurrenceId,
  organizationId,
  isOffline,
  onConflict,
}: MdhoStartCardProps) {
  const { mutateAsync, isPending } = useStartMdhoAssessment(occurrenceId, organizationId);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleStart() {
    setErrorMessage(null);

    try {
      await mutateAsync();
    } catch (error) {
      if (isMdhoRpcConflictError(error)) {
        onConflict();
        return;
      }

      setErrorMessage("Não foi possível iniciar a avaliação MDHO. Tente novamente.");
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-blue-700/40 bg-blue-950/20 p-4">
      <p className="text-sm text-blue-100">A Interdição Oficial está confirmada.</p>
      <p className="text-sm text-blue-200/80">
        Inicie a Avaliação Técnica (MDHO) para registrar a análise estruturada.
      </p>

      {isOffline ? <MdhoOfflineNotice /> : null}

      {errorMessage ? (
        <p className="text-sm text-red-400" role="alert">
          {errorMessage}
        </p>
      ) : null}

      <button
        className="w-full rounded-md bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={isPending || isOffline}
        type="button"
        onClick={() => {
          void handleStart();
        }}
      >
        {isPending ? "Iniciando…" : "Iniciar Avaliação Técnica (MDHO)"}
      </button>
    </div>
  );
}
