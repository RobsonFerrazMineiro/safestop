"use client";

import { useEffect, useRef, useState } from "react";
import {
  ACTION_ITEM_DESCRIPTION_MAX_LENGTH,
  ACTION_ITEM_PRIORITIES,
  ACTION_ITEM_TITLE_MAX_LENGTH,
  type ActionItemPriority,
} from "@safestop/types";

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
  const dialogRef = useRef<HTMLDialogElement>(null);
  const addMutation = useAddActionItem(organizationId, occurrenceId, actionPlanId);
  const { members, isLoading: isLoadingMembers } = useOrganizationMembers(organizationId, isOpen);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [responsibleMemberId, setResponsibleMemberId] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [priority, setPriority] = useState<ActionItemPriority>("MEDIUM");
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

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
    <dialog
      ref={dialogRef}
      className="w-full max-w-lg rounded-lg border border-gray-700 bg-gray-900 p-0 text-gray-100 backdrop:bg-black/60"
      onCancel={(event) => {
        event.preventDefault();
        handleClose();
      }}
    >
      <form
        className="flex max-h-[90vh] flex-col gap-4 overflow-y-auto p-6"
        method="dialog"
        onSubmit={(event) => {
          event.preventDefault();
          void handleSubmit();
        }}
      >
        <h2 className="text-lg font-semibold">Adicionar ação</h2>

        {isOffline ? <ActionPlanOfflineNotice /> : null}

        <label className="flex flex-col gap-2">
          <span className="text-sm text-gray-300">O que precisa ser feito? *</span>
          <input
            className="w-full rounded-md border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-gray-100"
            maxLength={ACTION_ITEM_TITLE_MAX_LENGTH}
            placeholder="O que precisa ser feito?"
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
            }}
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm text-gray-300">Descrição *</span>
          <textarea
            className="min-h-20 w-full rounded-md border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-gray-100"
            maxLength={ACTION_ITEM_DESCRIPTION_MAX_LENGTH}
            value={description}
            onChange={(event) => {
              setDescription(event.target.value);
            }}
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm text-gray-300">Responsável *</span>
          <select
            className="w-full rounded-md border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-gray-100"
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
          <span className="text-sm text-gray-300">Prazo *</span>
          <input
            className="w-full rounded-md border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-gray-100"
            type="datetime-local"
            value={dueAt}
            onChange={(event) => {
              setDueAt(event.target.value);
            }}
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm text-gray-300">Prioridade</span>
          <select
            className="w-full rounded-md border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-gray-100"
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
          <p className="text-sm text-red-400" role="alert">
            {formError}
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
            disabled={addMutation.isPending || isOffline}
            type="submit"
          >
            {addMutation.isPending ? "Salvando…" : "Adicionar ação"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
