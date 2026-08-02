"use client";

import { useEffect, useRef, useState } from "react";
import type { MdhoCatalogCategory } from "@safestop/types";

import { isMdhoRpcConflictError, isMdhoRpcValidationError } from "../utils/mdho-rpc";
import { useApproveMdhoAssessment } from "../hooks/use-approve-mdho-assessment";
import { useReturnMdhoAssessment } from "../hooks/use-return-mdho-assessment";
import type { MdhoAssessmentEnriched } from "../types";
import { MdhoOfflineNotice } from "./mdho-states";

type MdhoReviewPanelProps = {
  assessment: MdhoAssessmentEnriched;
  categories: MdhoCatalogCategory[];
  occurrenceId: string;
  organizationId: string;
  canApprove: boolean;
  canReturn: boolean;
  isOffline: boolean;
  onConflict: () => void;
};

function formatDateTime(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("pt-BR");
}

function resolveSelectionLabels(
  assessment: MdhoAssessmentEnriched,
  categories: MdhoCatalogCategory[],
): Array<{ categoryName: string; labels: string[] }> {
  return categories.map((category) => {
    const selectedOptionIds = new Set(
      (assessment.selections ?? [])
        .filter((selection) => selection.categoryId === category.id)
        .map((selection) => selection.optionId),
    );

    const labels = category.options
      .filter((option) => selectedOptionIds.has(option.id))
      .map((option) => {
        const selection = assessment.selections?.find(
          (item) => item.categoryId === category.id && item.optionId === option.id,
        );
        if (selection?.detail?.trim()) {
          return `${option.label}: ${selection.detail.trim()}`;
        }
        return option.label;
      });

    return { categoryName: category.name, labels };
  });
}

export function MdhoReviewPanel({
  assessment,
  categories,
  occurrenceId,
  organizationId,
  canApprove,
  canReturn,
  isOffline,
  onConflict,
}: MdhoReviewPanelProps) {
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isReturnOpen, setIsReturnOpen] = useState(false);
  const [returnReason, setReturnReason] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const approveDialogRef = useRef<HTMLDialogElement>(null);
  const returnDialogRef = useRef<HTMLDialogElement>(null);

  const approveMutation = useApproveMdhoAssessment(occurrenceId, organizationId);
  const returnMutation = useReturnMdhoAssessment(occurrenceId, organizationId);

  const summaryItems = resolveSelectionLabels(assessment, categories);
  const isPending = approveMutation.isPending || returnMutation.isPending;

  useEffect(() => {
    const dialog = approveDialogRef.current;
    if (!dialog) return;
    if (isApproveOpen && !dialog.open) dialog.showModal();
    if (!isApproveOpen && dialog.open) dialog.close();
  }, [isApproveOpen]);

  useEffect(() => {
    const dialog = returnDialogRef.current;
    if (!dialog) return;
    if (isReturnOpen && !dialog.open) dialog.showModal();
    if (!isReturnOpen && dialog.open) dialog.close();
  }, [isReturnOpen]);

  async function handleApprove() {
    setActionError(null);
    try {
      await approveMutation.mutateAsync(assessment.id);
      setIsApproveOpen(false);
    } catch (error) {
      setIsApproveOpen(false);
      if (isMdhoRpcConflictError(error)) {
        onConflict();
        return;
      }
      setActionError("Não foi possível aprovar a avaliação MDHO.");
    }
  }

  async function handleReturn() {
    setActionError(null);
    try {
      await returnMutation.mutateAsync({
        assessmentId: assessment.id,
        returnReason,
      });
      setIsReturnOpen(false);
      setReturnReason("");
    } catch (error) {
      setIsReturnOpen(false);
      if (isMdhoRpcConflictError(error)) {
        onConflict();
        return;
      }
      if (isMdhoRpcValidationError(error)) {
        setActionError(error.message);
        return;
      }
      setActionError("Não foi possível devolver a avaliação MDHO.");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm font-medium text-blue-200">Aguardando aprovação HSE</p>

      {summaryItems.map((item) => (
        <div key={item.categoryName} className="flex flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
            {item.categoryName}
          </span>
          <p className="text-sm text-gray-100">
            {item.labels.length > 0 ? item.labels.join("; ") : "—"}
          </p>
        </div>
      ))}

      {assessment.complement?.trim() ? (
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Complemento da avaliação
          </span>
          <p className="whitespace-pre-wrap text-sm text-gray-100">{assessment.complement}</p>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Enviado por
          </span>
          <span className="text-sm text-gray-100">{assessment.submittedByName ?? "—"}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-wide text-gray-500">Em</span>
          <span className="text-sm text-gray-100">{formatDateTime(assessment.submittedAt)}</span>
        </div>
      </div>

      {isOffline ? <MdhoOfflineNotice /> : null}
      {actionError ? (
        <p className="text-sm text-red-400" role="alert">
          {actionError}
        </p>
      ) : null}

      {canApprove || canReturn ? (
        <div className="flex flex-col gap-2 sm:flex-row">
          {canReturn ? (
            <button
              className="w-full rounded-md border border-red-700 px-4 py-3 text-sm font-medium text-red-200 hover:bg-red-950/40 disabled:opacity-50"
              disabled={isPending || isOffline}
              type="button"
              onClick={() => {
                setIsReturnOpen(true);
              }}
            >
              Devolver MDHO
            </button>
          ) : null}
          {canApprove ? (
            <button
              className="w-full rounded-md bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
              disabled={isPending || isOffline}
              type="button"
              onClick={() => {
                setIsApproveOpen(true);
              }}
            >
              Aprovar MDHO
            </button>
          ) : null}
        </div>
      ) : null}

      <dialog
        ref={approveDialogRef}
        className="w-full max-w-md rounded-lg border border-gray-700 bg-gray-900 p-0 text-gray-100 backdrop:bg-black/60"
        onCancel={(event) => {
          event.preventDefault();
          setIsApproveOpen(false);
        }}
      >
        <form
          className="flex flex-col gap-4 p-6"
          method="dialog"
          onSubmit={(event) => {
            event.preventDefault();
            void handleApprove();
          }}
        >
          <h2 className="text-lg font-semibold">Aprovar Avaliação Técnica (MDHO)?</h2>
          <p className="text-sm text-gray-400">A avaliação ficará imutável.</p>
          <div className="flex justify-end gap-3">
            <button
              className="rounded-md border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800"
              type="button"
              onClick={() => {
                setIsApproveOpen(false);
              }}
            >
              Cancelar
            </button>
            <button
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
              disabled={isPending}
              type="submit"
            >
              Aprovar MDHO
            </button>
          </div>
        </form>
      </dialog>

      <dialog
        ref={returnDialogRef}
        className="w-full max-w-md rounded-lg border border-gray-700 bg-gray-900 p-0 text-gray-100 backdrop:bg-black/60"
        onCancel={(event) => {
          event.preventDefault();
          setIsReturnOpen(false);
        }}
      >
        <form
          className="flex flex-col gap-4 p-6"
          method="dialog"
          onSubmit={(event) => {
            event.preventDefault();
            void handleReturn();
          }}
        >
          <h2 className="text-lg font-semibold">Devolver Avaliação Técnica (MDHO)?</h2>
          <label className="flex flex-col gap-2">
            <span className="text-sm text-gray-300">Motivo da devolução</span>
            <textarea
              className="min-h-24 w-full rounded-md border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-gray-100"
              value={returnReason}
              onChange={(event) => {
                setReturnReason(event.target.value);
              }}
            />
          </label>
          <div className="flex justify-end gap-3">
            <button
              className="rounded-md border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800"
              type="button"
              onClick={() => {
                setIsReturnOpen(false);
              }}
            >
              Cancelar
            </button>
            <button
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50"
              disabled={isPending}
              type="submit"
            >
              Devolver MDHO
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
