"use client";

import { useState } from "react";
import { ACTION_ITEM_COMPLETION_DESCRIPTION_MAX_LENGTH } from "@safestop/types";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
    <Dialog
      onOpenChange={(open) => {
        if (!open) {
          handleClose();
        }
      }}
      open={isOpen}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto" showCloseButton={false}>
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            void handleSubmit();
          }}
        >
          <DialogHeader>
            <DialogTitle>Concluir ação</DialogTitle>
            <DialogDescription>{item.title}</DialogDescription>
          </DialogHeader>

          {isOffline ? <ActionPlanOfflineNotice /> : null}

          <label className="flex flex-col gap-2">
            <span className="text-sm text-muted-foreground">Descrição da conclusão *</span>
            <Textarea
              className="min-h-24"
              maxLength={ACTION_ITEM_COMPLETION_DESCRIPTION_MAX_LENGTH}
              value={completionDescription}
              onChange={(event) => {
                setCompletionDescription(event.target.value);
              }}
            />
            <span className="text-xs text-muted-foreground">
              {trimmedLength}/{ACTION_ITEM_COMPLETION_DESCRIPTION_MAX_LENGTH} (mín.{" "}
              {COMPLETION_MIN_LENGTH})
            </span>
          </label>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Evidências</span>
              <span className="text-xs text-muted-foreground">
                {attachmentCount}/{MAX_ATTACHMENTS}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {evidenceRequired
                ? "Obrigatório para prioridade Alta ou Crítica"
                : "Opcional para esta prioridade"}
            </p>

            <div className="flex flex-wrap gap-2">
              {completedAttachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className={`${EVIDENCE_TILE_SIZE_CLASS} flex items-center justify-center rounded-xl border border-border bg-card/60 text-xs text-muted-foreground`}
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
              <p className="text-xs text-muted-foreground">Enviando… {uploadProgress}%</p>
            ) : null}
          </div>

          {formError ? (
            <p className="text-sm text-destructive" role="alert">
              {formError}
            </p>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              disabled={
                isPending ||
                isOffline ||
                trimmedLength < COMPLETION_MIN_LENGTH ||
                !hasEnoughEvidence
              }
              type="submit"
            >
              {submitMutation.isPending ? "Enviando…" : "Enviar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
