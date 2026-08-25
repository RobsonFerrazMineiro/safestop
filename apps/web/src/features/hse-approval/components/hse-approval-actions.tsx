"use client";

import { useState } from "react";

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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  isMdhoRpcConflictError,
  isMdhoRpcSelfApprovalError,
  isMdhoRpcValidationError,
} from "@/features/mdho/utils/mdho-rpc";
import { MdhoOfflineNotice } from "@/features/mdho/components/mdho-states";

import {
  useHseApproveMdhoAssessment,
  useHseReturnMdhoAssessment,
} from "../hooks/use-hse-approval-actions";

const RETURN_REASON_MIN_LENGTH = 10;
const RETURN_REASON_MAX_LENGTH = 4000;

type HseApprovalActionsProps = {
  assessmentId: string;
  occurrenceId: string;
  organizationId: string;
  canApprove: boolean;
  canReturn: boolean;
  isOffline: boolean;
  showSelfApprovalNotice?: boolean;
  onConflict: () => void;
  onSelfApprovalBlocked?: () => void;
};

export function HseApprovalActions({
  assessmentId,
  occurrenceId,
  organizationId,
  canApprove,
  canReturn,
  isOffline,
  showSelfApprovalNotice = false,
  onConflict,
  onSelfApprovalBlocked,
}: HseApprovalActionsProps) {
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isReturnOpen, setIsReturnOpen] = useState(false);
  const [returnReason, setReturnReason] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  const approveMutation = useHseApproveMdhoAssessment(occurrenceId, organizationId);
  const returnMutation = useHseReturnMdhoAssessment(occurrenceId, organizationId);

  const isPending = approveMutation.isPending || returnMutation.isPending;
  const trimmedReturnReason = returnReason.trim();
  const returnReasonLength = trimmedReturnReason.length;

  async function handleApprove() {
    setActionError(null);
    try {
      await approveMutation.mutateAsync(assessmentId);
      setIsApproveOpen(false);
    } catch (error) {
      setIsApproveOpen(false);
      if (isMdhoRpcConflictError(error)) {
        onConflict();
        return;
      }
      if (isMdhoRpcSelfApprovalError(error)) {
        onSelfApprovalBlocked?.();
        return;
      }
      setActionError("Não foi possível aprovar a avaliação MDHO.");
    }
  }

  async function handleReturn() {
    setActionError(null);

    if (returnReasonLength < RETURN_REASON_MIN_LENGTH) {
      setActionError(
        `Informe ao menos ${RETURN_REASON_MIN_LENGTH} caracteres no motivo da devolução.`,
      );
      return;
    }

    try {
      await returnMutation.mutateAsync({
        assessmentId,
        returnReason: trimmedReturnReason,
      });
      setIsReturnOpen(false);
      setReturnReason("");
    } catch (error) {
      setIsReturnOpen(false);
      if (isMdhoRpcConflictError(error)) {
        onConflict();
        return;
      }
      if (isMdhoRpcValidationError(error)) {
        setActionError(error.message);
        return;
      }
      setActionError("Não foi possível devolver a avaliação MDHO.");
    }
  }

  if (!canApprove && !canReturn && !showSelfApprovalNotice) {
    return null;
  }

  return (
    <>
      {showSelfApprovalNotice ? (
        <p className="text-sm text-amber-200/90" role="status">
          Você enviou esta avaliação — a aprovação deve ser feita por outra liderança.
        </p>
      ) : null}

      {isOffline ? <MdhoOfflineNotice message="Sem conexão — ação não enviada" /> : null}

      {actionError ? (
        <p className="text-sm text-red-400" role="alert">
          {actionError}
        </p>
      ) : null}

      {canApprove || canReturn ? (
        <div className="flex flex-col gap-2 sm:flex-row">
          {canReturn ? (
            <Button
              className="w-full"
              disabled={isPending || isOffline}
              type="button"
              variant="outline"
              onClick={() => {
                setActionError(null);
                setIsReturnOpen(true);
              }}
            >
              Devolver MDHO
            </Button>
          ) : null}
          {canApprove ? (
            <Button
              className="w-full"
              disabled={isPending || isOffline}
              type="button"
              onClick={() => {
                setActionError(null);
                setIsApproveOpen(true);
              }}
            >
              Aprovar MDHO
            </Button>
          ) : null}
        </div>
      ) : null}

      <AlertDialog
        onOpenChange={(open) => {
          setIsApproveOpen(open);
        }}
        open={isApproveOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Aprovar Avaliação Técnica (MDHO)?</AlertDialogTitle>
            <AlertDialogDescription>
              A avaliação ficará imutável. A ocorrência seguirá para aguardar o registro da
              referência IMS.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel type="button">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={isPending}
              type="button"
              onClick={(event) => {
                event.preventDefault();
                void handleApprove();
              }}
            >
              Aprovar MDHO
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        onOpenChange={(open) => {
          setIsReturnOpen(open);
        }}
        open={isReturnOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Devolver Avaliação Técnica (MDHO)?</DialogTitle>
            <DialogDescription>Informe o motivo da devolução.</DialogDescription>
          </DialogHeader>
          <label className="flex flex-col gap-2">
            <span className="text-sm">Motivo da devolução *</span>
            <Textarea
              className="min-h-24"
              maxLength={RETURN_REASON_MAX_LENGTH}
              value={returnReason}
              onChange={(event) => {
                setReturnReason(event.target.value);
              }}
            />
            <span className="text-xs text-muted-foreground">
              {returnReasonLength}/{RETURN_REASON_MAX_LENGTH} (mín. {RETURN_REASON_MIN_LENGTH})
            </span>
          </label>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsReturnOpen(false);
              }}
            >
              Cancelar
            </Button>
            <Button
              disabled={isPending || returnReasonLength < RETURN_REASON_MIN_LENGTH}
              type="button"
              variant="destructive"
              onClick={() => {
                void handleReturn();
              }}
            >
              Devolver MDHO
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
