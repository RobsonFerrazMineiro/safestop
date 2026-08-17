"use client";

import { useEffect, useRef, useState } from "react";
import { ACTION_ITEM_COMPLETION_DESCRIPTION_MAX_LENGTH } from "@safestop/types";

import { EvidenceUploader } from "@/features/evidence/components/evidence-uploader";
import { EVIDENCE_TILE_SIZE_CLASS } from "@/features/evidence/types";

import { useActionItemAttachments } from "../hooks/use-action-item-attachments";
import { useSubmitActionItem } from "../hooks/use-submit-action-item";
import { useUploadActionItemEvidence } from "../hooks/use-upload-action-item-evidence";
import type { ActionItemEnriched } from "../types";
import {
  isActionPlanRpcConflictError,
  isActionPlanRpcValidationError,
} from "../utils/action-plan-rpc";
import { ActionPlanOfflineNotice } from "./action-plan-states";

const MAX_ATTACHMENTS = 20;
const COMPLETION_MIN_LENGTH = 10;

type ActionPlanSubmitDialogProps = {
  item: ActionItemEnriched;
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  occurrenceId: string;
  planId: string;
  isOffline: boolean;
  onConflict: () => void;
};

function requiresEvidence(priority: ActionItemEnriched["priority"]): boolean {
  return priority === "HIGH" || priority === "CRITICAL";
}

export function ActionPlanSubmitDialog({
  item,
  isOpen,
  onClose,
  organizationId,
  occurrenceId,
  planId,
  isOffline,
  onConflict,
}: ActionPlanSubmitDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [completionDescription, setCompletionDescription] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const submitMutation = useSubmitActionItem(organizationId, occurrenceId, planId, item.id);
  const uploadMutation = useUploadActionItemEvidence(organizationId, occurrenceId, planId, item.id);
  const { completedAttachments, refetch: refetchAttachments } = useActionItemAttachments(
    organizationId,
    item.id,
    isOpen,
  );

  const evidenceRequired = requiresEvidence(item.priority);
  const attachmentCount = completedAttachments.length;
  const hasEnoughEvidence = !evidenceRequired || attachmentCount >= 1;
  const canAddMore = attachmentCount < MAX_ATTACHMENTS;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  function handleClose() {
    setCompletionDescription("");
    setFormError(null);
    setUploadProgress(null);
    onClose();
  }

  async function handleSelectFiles(files: FileList | File[]) {
    if (isOffline || !canAddMore) return;

    setFormError(null);
    const fileList = Array.from(files).slice(0, MAX_ATTACHMENTS - attachmentCount);

    for (const file of fileList) {
      setUploadProgress(0);
      try {
        await uploadMutation.mutateAsync({
          file,
          onProgress: setUploadProgress,
        });
        await refetchAttachments();
      } catch {
        setFormError("Não foi possível enviar a evidência.");
        break;
      } finally {
        setUploadProgress(null);
      }
    }
  }

  async function handleSubmit() {
    setFormError(null);

    const trimmed = completionDescription.trim();

    if (trimmed.length < COMPLETION_MIN_LENGTH) {
      setFormError(
        `Descrição da conclusão deve ter no mínimo ${COMPLETION_MIN_LENGTH} caracteres.`,
      );
      return;
    }

    if (evidenceRequired && attachmentCount < 1) {
      setFormError("Anexe ao menos uma evidência para esta prioridade.");
      return;
    }

    try {
      await submitMutation.mutateAsync({
        itemId: item.id,
        completionDescription: trimmed,
      });
      handleClose();
    } catch (error) {
      if (isActionPlanRpcConflictError(error)) {
        handleClose();
        onConflict();
        return;
      }
      if (isActionPlanRpcValidationError(error)) {
        setFormError(error.message);
        return;
      }
      setFormError("Não foi possível concluir a ação.");
    }
  }

  const trimmedLength = completionDescription.trim().length;
  const isPending = submitMutation.isPending || uploadMutation.isPending;

  return (
    <dialog
      ref={dialogRef}
      className="w-full max-w-lg rounded-lg border border-gray-700 bg-gray-900 p-0 text-gray-100 backdrop:bg-black/60"
      onCancel={(event) => {
        event.preventDefault();
        handleClose();
      }}
    >
      <form
        className="flex max-h-[90vh] flex-col gap-4 overflow-y-auto p-6"
        method="dialog"
        onSubmit={(event) => {
          event.preventDefault();
          void handleSubmit();
        }}
      >
        <h2 className="text-lg font-semibold">Concluir ação</h2>
        <p className="text-sm text-gray-400">{item.title}</p>

        {isOffline ? <ActionPlanOfflineNotice /> : null}

        <label className="flex flex-col gap-2">
          <span className="text-sm text-gray-300">Descrição da conclusão *</span>
          <textarea
            className="min-h-24 w-full rounded-md border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-gray-100"
            maxLength={ACTION_ITEM_COMPLETION_DESCRIPTION_MAX_LENGTH}
            value={completionDescription}
            onChange={(event) => {
              setCompletionDescription(event.target.value);
            }}
          />
          <span className="text-xs text-gray-500">
            {trimmedLength}/{ACTION_ITEM_COMPLETION_DESCRIPTION_MAX_LENGTH} (mín.{" "}
            {COMPLETION_MIN_LENGTH})
          </span>
        </label>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-300">Evidências</span>
            <span className="text-xs text-gray-500">
              {attachmentCount}/{MAX_ATTACHMENTS}
            </span>
          </div>
          <p className="text-xs text-gray-500">
            {evidenceRequired
              ? "Obrigatório para prioridade Alta ou Crítica"
              : "Opcional para esta prioridade"}
          </p>

          <div className="flex flex-wrap gap-2">
            {completedAttachments.map((attachment) => (
              <div
                key={attachment.id}
                className={`${EVIDENCE_TILE_SIZE_CLASS} flex items-center justify-center rounded-xl border border-gray-700 bg-gray-950/60 text-xs text-gray-400`}
              >
                OK
              </div>
            ))}
            {canAddMore ? (
              <EvidenceUploader
                disabled={isOffline || isPending}
                onSelectFiles={handleSelectFiles}
              />
            ) : null}
          </div>

          {uploadProgress !== null ? (
            <p className="text-xs text-gray-400">Enviando… {uploadProgress}%</p>
          ) : null}
        </div>

        {formError ? (
          <p className="text-sm text-red-400" role="alert">
            {formError}
          </p>
        ) : null}

        <div className="flex justify-end gap-3">
          <button
            className="rounded-md border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800"
            type="button"
            onClick={handleClose}
          >
            Cancelar
          </button>
          <button
            className="rounded-md bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-400 disabled:opacity-50"
            disabled={
              isPending || isOffline || trimmedLength < COMPLETION_MIN_LENGTH || !hasEnoughEvidence
            }
            type="submit"
          >
            {submitMutation.isPending ? "Enviando…" : "Enviar"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
