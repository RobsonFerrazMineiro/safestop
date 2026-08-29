"use client";

import { useState } from "react";
import { isValidImsReferenceCode } from "@safestop/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

  const registerMutation = useRegisterImsReference(occurrenceId, organizationId);
  const trimmedCode = imsReferenceCode.trim();
  const isFormatValid = trimmedCode.length > 0 && isValidImsReferenceCode(trimmedCode);

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
      <p className="text-sm text-muted-foreground" id={helperId}>
        Informe o código gerado no sistema IMS da Hydro. O SafeStop não consulta o IMS.
      </p>

      <label className="flex max-w-md flex-col gap-2">
        <span className="text-sm font-medium text-foreground">Código IMS</span>
        <Input
          aria-describedby={`${helperId}${validationError ? ` ${errorId}` : ""}`}
          aria-invalid={validationError !== null}
          className="font-mono"
          placeholder="BAA-26-0001"
          value={imsReferenceCode}
          onChange={(event) => {
            setImsReferenceCode(event.target.value);
            setValidationError(null);
            setActionError(null);
          }}
        />
        <span className="text-xs text-muted-foreground">Formato: BAA-XX-0000</span>
        {validationError ? (
          <span className="text-sm text-destructive" id={errorId} role="alert">
            {validationError}
          </span>
        ) : null}
      </label>

      {isOffline ? <ImsOfflineNotice /> : null}

      {actionError ? (
        <p className="text-sm text-destructive" role="alert">
          {actionError}
        </p>
      ) : null}

      <Button
        className="w-full max-w-md sm:w-auto"
        disabled={registerMutation.isPending || isOffline || !isFormatValid}
        type="button"
        onClick={openConfirm}
      >
        {registerMutation.isPending ? "Registrando…" : "Registrar referência IMS"}
      </Button>

      <AlertDialog
        onOpenChange={(open) => {
          if (!open) {
            setIsConfirmOpen(false);
          }
        }}
        open={isConfirmOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Registrar referência IMS?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <p className="font-mono text-foreground">Código: {trimmedCode}</p>
                <p className="mt-2">
                  A Paralisação Preventiva passará para Em Tratativa. O SafeStop não valida este
                  código no sistema IMS.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel type="button">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={registerMutation.isPending}
              type="button"
              onClick={(event) => {
                event.preventDefault();
                void handleRegister();
              }}
            >
              Registrar referência IMS
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
