"use client";

import { useState } from "react";
import {
  OCCURRENCE_DECISION_REASON_MAX_LENGTH,
  OCCURRENCE_DECISION_REASON_MIN_LENGTH,
} from "@safestop/types";
import { recordVerEAgirDecisionSchema } from "@safestop/validation";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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

  const trimmedLength = decisionReason.trim().length;
  const isTooShort = trimmedLength > 0 && trimmedLength < OCCURRENCE_DECISION_REASON_MIN_LENGTH;
  const isTooLong = trimmedLength > OCCURRENCE_DECISION_REASON_MAX_LENGTH;
  const canSubmit =
    trimmedLength >= OCCURRENCE_DECISION_REASON_MIN_LENGTH &&
    trimmedLength <= OCCURRENCE_DECISION_REASON_MAX_LENGTH &&
    !isPending &&
    !isOffline;

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
        <Textarea
          className="min-h-32"
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
        <Button
          className="self-start"
          disabled={isPending || isOffline}
          type="button"
          variant="ghost"
          onClick={handleUseCommentDraft}
        >
          Usar comentário como rascunho
        </Button>
      ) : null}

      <Button
        className="w-full"
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
      </Button>

      <AlertDialog
        onOpenChange={(open) => {
          setIsConfirmOpen(open);
        }}
        open={isConfirmOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Registrar decisão Ver e Agir?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita nesta etapa.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending} type="button">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isPending}
              type="button"
              onClick={(event) => {
                event.preventDefault();
                void handleConfirmedSubmit();
              }}
            >
              {isPending ? "Registrando…" : "Registrar Ver e Agir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        onOpenChange={(open) => {
          setIsOverwriteConfirmOpen(open);
        }}
        open={isOverwriteConfirmOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Substituir o texto da justificativa?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel type="button">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              type="button"
              onClick={(event) => {
                event.preventDefault();
                if (commentDraft) {
                  setDecisionReason(commentDraft);
                }
                setIsOverwriteConfirmOpen(false);
              }}
            >
              Substituir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
