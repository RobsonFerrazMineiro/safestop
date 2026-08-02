"use client";

import { useEffect, useRef, useState } from "react";
import {
  OCCURRENCE_DECISION_REASON_MAX_LENGTH,
  OCCURRENCE_DECISION_REASON_MIN_LENGTH,
} from "@safestop/types";
import { recordVerEAgirDecisionSchema } from "@safestop/validation";

import {
  isOccurrenceRpcConflictError,
  isOccurrenceRpcValidationError,
} from "@/features/occurrences/utils/occurrence-decision-rpc";

type VerEAgirDecisionFormProps = {
  occurrenceId: string;
  isPending: boolean;
  isOffline: boolean;
  commentDraft: string | null;
  onSubmit: (decisionReason: string) => Promise<void>;
  onConflict: () => void;
  onAlreadyDecided: () => void;
};

export function VerEAgirDecisionForm({
  occurrenceId,
  isPending,
  isOffline,
  commentDraft,
  onSubmit,
  onConflict,
  onAlreadyDecided,
}: VerEAgirDecisionFormProps) {
  const [decisionReason, setDecisionReason] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isOverwriteConfirmOpen, setIsOverwriteConfirmOpen] = useState(false);
  const confirmDialogRef = useRef<HTMLDialogElement>(null);
  const overwriteDialogRef = useRef<HTMLDialogElement>(null);

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

  useEffect(() => {
    const dialog = overwriteDialogRef.current;

    if (!dialog) {
      return;
    }

    if (isOverwriteConfirmOpen && !dialog.open) {
      dialog.showModal();
      return;
    }

    if (!isOverwriteConfirmOpen && dialog.open) {
      dialog.close();
    }
  }, [isOverwriteConfirmOpen]);

  async function handleConfirmedSubmit() {
    setValidationError(null);

    const parsed = recordVerEAgirDecisionSchema.safeParse({
      occurrenceId,
      decisionReason,
    });

    if (!parsed.success) {
      const message =
        parsed.error.issues[0]?.message ??
        "Informe uma justificativa com pelo menos 10 caracteres.";
      setValidationError(message);
      setIsConfirmOpen(false);
      return;
    }

    try {
      await onSubmit(parsed.data.decisionReason);
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

      setValidationError("Não foi possível registrar a decisão. Tente novamente.");
    }
  }

  function handleUseCommentDraft() {
    if (!commentDraft) {
      return;
    }

    if (decisionReason.trim().length > 0) {
      setIsOverwriteConfirmOpen(true);
      return;
    }

    setDecisionReason(commentDraft);
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-2" htmlFor="ver-e-agir-decision-reason">
        <span className="text-sm font-medium text-gray-200">
          Justificativa <span className="text-orange-400">*</span>
        </span>
        <textarea
          className="min-h-32 w-full rounded-md border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-gray-100 placeholder:text-gray-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:opacity-60"
          disabled={isPending}
          id="ver-e-agir-decision-reason"
          maxLength={OCCURRENCE_DECISION_REASON_MAX_LENGTH}
          placeholder="Descreva a justificativa da decisão"
          readOnly={isPending}
          value={decisionReason}
          onChange={(event) => {
            setDecisionReason(event.target.value);
            setValidationError(null);
          }}
        />
      </label>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-400">
        <span className={isTooShort || isTooLong ? "text-amber-400" : undefined}>
          {trimmedLength}/{OCCURRENCE_DECISION_REASON_MAX_LENGTH}
        </span>
        <span>Mínimo 10 caracteres</span>
      </div>

      {validationError ? (
        <p className="text-sm text-red-400" role="alert">
          {validationError}
        </p>
      ) : isTooShort ? (
        <p className="text-sm text-amber-400" role="alert">
          Informe uma justificativa com pelo menos 10 caracteres.
        </p>
      ) : isTooLong ? (
        <p className="text-sm text-amber-400" role="alert">
          A justificativa deve ter no máximo 4000 caracteres.
        </p>
      ) : null}

      {commentDraft ? (
        <button
          className="self-start text-sm text-orange-400 hover:text-orange-300 disabled:opacity-50"
          disabled={isPending || isOffline}
          type="button"
          onClick={handleUseCommentDraft}
        >
          Usar comentário como rascunho
        </button>
      ) : null}

      <button
        className="w-full rounded-md bg-orange-600 px-4 py-3 text-sm font-medium text-white hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={!canSubmit}
        type="button"
        onClick={() => {
          if (!canSubmit) {
            if (trimmedLength < OCCURRENCE_DECISION_REASON_MIN_LENGTH) {
              setValidationError("Informe uma justificativa com pelo menos 10 caracteres.");
            }
            return;
          }

          setIsConfirmOpen(true);
        }}
      >
        {isPending ? "Registrando…" : "Registrar Ver e Agir"}
      </button>

      <dialog
        ref={confirmDialogRef}
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
            void handleConfirmedSubmit();
          }}
        >
          <h2 className="text-lg font-semibold">Registrar decisão Ver e Agir?</h2>
          <p className="text-sm text-gray-400">Esta ação não pode ser desfeita nesta etapa.</p>
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
              className="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-500 disabled:opacity-50"
              disabled={isPending}
              type="submit"
            >
              {isPending ? "Registrando…" : "Registrar Ver e Agir"}
            </button>
          </div>
        </form>
      </dialog>

      <dialog
        ref={overwriteDialogRef}
        className="w-full max-w-md rounded-lg border border-gray-700 bg-gray-900 p-0 text-gray-100 backdrop:bg-black/60"
        onCancel={(event) => {
          event.preventDefault();
          setIsOverwriteConfirmOpen(false);
        }}
      >
        <form
          className="flex flex-col gap-4 p-6"
          method="dialog"
          onSubmit={(event) => {
            event.preventDefault();
            if (commentDraft) {
              setDecisionReason(commentDraft);
            }
            setIsOverwriteConfirmOpen(false);
          }}
        >
          <h2 className="text-lg font-semibold">Substituir o texto da justificativa?</h2>
          <div className="flex justify-end gap-3">
            <button
              className="rounded-md border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800"
              type="button"
              onClick={() => {
                setIsOverwriteConfirmOpen(false);
              }}
            >
              Cancelar
            </button>
            <button
              className="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-500"
              type="submit"
            >
              Substituir
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
