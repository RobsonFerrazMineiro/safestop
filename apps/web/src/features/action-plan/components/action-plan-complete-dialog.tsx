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

type ActionPlanCompleteDialogProps = {
  isOpen: boolean;
  isPending: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function ActionPlanCompleteDialog({
  isOpen,
  isPending,
  onClose,
  onConfirm,
}: ActionPlanCompleteDialogProps) {
  return (
    <AlertDialog
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
      open={isOpen}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Concluir o Plano de Ação?</AlertDialogTitle>
          <AlertDialogDescription>
            Todas as ações elegíveis foram encerradas. A Paralisação Preventiva permanecerá em
            tratativa.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel type="button">Cancelar</AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            type="button"
            onClick={(event) => {
              event.preventDefault();
              onConfirm();
            }}
          >
            {isPending ? "Concluindo…" : "Concluir plano"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
