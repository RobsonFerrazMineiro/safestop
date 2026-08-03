"use client";

import { useEffect, useRef, useState } from "react";
import {
  IMS_UPDATE_REASON_MAX_LENGTH,
  IMS_UPDATE_REASON_MIN_LENGTH,
  isValidImsReferenceCode,
} from "@safestop/types";

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
  const dialogRef = useRef<HTMLDialogElement>(null);

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

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

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
    <dialog
      ref={dialogRef}
      className="w-full max-w-md rounded-lg border border-gray-700 bg-gray-900 p-0 text-gray-100 backdrop:bg-black/60"
      onCancel={(event) => {
        event.preventDefault();
        handleClose();
      }}
    >
      <form
        className="flex flex-col gap-4 p-6"
        method="dialog"
        onSubmit={(event) => {
          event.preventDefault();
          void handleSave();
        }}
      >
        <h2 className="text-lg font-semibold">Corrigir referência IMS</h2>

        <p className="text-sm text-gray-400">
          Código atual: <span className="font-mono text-gray-200">{currentCode}</span>
        </p>

        <label className="flex flex-col gap-2">
          <span className="text-sm text-gray-300">Novo código *</span>
          <input
            aria-invalid={validationError !== null}
            className="w-full rounded-md border border-gray-700 bg-gray-950 px-3 py-2 font-mono text-sm text-gray-100"
            placeholder="BAA-26-0001"
            value={newCode}
            onChange={(event) => {
              setNewCode(event.target.value);
              setValidationError(null);
            }}
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm text-gray-300">Motivo da correção *</span>
          <textarea
            className="min-h-24 w-full rounded-md border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-gray-100"
            maxLength={IMS_UPDATE_REASON_MAX_LENGTH}
            value={updateReason}
            onChange={(event) => {
              setUpdateReason(event.target.value);
              setValidationError(null);
            }}
          />
          <span className="text-xs text-gray-500">
            {reasonLength}/{IMS_UPDATE_REASON_MAX_LENGTH} (mín. {IMS_UPDATE_REASON_MIN_LENGTH})
          </span>
        </label>

        {isOffline ? <ImsOfflineNotice /> : null}

        {validationError ? (
          <p className="text-sm text-red-400" role="alert">
            {validationError}
          </p>
        ) : null}

        {actionError ? (
          <p className="text-sm text-red-400" role="alert">
            {actionError}
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
              updateMutation.isPending ||
              isOffline ||
              reasonLength < IMS_UPDATE_REASON_MIN_LENGTH ||
              trimmedCode.length === 0
            }
            type="submit"
          >
            {updateMutation.isPending ? "Salvando…" : "Salvar correção"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
