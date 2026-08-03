"use client";

import { useEffect, useRef, useState } from "react";

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
  const approveDialogRef = useRef<HTMLDialogElement>(null);
  const returnDialogRef = useRef<HTMLDialogElement>(null);

  const approveMutation = useHseApproveMdhoAssessment(occurrenceId, organizationId);
  const returnMutation = useHseReturnMdhoAssessment(occurrenceId, organizationId);

  const isPending = approveMutation.isPending || returnMutation.isPending;
  const trimmedReturnReason = returnReason.trim();
  const returnReasonLength = trimmedReturnReason.length;

  useEffect(() => {
    const dialog = approveDialogRef.current;
    if (!dialog) return;
    if (isApproveOpen && !dialog.open) dialog.showModal();
    if (!isApproveOpen && dialog.open) dialog.close();
  }, [isApproveOpen]);

  useEffect(() => {
    const dialog = returnDialogRef.current;
    if (!dialog) return;
    if (isReturnOpen && !dialog.open) dialog.showModal();
    if (!isReturnOpen && dialog.open) dialog.close();
  }, [isReturnOpen]);

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
            <button
              className="w-full rounded-md border border-red-700 px-4 py-3 text-sm font-medium text-red-200 hover:bg-red-950/40 disabled:opacity-50"
              disabled={isPending || isOffline}
              type="button"
              onClick={() => {
                setActionError(null);
                setIsReturnOpen(true);
              }}
            >
              Devolver MDHO
            </button>
          ) : null}
          {canApprove ? (
            <button
              className="w-full rounded-md bg-orange-500 px-4 py-3 text-sm font-medium text-white hover:bg-orange-400 disabled:opacity-50"
              disabled={isPending || isOffline}
              type="button"
              onClick={() => {
                setActionError(null);
                setIsApproveOpen(true);
              }}
            >
              Aprovar MDHO
            </button>
          ) : null}
        </div>
      ) : null}

      <dialog
        ref={approveDialogRef}
        className="w-full max-w-md rounded-lg border border-gray-700 bg-gray-900 p-0 text-gray-100 backdrop:bg-black/60"
        onCancel={(event) => {
          event.preventDefault();
          setIsApproveOpen(false);
        }}
      >
        <form
          className="flex flex-col gap-4 p-6"
          method="dialog"
          onSubmit={(event) => {
            event.preventDefault();
            void handleApprove();
          }}
        >
          <h2 className="text-lg font-semibold">Aprovar Avaliação Técnica (MDHO)?</h2>
          <p className="text-sm text-gray-400">
            A avaliação ficará imutável. A ocorrência seguirá para aguardar o registro da referência
            IMS.
          </p>
          <div className="flex justify-end gap-3">
            <button
              className="rounded-md border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800"
              type="button"
              onClick={() => {
                setIsApproveOpen(false);
              }}
            >
              Cancelar
            </button>
            <button
              className="rounded-md bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-400 disabled:opacity-50"
              disabled={isPending}
              type="submit"
            >
              Aprovar MDHO
            </button>
          </div>
        </form>
      </dialog>

      <dialog
        ref={returnDialogRef}
        className="w-full max-w-md rounded-lg border border-gray-700 bg-gray-900 p-0 text-gray-100 backdrop:bg-black/60"
        onCancel={(event) => {
          event.preventDefault();
          setIsReturnOpen(false);
        }}
      >
        <form
          className="flex flex-col gap-4 p-6"
          method="dialog"
          onSubmit={(event) => {
            event.preventDefault();
            void handleReturn();
          }}
        >
          <h2 className="text-lg font-semibold">Devolver Avaliação Técnica (MDHO)?</h2>
          <label className="flex flex-col gap-2">
            <span className="text-sm text-gray-300">Motivo da devolução *</span>
            <textarea
              className="min-h-24 w-full rounded-md border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-gray-100"
              maxLength={RETURN_REASON_MAX_LENGTH}
              value={returnReason}
              onChange={(event) => {
                setReturnReason(event.target.value);
              }}
            />
            <span className="text-xs text-gray-500">
              {returnReasonLength}/{RETURN_REASON_MAX_LENGTH} (mín. {RETURN_REASON_MIN_LENGTH})
            </span>
          </label>
          <div className="flex justify-end gap-3">
            <button
              className="rounded-md border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800"
              type="button"
              onClick={() => {
                setIsReturnOpen(false);
              }}
            >
              Cancelar
            </button>
            <button
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50"
              disabled={isPending || returnReasonLength < RETURN_REASON_MIN_LENGTH}
              type="submit"
            >
              Devolver MDHO
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
