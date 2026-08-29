"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { createPreventiveStopSchema, type CreatePreventiveStopInput } from "@safestop/validation";
import { OCCURRENCE_SEVERITIES, type OccurrenceSeverity } from "@safestop/types";
import { occurrenceSeverityTone, type StatusChipFamily } from "@safestop/ui";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { FormField } from "@/components/form-field";
import { PageHeader } from "@/components/page-header";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useRequirePermission } from "@/features/authorization";
import { formatOccurrenceSeverity } from "@/features/occurrences/utils/format-labels";

import { usePreventiveStopDraft } from "../hooks/use-preventive-stop-draft";
import {
  useCreatePreventiveStop,
  usePreventiveStopAreas,
  usePreventiveStopContractors,
} from "../hooks/use-stop-work";
import { hasPreventiveStopDraftContent } from "../stores/preventive-stop-draft-store";
import {
  EMPTY_ACTIVE_CONTRACTORS_MESSAGE,
  getPreventiveStopCreateControlState,
} from "../utils/preventive-stop-create-controls";
import {
  isInternalPreventiveStopCreateExit,
  resolveCreateLeaveConfirmAction,
  resolveCreatePopStateAction,
  shouldPromptPreventiveStopCreateLeave,
} from "../utils/preventive-stop-create-leave";
import { StopWorkError, StopWorkLoading } from "./stop-work-states";

const DRAFT_DEBOUNCE_MS = 400;

const SEVERITY_CHIP_CLASSES: Record<StatusChipFamily, string> = {
  success: "border-status-success-border bg-status-success-bg text-status-success-fg",
  warning: "border-status-warning-border bg-status-warning-bg text-status-warning-fg",
  destructive:
    "border-status-destructive-border bg-status-destructive-bg text-status-destructive-fg",
  info: "border-status-info-border bg-status-info-bg text-status-info-fg",
  primary: "border-status-primary-border bg-status-primary-bg text-status-primary-fg",
  muted: "border-status-muted-border bg-status-muted-bg text-status-muted-fg",
};

type SelectOption = {
  id: string;
  name: string;
  code?: string | null;
};

type DraftSelectControlProps = {
  id?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
  disabled: boolean;
  value: string;
  placeholder: string;
  options: SelectOption[];
  onValueChange: (value: string) => void;
};

function DraftSelectControl({
  id,
  "aria-describedby": describedBy,
  "aria-invalid": invalid,
  disabled,
  value,
  placeholder,
  options,
  onValueChange,
}: DraftSelectControlProps) {
  return (
    <Select disabled={disabled} onValueChange={onValueChange} value={value || undefined}>
      <SelectTrigger
        aria-describedby={describedBy}
        aria-invalid={invalid}
        className="w-full"
        id={id}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.id} value={option.id}>
            {option.name}
            {option.code ? ` (${option.code})` : ""}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function toFormValues(draft: Partial<CreatePreventiveStopInput>): CreatePreventiveStopInput {
  return {
    taskDescription: draft.taskDescription ?? "",
    locationDescription: draft.locationDescription ?? "",
    conditionDescription: draft.conditionDescription ?? "",
    immediateActionDescription: draft.immediateActionDescription ?? "",
    severity: draft.severity ?? "MEDIUM",
    areaId: draft.areaId ?? "",
    contractorOrganizationId: draft.contractorOrganizationId ?? "",
  };
}

export function StopWorkCreateContainer() {
  useRequirePermission("occurrence.create");

  const {
    areas,
    isLoading: isAreasLoading,
    isError: isAreasError,
    error: areasError,
  } = usePreventiveStopAreas();
  const {
    contractors,
    isLoading: isContractorsLoading,
    isError: isContractorsError,
    error: contractorsError,
  } = usePreventiveStopContractors();
  const {
    draft,
    flushDraft,
    clearDraft,
    hasLocalDraft,
    isReady: isDraftReady,
  } = usePreventiveStopDraft();

  if (isAreasLoading || isContractorsLoading || !isDraftReady) {
    return <StopWorkLoading message="Carregando formulário..." />;
  }

  if (isAreasError) {
    return <StopWorkError message={areasError instanceof Error ? areasError.message : undefined} />;
  }

  if (isContractorsError) {
    return (
      <StopWorkError
        message={contractorsError instanceof Error ? contractorsError.message : undefined}
      />
    );
  }

  return (
    <StopWorkCreateForm
      areas={areas}
      clearDraft={clearDraft}
      contractors={contractors}
      flushDraft={flushDraft}
      hasLocalDraft={hasLocalDraft}
      initialValues={toFormValues(draft)}
    />
  );
}

type StopWorkCreateFormProps = {
  areas: SelectOption[];
  contractors: SelectOption[];
  initialValues: CreatePreventiveStopInput;
  hasLocalDraft: boolean;
  flushDraft: (values: CreatePreventiveStopInput) => void;
  clearDraft: () => void;
};

function StopWorkCreateForm({
  areas,
  contractors,
  initialValues,
  hasLocalDraft,
  flushDraft,
  clearDraft,
}: StopWorkCreateFormProps) {
  const router = useRouter();
  const { createPreventiveStop, isCreating, error: createError, reset } = useCreatePreventiveStop();
  const [formError, setFormError] = useState<string | null>(null);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const pendingHrefRef = useRef<string | null>(null);
  const pendingHistoryLeaveRef = useRef(false);
  const allowLeaveRef = useRef(false);
  const restoringGuardRef = useRef(false);
  const debounceRef = useRef<number | undefined>(undefined);

  const {
    register,
    handleSubmit,
    control,
    getValues,
    watch,
    formState: { errors },
  } = useForm<CreatePreventiveStopInput>({
    resolver: zodResolver(createPreventiveStopSchema),
    defaultValues: initialValues,
  });

  useEffect(() => {
    const subscription = watch((values) => {
      window.clearTimeout(debounceRef.current);
      debounceRef.current = window.setTimeout(() => {
        flushDraft(values as CreatePreventiveStopInput);
      }, DRAFT_DEBOUNCE_MS);
    });

    return () => {
      subscription.unsubscribe();
      window.clearTimeout(debounceRef.current);
    };
  }, [flushDraft, watch]);

  useEffect(() => {
    function persistDraftNow() {
      if (allowLeaveRef.current) {
        return;
      }

      flushDraft(getValues());
    }

    function onBeforeUnload(event: BeforeUnloadEvent) {
      if (
        !shouldPromptPreventiveStopCreateLeave({
          allowLeave: allowLeaveRef.current,
          values: getValues(),
        })
      ) {
        return;
      }

      persistDraftNow();
      event.preventDefault();
      event.returnValue = "";
    }

    function onPageHide() {
      persistDraftNow();
    }

    function onPopState() {
      const action = resolveCreatePopStateAction({
        allowLeave: allowLeaveRef.current,
        isRestoringGuard: restoringGuardRef.current,
        hasRelevantContent: hasPreventiveStopDraftContent(getValues()),
      });

      if (action === "ignore") {
        restoringGuardRef.current = false;
        return;
      }

      persistDraftNow();

      if (action === "allow") {
        return;
      }

      restoringGuardRef.current = true;
      pendingHistoryLeaveRef.current = true;
      pendingHrefRef.current = null;
      window.history.go(1);
      setLeaveOpen(true);
    }

    window.addEventListener("beforeunload", onBeforeUnload);
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("popstate", onPopState);

    return () => {
      persistDraftNow();
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("popstate", onPopState);
    };
  }, [flushDraft, getValues]);

  useEffect(() => {
    function onDocumentClick(event: MouseEvent) {
      if (allowLeaveRef.current || event.defaultPrevented) {
        return;
      }

      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
        return;
      }

      const target = event.target;

      if (!(target instanceof Element)) {
        return;
      }

      if (target.closest('[data-slot="alert-dialog"]')) {
        return;
      }

      const anchor = target.closest("a[href]");

      if (!(anchor instanceof HTMLAnchorElement)) {
        return;
      }

      const href = anchor.getAttribute("href");

      if (!href || !isInternalPreventiveStopCreateExit(href, window.location.origin)) {
        return;
      }

      if (
        !shouldPromptPreventiveStopCreateLeave({
          allowLeave: allowLeaveRef.current,
          values: getValues(),
        })
      ) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      pendingHistoryLeaveRef.current = false;
      pendingHrefRef.current = href;
      setLeaveOpen(true);
    }

    document.addEventListener("click", onDocumentClick, true);
    return () => {
      document.removeEventListener("click", onDocumentClick, true);
    };
  }, [getValues]);

  async function onSubmit(values: CreatePreventiveStopInput) {
    setFormError(null);
    reset();

    try {
      const created = await createPreventiveStop(values);
      allowLeaveRef.current = true;
      clearDraft();
      router.replace(`/stop-work/${created.id}`);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Não foi possível registrar a paralisação. Tente novamente.";
      setFormError(message);
    }
  }

  function cancelLeave() {
    restoringGuardRef.current = false;
    pendingHistoryLeaveRef.current = false;
    pendingHrefRef.current = null;
    setLeaveOpen(false);
  }

  function confirmLeave() {
    flushDraft(getValues());
    allowLeaveRef.current = true;
    restoringGuardRef.current = false;

    const action = resolveCreateLeaveConfirmAction({
      isHistoryLeave: pendingHistoryLeaveRef.current,
      pendingHref: pendingHrefRef.current,
    });

    pendingHistoryLeaveRef.current = false;
    pendingHrefRef.current = null;
    setLeaveOpen(false);

    if (action.type === "history-back") {
      window.history.back();
      return;
    }

    router.push(action.href);
  }

  const mutationMessage = createError instanceof Error ? createError.message : null;
  const {
    isAreaDisabled,
    isContractorDisabled,
    areIndependentFieldsDisabled,
    isSubmitDisabled,
    showEmptyContractorsMessage,
  } = getPreventiveStopCreateControlState({
    isCreating,
    areasCount: areas.length,
    contractorsCount: contractors.length,
  });
  const severityErrorId = errors.severity?.message ? "severity-error" : undefined;
  const showDraftBanner = hasLocalDraft || hasPreventiveStopDraftContent(watch());

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-6 px-6 py-10">
      <PageHeader
        backHref="/stop-work"
        backLabel="Voltar para paralisações"
        subtitle="Preencha os dados mínimos para registrar a paralisação na organização ativa."
        title="Nova Paralisação Preventiva"
      />

      {showDraftBanner ? (
        <p className="rounded-lg border border-status-muted-border bg-status-muted-bg px-3 py-2 text-sm text-status-muted-fg">
          Rascunho salvo neste dispositivo
        </p>
      ) : null}

      <p
        className="rounded-lg border border-status-info-border bg-status-info-bg px-3 py-2 text-sm text-status-info-fg"
        role="note"
      >
        Preenchimento otimizado para menos de 60 segundos
      </p>

      <form className="flex flex-col gap-5" onSubmit={handleSubmit(onSubmit)}>
        <Card className="gap-4 py-4">
          <CardHeader className="px-4">
            <CardTitle className="text-base">Onde e quem</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 px-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Controller
                control={control}
                name="areaId"
                render={({ field }) => (
                  <FormField error={errors.areaId?.message} id="areaId" label="Área">
                    <DraftSelectControl
                      disabled={isAreaDisabled}
                      options={areas}
                      placeholder="Selecione uma área"
                      value={field.value}
                      onValueChange={field.onChange}
                    />
                  </FormField>
                )}
              />

              <FormField
                error={errors.locationDescription?.message}
                id="locationDescription"
                label="Local"
              >
                <Textarea
                  disabled={areIndependentFieldsDisabled}
                  {...register("locationDescription")}
                />
              </FormField>
            </div>

            <Controller
              control={control}
              name="contractorOrganizationId"
              render={({ field }) => (
                <FormField
                  error={errors.contractorOrganizationId?.message}
                  id="contractorOrganizationId"
                  label="Contratada"
                >
                  <DraftSelectControl
                    disabled={isContractorDisabled}
                    options={contractors}
                    placeholder="Selecione a empresa"
                    value={field.value}
                    onValueChange={field.onChange}
                  />
                </FormField>
              )}
            />
            {showEmptyContractorsMessage ? (
              <p className="text-sm text-status-warning-fg">{EMPTY_ACTIVE_CONTRACTORS_MESSAGE}</p>
            ) : null}
          </CardContent>
        </Card>

        <Card className="gap-4 py-4">
          <CardHeader className="px-4">
            <CardTitle className="text-base">O que está acontecendo</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 px-4">
            <FormField
              error={errors.taskDescription?.message}
              id="taskDescription"
              label="Atividade"
            >
              <Textarea disabled={areIndependentFieldsDisabled} {...register("taskDescription")} />
            </FormField>

            <FormField
              error={errors.conditionDescription?.message}
              id="conditionDescription"
              label="Condição insegura"
            >
              <Textarea
                disabled={areIndependentFieldsDisabled}
                {...register("conditionDescription")}
              />
            </FormField>

            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-foreground" id="severity-label">
                Criticidade
              </span>
              <Controller
                control={control}
                name="severity"
                render={({ field }) => (
                  <RadioGroup
                    aria-describedby={severityErrorId}
                    aria-invalid={errors.severity ? true : undefined}
                    aria-labelledby="severity-label"
                    className="grid grid-cols-2 gap-2 sm:grid-cols-4"
                    disabled={areIndependentFieldsDisabled}
                    onValueChange={(value) => {
                      field.onChange(value as OccurrenceSeverity);
                    }}
                    value={field.value}
                  >
                    {OCCURRENCE_SEVERITIES.map((severity) => {
                      const selected = field.value === severity;
                      const family = occurrenceSeverityTone[severity];

                      return (
                        <label
                          className={cn(
                            "flex cursor-pointer items-center justify-center rounded-lg border px-3 py-2 text-sm font-medium transition",
                            selected
                              ? SEVERITY_CHIP_CLASSES[family]
                              : "border-border text-muted-foreground hover:border-primary/50",
                            areIndependentFieldsDisabled ? "cursor-not-allowed opacity-50" : "",
                          )}
                          key={severity}
                        >
                          <RadioGroupItem className="sr-only" value={severity} />
                          {formatOccurrenceSeverity(severity)}
                        </label>
                      );
                    })}
                  </RadioGroup>
                )}
              />
              {errors.severity?.message ? (
                <p className="text-sm text-destructive" id="severity-error" role="alert">
                  {errors.severity.message}
                </p>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card className="gap-4 py-4">
          <CardHeader className="px-4">
            <CardTitle className="text-base">Complemento</CardTitle>
          </CardHeader>
          <CardContent className="px-4">
            <FormField id="immediateActionDescription" label="Medida imediata (opcional)">
              <Textarea
                disabled={areIndependentFieldsDisabled}
                {...register("immediateActionDescription")}
              />
            </FormField>
          </CardContent>
        </Card>

        {formError || mutationMessage ? (
          <p className="rounded-lg border border-destructive/60 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {formError ?? mutationMessage}
          </p>
        ) : null}

        <Button className="w-full" disabled={isSubmitDisabled} size="lg" type="submit">
          {isCreating ? "Registrando..." : "Registrar paralisação"}
        </Button>
      </form>

      <AlertDialog
        onOpenChange={(open) => {
          if (!open && !allowLeaveRef.current) {
            cancelLeave();
          }
        }}
        open={leaveOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sair sem concluir a paralisação?</AlertDialogTitle>
            <AlertDialogDescription>
              Seu preenchimento foi salvo neste dispositivo e continuará disponível quando você
              voltar para Nova Paralisação.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel type="button">Continuar preenchendo</AlertDialogCancel>
            <AlertDialogAction
              type="button"
              onClick={(event) => {
                event.preventDefault();
                void confirmLeave();
              }}
            >
              Salvar e sair
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
