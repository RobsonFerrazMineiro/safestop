"use client";

import { useMemo, useState } from "react";
import {
  MDHO_COMPLEMENT_MAX_LENGTH,
  MDHO_DEVIATION_TYPE_CATEGORY_CODE,
  MDHO_OTHER_OPTION_CODE,
  type MdhoCatalogCategory,
} from "@safestop/types";
import { createSubmitMdhoSchema } from "@safestop/validation";

import { Button } from "@/components/ui/button";
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

import {
  buildFormStateFromSelections,
  selectionInputsFromFormState,
} from "../utils/mdho-form-state";
import { isMdhoRpcConflictError, isMdhoRpcValidationError } from "../utils/mdho-rpc";
import { useSaveMdhoDraft } from "../hooks/use-save-mdho-draft";
import { useSubmitMdhoAssessment } from "../hooks/use-submit-mdho-assessment";
import type { MdhoAssessmentEnriched, MdhoFormSelectionState } from "../types";
import { MdhoDraftSavedNotice, MdhoOfflineNotice } from "./mdho-states";

type MdhoFormProps = {
  assessment: MdhoAssessmentEnriched;
  categories: MdhoCatalogCategory[];
  occurrenceId: string;
  organizationId: string;
  canEdit: boolean;
  canSubmit: boolean;
  isOffline: boolean;
  onConflict: () => void;
};

function formatStepLabel(category: MdhoCatalogCategory): string {
  if (category.code === "BEHAVIOR") return "Comportamento";
  if (category.code === "DEVIATION_TYPE") return "Tipo de Desvio";
  if (category.code === "PRECONDITIONS") return "Pré-condições";
  if (category.code === "ORGANIZATIONAL_ISSUES") return "Questões Organizacionais";
  if (category.code === "SUPERVISION_INSPECTION") return "Supervisão/Fiscalização";
  return category.name;
}

export function MdhoForm({
  assessment,
  categories,
  occurrenceId,
  organizationId,
  canEdit,
  canSubmit,
  isOffline,
  onConflict,
}: MdhoFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [complement, setComplement] = useState(assessment.complement ?? "");
  const [formState, setFormState] = useState<Record<string, MdhoFormSelectionState[]>>(() =>
    buildFormStateFromSelections(categories, assessment.selections),
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [draftNotice, setDraftNotice] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const saveDraft = useSaveMdhoDraft(occurrenceId, organizationId);
  const submitAssessment = useSubmitMdhoAssessment(occurrenceId, organizationId);

  const currentCategory = categories[currentStep];
  const isLastStep = currentStep === categories.length - 1;

  const selectionsInput = useMemo(
    () => selectionInputsFromFormState(categories, formState),
    [categories, formState],
  );

  function toggleOption(category: MdhoCatalogCategory, optionId: string, checked: boolean) {
    if (!canEdit) return;

    setFormState((previous) => {
      const current = previous[category.id] ?? [];

      if (category.code === MDHO_DEVIATION_TYPE_CATEGORY_CODE) {
        return {
          ...previous,
          [category.id]: checked ? [{ optionId, detail: "" }] : [],
        };
      }

      if (!category.allowsMultiple) {
        return {
          ...previous,
          [category.id]: checked ? [{ optionId, detail: "" }] : [],
        };
      }

      if (checked) {
        return {
          ...previous,
          [category.id]: [
            ...current.filter((entry) => entry.optionId !== optionId),
            { optionId, detail: "" },
          ],
        };
      }

      return {
        ...previous,
        [category.id]: current.filter((entry) => entry.optionId !== optionId),
      };
    });
    setFieldErrors({});
  }

  function updateOtherDetail(categoryId: string, optionId: string, detail: string) {
    if (!canEdit) return;

    setFormState((previous) => ({
      ...previous,
      [categoryId]: (previous[categoryId] ?? []).map((entry) =>
        entry.optionId === optionId ? { ...entry, detail } : entry,
      ),
    }));
    setFieldErrors({});
  }

  function isOptionChecked(categoryId: string, optionId: string): boolean {
    return (formState[categoryId] ?? []).some((entry) => entry.optionId === optionId);
  }

  async function handleSaveDraft() {
    setSubmitError(null);
    setDraftNotice(false);

    try {
      await saveDraft.mutateAsync({
        assessmentId: assessment.id,
        selections: selectionsInput,
        complement: complement.trim() || undefined,
        expectedUpdatedAt: assessment.updatedAt,
      });
      setDraftNotice(true);
    } catch (error) {
      if (isMdhoRpcConflictError(error)) {
        onConflict();
        return;
      }

      setSubmitError(
        error instanceof Error ? error.message : "Não foi possível salvar o rascunho.",
      );
    }
  }

  async function handleSubmitConfirmed() {
    setSubmitError(null);
    setFieldErrors({});

    const schema = createSubmitMdhoSchema(categories);
    const parsed = schema.safeParse({
      assessmentId: assessment.id,
      selections: selectionsInput,
      complement: complement.trim() || undefined,
    });

    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path.join(".");
        errors[key || "form"] = issue.message;
      }
      setFieldErrors(errors);
      setIsConfirmOpen(false);
      setSubmitError("Verifique os campos obrigatórios antes de enviar.");
      return;
    }

    try {
      await saveDraft.mutateAsync({
        assessmentId: assessment.id,
        selections: parsed.data.selections,
        complement: parsed.data.complement,
        expectedUpdatedAt: assessment.updatedAt,
      });
      await submitAssessment.mutateAsync(assessment.id);
      setIsConfirmOpen(false);
    } catch (error) {
      setIsConfirmOpen(false);

      if (isMdhoRpcConflictError(error)) {
        onConflict();
        return;
      }

      if (isMdhoRpcValidationError(error)) {
        setSubmitError(error.message);
        return;
      }

      setSubmitError("Não foi possível enviar a avaliação MDHO.");
    }
  }

  if (!currentCategory) {
    return null;
  }

  const isPending = saveDraft.isPending || submitAssessment.isPending;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-foreground">
          Passo {currentStep + 1} de {categories.length} · {formatStepLabel(currentCategory)}
        </p>
        <div className="flex gap-1" aria-hidden="true">
          {categories.map((category, index) => (
            <span
              key={category.id}
              className={`h-2 w-2 rounded-full ${index === currentStep ? "bg-primary" : "bg-muted"}`}
            />
          ))}
        </div>
      </div>

      <fieldset className="flex flex-col gap-3" disabled={!canEdit || isPending}>
        <legend className="sr-only">{formatStepLabel(currentCategory)}</legend>
        {currentCategory.options.map((option) => {
          const checked = isOptionChecked(currentCategory.id, option.id);
          const isRadio = currentCategory.code === MDHO_DEVIATION_TYPE_CATEGORY_CODE;
          const detailValue =
            (formState[currentCategory.id] ?? []).find((entry) => entry.optionId === option.id)
              ?.detail ?? "";

          return (
            <div
              key={option.id}
              className="flex flex-col gap-2 rounded-md border border-gray-800 p-3"
            >
              <label className="flex items-start gap-3 text-sm text-gray-100">
                <input
                  checked={checked}
                  className="mt-1"
                  disabled={!canEdit}
                  name={isRadio ? `mdho-${currentCategory.id}` : undefined}
                  type={isRadio ? "radio" : "checkbox"}
                  onChange={(event) => {
                    toggleOption(currentCategory, option.id, event.target.checked);
                  }}
                />
                <span>{option.label}</span>
              </label>

              {option.code === MDHO_OTHER_OPTION_CODE && option.allowsDetail && checked ? (
                <div className="ml-7 flex flex-col gap-1">
                  <label className="text-xs text-gray-400" htmlFor={`other-${option.id}`}>
                    Descreva
                  </label>
                  <textarea
                    className="min-h-20 w-full rounded-md border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-gray-100"
                    disabled={!canEdit}
                    id={`other-${option.id}`}
                    value={detailValue}
                    onChange={(event) => {
                      updateOtherDetail(currentCategory.id, option.id, event.target.value);
                    }}
                  />
                  <span className="text-xs text-gray-500">Mínimo 10 caracteres</span>
                </div>
              ) : null}
            </div>
          );
        })}
      </fieldset>

      {fieldErrors[`selections`] || fieldErrors["form"] ? (
        <p className="text-sm text-amber-400" role="alert">
          {fieldErrors[`selections`] ?? fieldErrors["form"]}
        </p>
      ) : null}

      {isLastStep ? (
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-gray-200">Complemento da avaliação</span>
          <textarea
            className="min-h-24 w-full rounded-md border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-gray-100 disabled:opacity-60"
            disabled={!canEdit || isPending}
            maxLength={MDHO_COMPLEMENT_MAX_LENGTH}
            readOnly={!canEdit}
            value={complement}
            onChange={(event) => {
              setComplement(event.target.value);
            }}
          />
          <span className="text-xs text-gray-500">
            Opcional · máximo {MDHO_COMPLEMENT_MAX_LENGTH} caracteres
          </span>
        </label>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button
          disabled={currentStep === 0}
          type="button"
          variant="outline"
          onClick={() => {
            setCurrentStep((step) => Math.max(0, step - 1));
          }}
        >
          Voltar
        </Button>
        {!isLastStep ? (
          <Button
            type="button"
            onClick={() => {
              setCurrentStep((step) => Math.min(categories.length - 1, step + 1));
            }}
          >
            Próximo
          </Button>
        ) : null}
      </div>

      {isOffline ? <MdhoOfflineNotice /> : null}
      {draftNotice ? <MdhoDraftSavedNotice /> : null}
      {submitError ? (
        <p className="text-sm text-destructive" role="alert">
          {submitError}
        </p>
      ) : null}

      {canEdit ? (
        <div className="sticky bottom-0 flex flex-col gap-2 border-t border-border bg-background/95 py-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              className="w-full"
              disabled={isPending || isOffline}
              type="button"
              variant="outline"
              onClick={() => {
                void handleSaveDraft();
              }}
            >
              {saveDraft.isPending ? "Salvando…" : "Salvar rascunho"}
            </Button>

            {canSubmit ? (
              <Button
                className="w-full"
                disabled={isPending || isOffline}
                type="button"
                onClick={() => {
                  setIsConfirmOpen(true);
                }}
              >
                {submitAssessment.isPending ? "Enviando…" : "Enviar MDHO"}
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}

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
            <AlertDialogTitle>Enviar Avaliação Técnica (MDHO)?</AlertDialogTitle>
            <AlertDialogDescription>
              Após o envio, a edição só será possível se a liderança devolver.
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
                void handleSubmitConfirmed();
              }}
            >
              {isPending ? "Enviando…" : "Enviar MDHO"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
