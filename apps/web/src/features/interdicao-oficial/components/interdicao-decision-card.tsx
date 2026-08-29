"use client";

import { useState } from "react";
import {
  OCCURRENCE_DECISION_REASON_MAX_LENGTH,
  OCCURRENCE_DECISION_REASON_MIN_LENGTH,
} from "@safestop/types";
import { recordInterdicaoDecisionSchema } from "@safestop/validation";

import {
  isOccurrenceRpcConflictError,
  isOccurrenceRpcValidationError,
} from "@/features/occurrences/utils/occurrence-decision-rpc";
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
        className="flex h-full flex-col gap-4 rounded-lg border border-status-destructive-border bg-status-destructive-bg p-4"
      >
        <div className="flex flex-col gap-1">
          <h3 className="text-base font-semibold text-status-destructive-fg">Interdição Oficial</h3>
          <p className="text-sm text-status-destructive-fg/80">
            Manter atividade formalmente interditada
          </p>
        </div>

        {isOffline ? (
          <InterdicaoOfflineNotice message="Você está offline. Conecte-se para continuar." />
        ) : null}

        <label className="flex flex-col gap-2" htmlFor="interdicao-decision-reason">
          <span className="text-sm font-medium text-foreground">
            Justificativa técnica <span className="text-destructive">*</span>
          </span>
          <Textarea
            className="min-h-32"
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

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span className={isTooShort || isTooLong ? "text-destructive" : undefined}>
            {trimmedLength}/{OCCURRENCE_DECISION_REASON_MAX_LENGTH}
          </span>
          <span>Mínimo 10 caracteres</span>
        </div>

        {validationError ? (
          <p className="text-sm text-destructive" role="alert">
            {validationError}
          </p>
        ) : isTooShort ? (
          <p className="text-sm text-destructive" role="alert">
            Informe uma justificativa técnica com pelo menos 10 caracteres.
          </p>
        ) : isTooLong ? (
          <p className="text-sm text-destructive" role="alert">
            A justificativa técnica deve ter no máximo 4000 caracteres.
          </p>
        ) : null}

        <Button
          className="w-full"
          disabled={!canSubmit}
          type="button"
          variant="destructive"
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
        </Button>
      </div>

      <AlertDialog
        onOpenChange={(open) => {
          setIsConfirmOpen(open);
        }}
        open={isConfirmOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Interdição Oficial?</AlertDialogTitle>
            <AlertDialogDescription>
              A atividade permanecerá formalmente interditada. Esta decisão não pode ser desfeita
              nesta etapa.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending} type="button">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isPending}
              type="button"
              variant="destructive"
              onClick={(event) => {
                event.preventDefault();
                void handleConfirmedSubmit();
              }}
            >
              {isPending ? "Confirmando…" : "Confirmar interdição"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
