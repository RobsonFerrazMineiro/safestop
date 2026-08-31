"use client";

import { useState } from "react";

import { ListChecks } from "lucide-react";

import { SurfaceIcon } from "@/components/surface-icon";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { useCreateActionPlan } from "../hooks/use-create-action-plan";
import { ActionPlanOfflineNotice } from "./action-plan-states";

type ActionPlanEmptyProps = {
  occurrenceId: string;
  organizationId: string;
  isOffline: boolean;
  onConflict: () => void;
};

export function ActionPlanEmpty({
  occurrenceId,
  organizationId,
  isOffline,
  onConflict,
}: ActionPlanEmptyProps) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const createMutation = useCreateActionPlan(organizationId, occurrenceId);

  async function handleCreate() {
    setActionError(null);
    try {
      await createMutation.mutateAsync({ occurrenceId });
      setIsConfirmOpen(false);
    } catch {
      setIsConfirmOpen(false);
      onConflict();
    }
  }

  return (
    <div className="flex flex-col items-start gap-4 rounded-lg border border-dashed border-border bg-card/30 px-4 py-6">
      <SurfaceIcon className="text-muted-foreground" icon={ListChecks} variant="empty" />
      <div className="flex flex-col gap-1">
        <p className="text-base font-medium text-foreground">Nenhum Plano de Ação</p>
        <p className="text-sm text-muted-foreground">
          Defina ações corretivas com responsável e prazo.
        </p>
      </div>

      {isOffline ? <ActionPlanOfflineNotice /> : null}
      {actionError ? (
        <p className="text-sm text-destructive" role="alert">
          {actionError}
        </p>
      ) : null}

      <Button
        disabled={createMutation.isPending || isOffline}
        type="button"
        onClick={() => {
          setIsConfirmOpen(true);
        }}
      >
        {createMutation.isPending ? "Criando…" : "Criar Plano de Ação"}
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
            <AlertDialogTitle>Criar Plano de Ação para esta interdição?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel type="button">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={createMutation.isPending}
              type="button"
              onClick={(event) => {
                event.preventDefault();
                void handleCreate();
              }}
            >
              Criar Plano de Ação
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
