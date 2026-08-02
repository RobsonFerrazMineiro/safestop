"use client";

import { useEffect, useRef, useState } from "react";
import {
  OCCURRENCE_DECISION_REASON_MAX_LENGTH,
  OCCURRENCE_DECISION_REASON_MIN_LENGTH,
} from "@safestop/types";
import { recordInterdicaoDecisionSchema } from "@safestop/validation";

import {
  isOccurrenceRpcConflictError,
  isOccurrenceRpcValidationError,
} from "@/features/occurrences/utils/occurrence-decision-rpc";

import { useRecordInterdicaoDecision } from "../hooks/use-record-interdicao-decision";
import { InterdicaoOfflineNotice } from "./interdicao-states";

type InterdicaoDecisionCardProps = {
  occurrenceId: string;
  organizationId: string;
  isOffline: boolean;
  onConflict: () => void;
  onAlreadyDecided: () => void;
};

export function InterdicaoDecisionCard({
  occurrenceId,
  organizationId,
  isOffline,
  onConflict,
  onAlreadyDecided,
}: InterdicaoDecisionCardProps) {
  const { mutateAsync, isPending } = useRecordInterdicaoDecision(occurrenceId, organizationId);
  const [decisionReason, setDecisionReason] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const confirmDialogRef = useRef<HTMLDialogElement>(null);

  const trimmedLength = decisionReason.trim().length;
  const isTooShort = trimmedLength > 0 && trimmedLength < OCCURRENCE_DECISION_REASON_MIN_LENGTH;
  const isTooLong = trimmedLength > OCCURRENCE_DECISION_REASON_MAX_LENGTH;
  const canSubmit =
    trimmedLength >= OCCURRENCE_DECISION_REASON_MIN_LENGTH &&
    trimmedLength <= OCCURRENCE_DECISION_REASON_MAX_LENGTH &&
    !isPending &&
    !isOffline;

  useEffect(() => {
    const dialog = confirmDialogRef.current;

    if (!dialog) {
      return;
    }

    if (isConfirmOpen && !dialog.open) {
      dialog.showModal();
      return;
    }

    if (!isConfirmOpen && dialog.open) {
      dialog.close();
    }
  }, [isConfirmOpen]);

  async function handleConfirmedSubmit() {
    setValidationError(null);

    const parsed = recordInterdicaoDecisionSchema.safeParse({
      occurrenceId,
      decisionReason,
    });

    if (!parsed.success) {
      const message =
        parsed.error.issues[0]?.message ??
        "Informe uma justificativa técnica com pelo menos 10 caracteres.";
      setValidationError(message);
      setIsConfirmOpen(false);
      return;
    }

    try {
      await mutateAsync({ decisionReason: parsed.data.decisionReason });
      setIsConfirmOpen(false);
      setDecisionReason("");
    } catch (error) {
      setIsConfirmOpen(false);

      if (isOccurrenceRpcConflictError(error)) {
        if (error.conflict.code === "ALREADY_DECIDED") {
          onAlreadyDecided();
          return;
        }

        onConflict();
        return;
      }

      if (isOccurrenceRpcValidationError(error)) {
        setValidationError(error.message);
        return;
      }

      setValidationError("Não foi possível confirmar a interdição. Tente novamente.");
    }
  }

  return (
    <>
      <div
        aria-label="Interdição Oficial"
        className="flex h-full flex-col gap-4 rounded-lg border border-red-700/50 bg-red-950/20 p-4"
      >
        <div className="flex items-start gap-3">
          <span aria-hidden="true" className="text-lg text-red-400">
            🔒
          </span>
          <div className="flex flex-col gap-1">
            <h3 className="text-base font-semibold text-red-100">Interdição Oficial</h3>
            <p className="text-sm text-red-200/80">Manter atividade formalmente interditada</p>
          </div>
        </div>

        {isOffline ? (
          <InterdicaoOfflineNotice message="Você está offline. Conecte-se para continuar." />
        ) : null}

        <label className="flex flex-col gap-2" htmlFor="interdicao-decision-reason">
          <span className="text-sm font-medium text-gray-200">
            Justificativa técnica <span className="text-red-400">*</span>
          </span>
          <textarea
            className="min-h-32 w-full rounded-md border border-red-900/60 bg-gray-950 px-3 py-2 text-sm text-gray-100 placeholder:text-gray-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 disabled:opacity-60"
            disabled={isPending}
            id="interdicao-decision-reason"
            maxLength={OCCURRENCE_DECISION_REASON_MAX_LENGTH}
            placeholder="Descreva a justificativa técnica da interdição"
            readOnly={isPending}
            value={decisionReason}
            onChange={(event) => {
              setDecisionReason(event.target.value);
              setValidationError(null);
            }}
          />
        </label>

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-400">
          <span className={isTooShort || isTooLong ? "text-red-400" : undefined}>
            {trimmedLength}/{OCCURRENCE_DECISION_REASON_MAX_LENGTH}
          </span>
          <span>Mínimo 10 caracteres</span>
        </div>

        {validationError ? (
          <p className="text-sm text-red-400" role="alert">
            {validationError}
          </p>
        ) : isTooShort ? (
          <p className="text-sm text-red-400" role="alert">
            Informe uma justificativa técnica com pelo menos 10 caracteres.
          </p>
        ) : isTooLong ? (
          <p className="text-sm text-red-400" role="alert">
            A justificativa técnica deve ter no máximo 4000 caracteres.
          </p>
        ) : null}

        <button
          className="w-full rounded-md bg-red-600 px-4 py-3 text-sm font-medium text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!canSubmit}
          type="button"
          onClick={() => {
            if (!canSubmit) {
              if (trimmedLength < OCCURRENCE_DECISION_REASON_MIN_LENGTH) {
                setValidationError(
                  "Informe uma justificativa técnica com pelo menos 10 caracteres.",
                );
              }
              return;
            }

            setIsConfirmOpen(true);
          }}
        >
          {isPending ? "Confirmando…" : "Confirmar interdição"}
        </button>
      </div>

      <dialog
        ref={confirmDialogRef}
        className="w-full max-w-md rounded-lg border border-red-800 bg-gray-900 p-0 text-gray-100 backdrop:bg-black/60"
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
            void handleConfirmedSubmit();
          }}
        >
          <h2 className="text-lg font-semibold text-red-100">Confirmar Interdição Oficial?</h2>
          <p className="text-sm text-gray-400">
            A atividade permanecerá formalmente interditada. Esta decisão não pode ser desfeita
            nesta etapa.
          </p>
          <div className="flex justify-end gap-3">
            <button
              className="rounded-md border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800"
              disabled={isPending}
              type="button"
              onClick={() => {
                setIsConfirmOpen(false);
              }}
            >
              Cancelar
            </button>
            <button
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50"
              disabled={isPending}
              type="submit"
            >
              {isPending ? "Confirmando…" : "Confirmar interdição"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
