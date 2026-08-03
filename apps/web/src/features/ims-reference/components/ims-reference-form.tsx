"use client";

import { useEffect, useRef, useState } from "react";
import { isValidImsReferenceCode } from "@safestop/types";

import { isImsReferenceRpcConflictError, isImsReferenceRpcValidationError } from "../utils/ims-rpc";
import { useRegisterImsReference } from "../hooks/use-register-ims-reference";
import { ImsOfflineNotice } from "./ims-reference-states";

type ImsReferenceFormProps = {
  occurrenceId: string;
  organizationId: string;
  isOffline: boolean;
  onConflict: () => void;
  onAlreadyRegistered: () => void;
};

export function ImsReferenceForm({
  occurrenceId,
  organizationId,
  isOffline,
  onConflict,
  onAlreadyRegistered,
}: ImsReferenceFormProps) {
  const [imsReferenceCode, setImsReferenceCode] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const confirmDialogRef = useRef<HTMLDialogElement>(null);

  const registerMutation = useRegisterImsReference(occurrenceId, organizationId);
  const trimmedCode = imsReferenceCode.trim();
  const isFormatValid = trimmedCode.length > 0 && isValidImsReferenceCode(trimmedCode);

  useEffect(() => {
    const dialog = confirmDialogRef.current;
    if (!dialog) return;
    if (isConfirmOpen && !dialog.open) dialog.showModal();
    if (!isConfirmOpen && dialog.open) dialog.close();
  }, [isConfirmOpen]);

  function openConfirm() {
    setValidationError(null);
    setActionError(null);

    if (!isValidImsReferenceCode(trimmedCode)) {
      setValidationError("Use o formato BAA-XX-0000 (ex.: BAA-26-0001).");
      return;
    }

    setIsConfirmOpen(true);
  }

  async function handleRegister() {
    setActionError(null);

    try {
      await registerMutation.mutateAsync({
        occurrenceId,
        imsReferenceCode: trimmedCode,
      });
      setIsConfirmOpen(false);
      setImsReferenceCode("");
    } catch (error) {
      setIsConfirmOpen(false);

      if (isImsReferenceRpcConflictError(error)) {
        if (error.conflict.code === "ALREADY_REGISTERED") {
          onAlreadyRegistered();
          return;
        }
        onConflict();
        return;
      }

      if (isImsReferenceRpcValidationError(error)) {
        setValidationError(error.message);
        return;
      }

      setActionError("Não foi possível registrar a referência IMS.");
    }
  }

  const helperId = "ims-reference-code-helper";
  const errorId = "ims-reference-code-error";

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-gray-400" id={helperId}>
        Informe o código gerado no sistema IMS da Hydro. O SafeStop não consulta o IMS.
      </p>

      <label className="flex max-w-md flex-col gap-2">
        <span className="text-sm font-medium text-gray-200">Código IMS</span>
        <input
          aria-describedby={`${helperId}${validationError ? ` ${errorId}` : ""}`}
          aria-invalid={validationError !== null}
          className="w-full rounded-md border border-gray-700 bg-gray-950 px-3 py-2 font-mono text-sm text-gray-100"
          placeholder="BAA-26-0001"
          value={imsReferenceCode}
          onChange={(event) => {
            setImsReferenceCode(event.target.value);
            setValidationError(null);
            setActionError(null);
          }}
        />
        <span className="text-xs text-gray-500">Formato: BAA-XX-0000</span>
        {validationError ? (
          <span className="text-sm text-red-400" id={errorId} role="alert">
            {validationError}
          </span>
        ) : null}
      </label>

      {isOffline ? <ImsOfflineNotice /> : null}

      {actionError ? (
        <p className="text-sm text-red-400" role="alert">
          {actionError}
        </p>
      ) : null}

      <button
        className="w-full max-w-md rounded-md bg-orange-500 px-4 py-3 text-sm font-medium text-white hover:bg-orange-400 disabled:opacity-50 sm:w-auto"
        disabled={registerMutation.isPending || isOffline || !isFormatValid}
        type="button"
        onClick={openConfirm}
      >
        {registerMutation.isPending ? "Registrando…" : "Registrar referência IMS"}
      </button>

      <dialog
        ref={confirmDialogRef}
        className="w-full max-w-md rounded-lg border border-gray-700 bg-gray-900 p-0 text-gray-100 backdrop:bg-black/60"
        onCancel={(event) => {
          event.preventDefault();
          setIsConfirmOpen(false);
        }}
      >
        <form
          className="flex flex-col gap-4 p-6"
          method="dialog"
          onSubmit={(event) => {
            event.preventDefault();
            void handleRegister();
          }}
        >
          <h2 className="text-lg font-semibold">Registrar referência IMS?</h2>
          <p className="font-mono text-sm text-gray-200">Código: {trimmedCode}</p>
          <p className="text-sm text-gray-400">
            A ocorrência passará para Em Tratativa. O SafeStop não valida este código no sistema
            IMS.
          </p>
          <div className="flex justify-end gap-3">
            <button
              className="rounded-md border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800"
              type="button"
              onClick={() => {
                setIsConfirmOpen(false);
              }}
            >
              Cancelar
            </button>
            <button
              className="rounded-md bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-400 disabled:opacity-50"
              disabled={registerMutation.isPending}
              type="submit"
            >
              Registrar referência IMS
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
