"use client";

import { Can } from "@/features/authorization";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { useEvidenceSignedUrl } from "../hooks/use-evidence";
import type { EvidenceListItem } from "../types";

type EvidencePreviewModalProps = {
  occurrenceId: string;
  evidence: EvidenceListItem | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete?: (item: EvidenceListItem) => void;
};

function formatEvidenceDate(value: string): string {
  return new Date(value).toLocaleString("pt-BR");
}

export function EvidencePreviewModal({
  occurrenceId,
  evidence,
  isOpen,
  onClose,
  onDelete,
}: EvidencePreviewModalProps) {
  const { signedUrl, isLoading, isError, refetch } = useEvidenceSignedUrl(
    occurrenceId,
    isOpen ? evidence?.id : null,
  );

  if (!evidence) {
    return null;
  }

  return (
    <Dialog
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
      open={isOpen}
    >
      <DialogContent className="sm:max-w-4xl" showCloseButton={false}>
        <div className="flex flex-col gap-4">
          <header className="flex items-start justify-between gap-4">
            <DialogHeader className="min-w-0 text-left">
              <p className="text-xs tracking-wide text-muted-foreground uppercase">
                Evidência inicial
              </p>
              <DialogTitle className="truncate">{evidence.originalFileName}</DialogTitle>
              <DialogDescription>
                Por {evidence.uploadedByName ?? "—"} · {formatEvidenceDate(evidence.createdAt)}
              </DialogDescription>
              {evidence.caption ? (
                <p className="mt-1 text-sm text-foreground">{evidence.caption}</p>
              ) : null}
            </DialogHeader>
            <Button
              aria-label="Fechar visualização"
              size="sm"
              type="button"
              variant="outline"
              onClick={onClose}
            >
              ✕
            </Button>
          </header>

          <div className="flex min-h-[240px] items-center justify-center rounded-md border border-border bg-background/40">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Carregando imagem...</p>
            ) : isError || !signedUrl ? (
              <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
                <p>Não foi possível carregar a imagem.</p>
                <Button
                  type="button"
                  variant="link"
                  onClick={() => {
                    void refetch();
                  }}
                >
                  Tentar novamente
                </Button>
              </div>
            ) : (
              <img
                alt={evidence.caption ?? evidence.originalFileName}
                className="max-h-[70vh] w-full object-contain"
                src={signedUrl}
              />
            )}
          </div>

          {onDelete ? (
            <Can permission="occurrence.create">
              <div className="flex justify-end">
                <Button type="button" variant="destructive" onClick={() => onDelete(evidence)}>
                  Remover
                </Button>
              </div>
            </Can>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
