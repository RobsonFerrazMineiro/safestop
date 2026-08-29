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

type CommentDeleteDialogProps = {
  isOpen: boolean;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function CommentDeleteDialog({
  isOpen,
  isDeleting,
  onConfirm,
  onCancel,
}: CommentDeleteDialogProps) {
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
          <AlertDialogTitle>Remover comentário?</AlertDialogTitle>
          <AlertDialogDescription>
            O texto deixará de ser exibido. A timeline mostrará &quot;Comentário removido&quot; para
            manter a rastreabilidade.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting} type="button">
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={isDeleting}
            type="button"
            variant="destructive"
            onClick={(event) => {
              event.preventDefault();
              onConfirm();
            }}
          >
            {isDeleting ? "Removendo..." : "Remover"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
