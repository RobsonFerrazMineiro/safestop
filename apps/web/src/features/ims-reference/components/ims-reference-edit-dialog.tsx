"use client";

import { useState } from "react";
import {
  IMS_UPDATE_REASON_MAX_LENGTH,
  IMS_UPDATE_REASON_MIN_LENGTH,
  isValidImsReferenceCode,
} from "@safestop/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { isImsReferenceRpcConflictError, isImsReferenceRpcValidationError } from "../utils/ims-rpc";
import { useUpdateImsReference } from "../hooks/use-update-ims-reference";
import { ImsOfflineNotice } from "./ims-reference-states";

type ImsReferenceEditDialogProps = {
  occurrenceId: string;
  organizationId: string;
  currentCode: string;
  isOpen: boolean;
  isOffline: boolean;
  onClose: () => void;
  onConflict: () => void;
};

export function ImsReferenceEditDialog({
  occurrenceId,
  organizationId,
  currentCode,
  isOpen,
  isOffline,
  onClose,
  onConflict,
}: ImsReferenceEditDialogProps) {
  const [newCode, setNewCode] = useState("");
  const [updateReason, setUpdateReason] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const updateMutation = useUpdateImsReference(occurrenceId, organizationId);

  const trimmedCode = newCode.trim();
  const trimmedReason = updateReason.trim();
  const reasonLength = trimmedReason.length;

  function resetForm() {
    setNewCode("");
    setUpdateReason("");
    setValidationError(null);
    setActionError(null);
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  async function handleSave() {
    setValidationError(null);
    setActionError(null);

    if (!isValidImsReferenceCode(trimmedCode)) {
      setValidationError("Use o formato BAA-XX-0000 (ex.: BAA-26-0001).");
      return;
    }

    if (trimmedCode === currentCode) {
      setValidationError("Novo código IMS deve ser diferente do código atual.");
      return;
    }

    if (reasonLength < IMS_UPDATE_REASON_MIN_LENGTH) {
      setValidationError("Informe um motivo com pelo menos 10 caracteres.");
      return;
    }

    try {
      await updateMutation.mutateAsync({
        occurrenceId,
        imsReferenceCode: trimmedCode,
        updateReason: trimmedReason,
      });
      handleClose();
    } catch (error) {
      if (isImsReferenceRpcConflictError(error)) {
        handleClose();
        onConflict();
        return;
      }

      if (isImsReferenceRpcValidationError(error)) {
        setValidationError(error.message);
        return;
      }

      setActionError("Não foi possível corrigir a referência IMS.");
    }
  }

  return (
    <Dialog
      onOpenChange={(open) => {
        if (!open) {
          handleClose();
        }
      }}
      open={isOpen}
    >
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            void handleSave();
          }}
        >
          <DialogHeader>
            <DialogTitle>Corrigir referência IMS</DialogTitle>
            <DialogDescription>
              Código atual: <span className="font-mono text-foreground">{currentCode}</span>
            </DialogDescription>
          </DialogHeader>

          <label className="flex flex-col gap-2">
            <span className="text-sm text-muted-foreground">Novo código *</span>
            <Input
              aria-invalid={validationError !== null}
              className="font-mono"
              placeholder="BAA-26-0001"
              value={newCode}
              onChange={(event) => {
                setNewCode(event.target.value);
                setValidationError(null);
              }}
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm text-muted-foreground">Motivo da correção *</span>
            <Textarea
              className="min-h-24"
              maxLength={IMS_UPDATE_REASON_MAX_LENGTH}
              value={updateReason}
              onChange={(event) => {
                setUpdateReason(event.target.value);
                setValidationError(null);
              }}
            />
            <span className="text-xs text-muted-foreground">
              {reasonLength}/{IMS_UPDATE_REASON_MAX_LENGTH} (mín. {IMS_UPDATE_REASON_MIN_LENGTH})
            </span>
          </label>

          {isOffline ? <ImsOfflineNotice /> : null}

          {validationError ? (
            <p className="text-sm text-destructive" role="alert">
              {validationError}
            </p>
          ) : null}

          {actionError ? (
            <p className="text-sm text-destructive" role="alert">
              {actionError}
            </p>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              disabled={
                updateMutation.isPending ||
                isOffline ||
                reasonLength < IMS_UPDATE_REASON_MIN_LENGTH ||
                trimmedCode.length === 0
              }
              type="submit"
            >
              {updateMutation.isPending ? "Salvando…" : "Salvar correção"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
