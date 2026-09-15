"use client";

import { useState } from "react";
import {
  ACTION_ITEM_VALIDATION_NOTE_MAX_LENGTH,
  ACTION_ITEM_VALIDATION_NOTE_MIN_LENGTH,
} from "@safestop/types";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { useActionItemAttachments } from "../hooks/use-action-item-attachments";
import { useValidateActionItem } from "../hooks/use-validate-action-item";
import { getActionItemAttachmentSignedUrl } from "../services/get-action-item-attachment-signed-url";
import { openEvidenceSignedUrl } from "@/features/evidence/utils/open-evidence-signed-url";
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

  const validateMutation = useValidateActionItem(organizationId, occurrenceId, planId, item.id);
  const { completedAttachments } = useActionItemAttachments(organizationId, item.id, true);

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
    <div className="mt-3 flex flex-col gap-3 rounded-md border border-border/80 bg-card/50 p-3">
      <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        Validar ação
      </p>

      <div className="flex flex-col gap-1 text-sm text-foreground">
        <span>
          {formatActionItemPriority(item.priority)} · {item.responsibleMemberName ?? "—"}
        </span>
        {item.completionDescription ? (
          <p className="text-muted-foreground">{item.completionDescription}</p>
        ) : null}
        <span className="text-xs text-muted-foreground">
          Concluída por {item.completedByName ?? "—"} em {formatDateTime(item.completedAt)}
        </span>
      </div>

      {completedAttachments.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {completedAttachments.map((attachment) => (
            <Button
              key={attachment.id}
              size="sm"
              type="button"
              variant="outline"
              onClick={() => {
                void getActionItemAttachmentSignedUrl(attachment.id).then((url) => {
                  openEvidenceSignedUrl(url);
                });
              }}
            >
              {attachment.mimeType === "application/pdf"
                ? `Abrir PDF · ${attachment.originalFileName}`
                : `Ver evidência · ${attachment.originalFileName}`}
            </Button>
          ))}
        </div>
      ) : null}

      {showSelfValidationNotice ? (
        <p className="text-sm text-status-warning-fg" role="status">
          Quem concluiu a ação não pode validá-la.
        </p>
      ) : null}

      {isOffline ? <ActionPlanOfflineNotice /> : null}

      {actionError ? (
        <p className="text-sm text-destructive" role="alert">
          {actionError}
        </p>
      ) : null}

      {canValidate ? (
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            className="w-full"
            disabled={validateMutation.isPending || isOffline}
            type="button"
            variant="destructive"
            onClick={() => {
              setActionError(null);
              setIsRejectOpen(true);
            }}
          >
            Rejeitar
          </Button>
          <Button
            className="w-full"
            disabled={validateMutation.isPending || isOffline}
            type="button"
            onClick={() => {
              setActionError(null);
              setIsApproveOpen(true);
            }}
          >
            Aprovar
          </Button>
        </div>
      ) : null}

      <AlertDialog
        onOpenChange={(open) => {
          if (!open) {
            setIsApproveOpen(false);
          }
        }}
        open={isApproveOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar aprovação desta ação?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel type="button">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={validateMutation.isPending}
              type="button"
              onClick={(event) => {
                event.preventDefault();
                void handleApprove();
              }}
            >
              Aprovar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        onOpenChange={(open) => {
          if (!open) {
            setIsRejectOpen(false);
          }
        }}
        open={isRejectOpen}
      >
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <form
            className="flex flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              void handleReject();
            }}
          >
            <DialogHeader>
              <DialogTitle>Informe o motivo da rejeição.</DialogTitle>
            </DialogHeader>
            <label className="flex flex-col gap-2">
              <span className="text-sm text-muted-foreground">Motivo *</span>
              <Textarea
                className="min-h-24"
                maxLength={ACTION_ITEM_VALIDATION_NOTE_MAX_LENGTH}
                value={rejectNote}
                onChange={(event) => {
                  setRejectNote(event.target.value);
                }}
              />
              <span className="text-xs text-muted-foreground">
                {rejectNote.trim().length}/{ACTION_ITEM_VALIDATION_NOTE_MAX_LENGTH} (mín.{" "}
                {ACTION_ITEM_VALIDATION_NOTE_MIN_LENGTH})
              </span>
            </label>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsRejectOpen(false);
                }}
              >
                Cancelar
              </Button>
              <Button
                disabled={
                  validateMutation.isPending ||
                  rejectNote.trim().length < ACTION_ITEM_VALIDATION_NOTE_MIN_LENGTH
                }
                type="submit"
                variant="destructive"
              >
                Rejeitar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
