"use client";

import { useEffect, useRef, useState } from "react";
import {
  ACTION_ITEM_VALIDATION_NOTE_MAX_LENGTH,
  ACTION_ITEM_VALIDATION_NOTE_MIN_LENGTH,
} from "@safestop/types";

import { useActionItemAttachments } from "../hooks/use-action-item-attachments";
import { useValidateActionItem } from "../hooks/use-validate-action-item";
import { getActionItemAttachmentSignedUrl } from "../services/get-action-item-attachment-signed-url";
import type { ActionItemEnriched } from "../types";
import {
  isActionPlanRpcConflictError,
  isActionPlanRpcSelfValidationError,
  isActionPlanRpcValidationError,
} from "../utils/action-plan-rpc";
import { formatActionItemPriority } from "../utils/format-labels";
import { ActionPlanOfflineNotice } from "./action-plan-states";

type ActionPlanValidatePanelProps = {
  item: ActionItemEnriched;
  organizationId: string;
  occurrenceId: string;
  planId: string;
  canValidate: boolean;
  showSelfValidationNotice: boolean;
  isOffline: boolean;
  onConflict: () => void;
};

function formatDateTime(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("pt-BR");
}

export function ActionPlanValidatePanel({
  item,
  organizationId,
  occurrenceId,
  planId,
  canValidate,
  showSelfValidationNotice,
  isOffline,
  onConflict,
}: ActionPlanValidatePanelProps) {
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectNote, setRejectNote] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const approveDialogRef = useRef<HTMLDialogElement>(null);
  const rejectDialogRef = useRef<HTMLDialogElement>(null);

  const validateMutation = useValidateActionItem(organizationId, occurrenceId, planId, item.id);
  const { completedAttachments } = useActionItemAttachments(organizationId, item.id, true);

  useEffect(() => {
    const dialog = approveDialogRef.current;
    if (!dialog) return;
    if (isApproveOpen && !dialog.open) dialog.showModal();
    if (!isApproveOpen && dialog.open) dialog.close();
  }, [isApproveOpen]);

  useEffect(() => {
    const dialog = rejectDialogRef.current;
    if (!dialog) return;
    if (isRejectOpen && !dialog.open) dialog.showModal();
    if (!isRejectOpen && dialog.open) dialog.close();
  }, [isRejectOpen]);

  async function handleApprove() {
    setActionError(null);
    try {
      await validateMutation.mutateAsync({
        itemId: item.id,
        outcome: "COMPLETED",
      });
      setIsApproveOpen(false);
    } catch (error) {
      setIsApproveOpen(false);
      if (isActionPlanRpcConflictError(error)) {
        onConflict();
        return;
      }
      if (isActionPlanRpcSelfValidationError(error)) {
        setActionError("Quem concluiu a ação não pode validá-la.");
        return;
      }
      setActionError("Não foi possível aprovar a ação.");
    }
  }

  async function handleReject() {
    setActionError(null);
    const trimmed = rejectNote.trim();

    if (trimmed.length < ACTION_ITEM_VALIDATION_NOTE_MIN_LENGTH) {
      setActionError(
        `Informe ao menos ${ACTION_ITEM_VALIDATION_NOTE_MIN_LENGTH} caracteres no motivo da rejeição.`,
      );
      return;
    }

    try {
      await validateMutation.mutateAsync({
        itemId: item.id,
        outcome: "REJECTED",
        note: trimmed,
      });
      setIsRejectOpen(false);
      setRejectNote("");
    } catch (error) {
      setIsRejectOpen(false);
      if (isActionPlanRpcConflictError(error)) {
        onConflict();
        return;
      }
      if (isActionPlanRpcValidationError(error)) {
        setActionError(error.message);
        return;
      }
      setActionError("Não foi possível rejeitar a ação.");
    }
  }

  if (item.status !== "AWAITING_VALIDATION") {
    return null;
  }

  return (
    <div className="mt-3 flex flex-col gap-3 rounded-md border border-gray-700/80 bg-gray-950/50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Validar ação</p>

      <div className="flex flex-col gap-1 text-sm text-gray-300">
        <span>
          {formatActionItemPriority(item.priority)} · {item.responsibleMemberName ?? "—"}
        </span>
        {item.completionDescription ? (
          <p className="text-gray-400">{item.completionDescription}</p>
        ) : null}
        <span className="text-xs text-gray-500">
          Concluída por {item.completedByName ?? "—"} em {formatDateTime(item.completedAt)}
        </span>
      </div>

      {completedAttachments.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {completedAttachments.map((attachment) => (
            <button
              key={attachment.id}
              className="rounded-md border border-gray-600 px-3 py-1.5 text-xs text-orange-300 hover:bg-gray-800"
              type="button"
              onClick={() => {
                void getActionItemAttachmentSignedUrl(attachment.id).then((url) => {
                  window.open(url, "_blank", "noopener,noreferrer");
                });
              }}
            >
              Ver evidência
            </button>
          ))}
        </div>
      ) : null}

      {showSelfValidationNotice ? (
        <p className="text-sm text-amber-200/90" role="status">
          Quem concluiu a ação não pode validá-la.
        </p>
      ) : null}

      {isOffline ? <ActionPlanOfflineNotice /> : null}

      {actionError ? (
        <p className="text-sm text-red-400" role="alert">
          {actionError}
        </p>
      ) : null}

      {canValidate ? (
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            className="w-full rounded-md border border-red-700 px-4 py-3 text-sm font-medium text-red-200 hover:bg-red-950/40 disabled:opacity-50"
            disabled={validateMutation.isPending || isOffline}
            type="button"
            onClick={() => {
              setActionError(null);
              setIsRejectOpen(true);
            }}
          >
            Rejeitar
          </button>
          <button
            className="w-full rounded-md bg-orange-500 px-4 py-3 text-sm font-medium text-white hover:bg-orange-400 disabled:opacity-50"
            disabled={validateMutation.isPending || isOffline}
            type="button"
            onClick={() => {
              setActionError(null);
              setIsApproveOpen(true);
            }}
          >
            Aprovar
          </button>
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
          <h2 className="text-lg font-semibold">Confirmar aprovação desta ação?</h2>
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
              disabled={validateMutation.isPending}
              type="submit"
            >
              Aprovar
            </button>
          </div>
        </form>
      </dialog>

      <dialog
        ref={rejectDialogRef}
        className="w-full max-w-md rounded-lg border border-gray-700 bg-gray-900 p-0 text-gray-100 backdrop:bg-black/60"
        onCancel={(event) => {
          event.preventDefault();
          setIsRejectOpen(false);
        }}
      >
        <form
          className="flex flex-col gap-4 p-6"
          method="dialog"
          onSubmit={(event) => {
            event.preventDefault();
            void handleReject();
          }}
        >
          <h2 className="text-lg font-semibold">Informe o motivo da rejeição.</h2>
          <label className="flex flex-col gap-2">
            <span className="text-sm text-gray-300">Motivo *</span>
            <textarea
              className="min-h-24 w-full rounded-md border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-gray-100"
              maxLength={ACTION_ITEM_VALIDATION_NOTE_MAX_LENGTH}
              value={rejectNote}
              onChange={(event) => {
                setRejectNote(event.target.value);
              }}
            />
            <span className="text-xs text-gray-500">
              {rejectNote.trim().length}/{ACTION_ITEM_VALIDATION_NOTE_MAX_LENGTH} (mín.{" "}
              {ACTION_ITEM_VALIDATION_NOTE_MIN_LENGTH})
            </span>
          </label>
          <div className="flex justify-end gap-3">
            <button
              className="rounded-md border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800"
              type="button"
              onClick={() => {
                setIsRejectOpen(false);
              }}
            >
              Cancelar
            </button>
            <button
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50"
              disabled={
                validateMutation.isPending ||
                rejectNote.trim().length < ACTION_ITEM_VALIDATION_NOTE_MIN_LENGTH
              }
              type="submit"
            >
              Rejeitar
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
