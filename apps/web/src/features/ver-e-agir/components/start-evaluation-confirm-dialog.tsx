"use client";

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

type StartEvaluationConfirmDialogProps = {
  isOpen: boolean;
  isPending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function StartEvaluationConfirmDialog({
  isOpen,
  isPending,
  onConfirm,
  onCancel,
}: StartEvaluationConfirmDialogProps) {
  return (
    <AlertDialog
      onOpenChange={(open) => {
        if (!open) {
          onCancel();
        }
      }}
      open={isOpen}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Iniciar avaliação desta paralisação?</AlertDialogTitle>
          <AlertDialogDescription>
            A ocorrência passará para Em Avaliação para registro da decisão da liderança.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending} type="button">
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            type="button"
            onClick={(event) => {
              event.preventDefault();
              onConfirm();
            }}
          >
            {isPending ? "Iniciando…" : "Iniciar avaliação"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
