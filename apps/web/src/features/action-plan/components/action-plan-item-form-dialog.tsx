"use client";

import { useState } from "react";
import {
  ACTION_ITEM_DESCRIPTION_MAX_LENGTH,
  ACTION_ITEM_PRIORITIES,
  ACTION_ITEM_TITLE_MAX_LENGTH,
  type ActionItemPriority,
} from "@safestop/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { useAddActionItem } from "../hooks/use-add-action-item";
import { useOrganizationMembers } from "../hooks/use-organization-members";
import type { OrganizationMemberOption } from "../types";
import { formatActionItemPriority } from "../utils/format-labels";
import { ActionPlanOfflineNotice } from "./action-plan-states";

type ActionPlanItemFormDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  actionPlanId: string;
  occurrenceId: string;
  organizationId: string;
  isOffline: boolean;
  onConflict: () => void;
};

const TITLE_MIN_LENGTH = 3;
const DESCRIPTION_MIN_LENGTH = 10;

export function ActionPlanItemFormDialog({
  isOpen,
  onClose,
  actionPlanId,
  occurrenceId,
  organizationId,
  isOffline,
  onConflict,
}: ActionPlanItemFormDialogProps) {
  const addMutation = useAddActionItem(organizationId, occurrenceId, actionPlanId);
  const { members, isLoading: isLoadingMembers } = useOrganizationMembers(organizationId, isOpen);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [responsibleMemberId, setResponsibleMemberId] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [priority, setPriority] = useState<ActionItemPriority>("MEDIUM");
  const [formError, setFormError] = useState<string | null>(null);

  function resetForm() {
    setTitle("");
    setDescription("");
    setResponsibleMemberId("");
    setDueAt("");
    setPriority("MEDIUM");
    setFormError(null);
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  async function handleSubmit() {
    setFormError(null);

    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();

    if (trimmedTitle.length < TITLE_MIN_LENGTH) {
      setFormError("Informe um título para a ação.");
      return;
    }

    if (trimmedDescription.length < DESCRIPTION_MIN_LENGTH) {
      setFormError(`Descrição deve ter no mínimo ${DESCRIPTION_MIN_LENGTH} caracteres.`);
      return;
    }

    if (!responsibleMemberId) {
      setFormError("Selecione o responsável.");
      return;
    }

    if (!dueAt) {
      setFormError("Informe o prazo.");
      return;
    }

    const dueAtIso = new Date(dueAt).toISOString();

    try {
      await addMutation.mutateAsync({
        actionPlanId,
        title: trimmedTitle,
        description: trimmedDescription,
        responsibleMemberId,
        dueAt: dueAtIso,
        priority,
      });
      handleClose();
    } catch {
      handleClose();
      onConflict();
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
      <DialogContent className="max-h-[90vh] overflow-y-auto" showCloseButton={false}>
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            void handleSubmit();
          }}
        >
          <DialogHeader>
            <DialogTitle>Adicionar ação</DialogTitle>
          </DialogHeader>

          {isOffline ? <ActionPlanOfflineNotice /> : null}

          <label className="flex flex-col gap-2">
            <span className="text-sm text-muted-foreground">O que precisa ser feito? *</span>
            <Input
              maxLength={ACTION_ITEM_TITLE_MAX_LENGTH}
              placeholder="O que precisa ser feito?"
              value={title}
              onChange={(event) => {
                setTitle(event.target.value);
              }}
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm text-muted-foreground">Descrição *</span>
            <Textarea
              className="min-h-20"
              maxLength={ACTION_ITEM_DESCRIPTION_MAX_LENGTH}
              value={description}
              onChange={(event) => {
                setDescription(event.target.value);
              }}
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm text-muted-foreground">Responsável *</span>
            <select
              className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm text-foreground shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30"
              disabled={isLoadingMembers}
              value={responsibleMemberId}
              onChange={(event) => {
                setResponsibleMemberId(event.target.value);
              }}
            >
              <option value="">Selecione…</option>
              {members.map((member: OrganizationMemberOption) => (
                <option key={member.id} value={member.id}>
                  {member.fullName ?? member.id}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm text-muted-foreground">Prazo *</span>
            <Input
              type="datetime-local"
              value={dueAt}
              onChange={(event) => {
                setDueAt(event.target.value);
              }}
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm text-muted-foreground">Prioridade</span>
            <select
              className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm text-foreground shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30"
              value={priority}
              onChange={(event) => {
                setPriority(event.target.value as ActionItemPriority);
              }}
            >
              {ACTION_ITEM_PRIORITIES.map((level) => (
                <option key={level} value={level}>
                  {formatActionItemPriority(level)}
                </option>
              ))}
            </select>
          </label>

          {formError ? (
            <p className="text-sm text-destructive" role="alert">
              {formError}
            </p>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button disabled={addMutation.isPending || isOffline} type="submit">
              {addMutation.isPending ? "Salvando…" : "Adicionar ação"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
