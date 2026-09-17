"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { createPreventiveStopSchema, type CreatePreventiveStopInput } from "@safestop/validation";
import { OCCURRENCE_SEVERITIES, type OccurrenceSeverity } from "@safestop/types";
import { occurrenceSeverityTone, type StatusChipFamily } from "@safestop/ui";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { PlusCircle } from "lucide-react";

import { FormField } from "@/components/form-field";
import { PageHeader } from "@/components/page-header";
import { PageShell } from "@/components/page-shell";
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
import { useActiveWorkspace } from "@/features/workspace";

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
  resolveDraftSelectValue,
} from "../utils/preventive-stop-create-controls";
import {
  isInternalPreventiveStopCreateExit,
  resolveCreateLeaveConfirmAction,
  resolveCreatePopStateAction,
  shouldPromptPreventiveStopCreateLeave,
} from "../utils/preventive-stop-create-leave";
import { formatWorkspaceContractLabel } from "@/features/occurrences/services/get-workspace-contracts";
import type { WorkspaceContractOption } from "@/features/occurrences/types";
import {
  ACTIVITY_COMPANY_FIELD_HELP,
  ACTIVITY_COMPANY_FIELD_LABEL,
  ACTIVITY_CONTRACT_FIELD_HELP,
  contractsForExecutor,
  deriveCreatePayloadFromContract,
  resolveExecutorIdFromDraft,
  resolveOperationalCreateContractFields,
  type OperationalExecutorOption,
} from "@/features/occurrences/utils/operational-contract-cascade";
import { OWN_TEAM_CONTRACT_OPTION_ID } from "@/features/occurrences/utils/workspace-create-rules";
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
    <Select
      disabled={disabled}
      onValueChange={onValueChange}
      value={resolveDraftSelectValue(value)}
    >
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
    contractId: draft.contractId ?? "",
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
    executors,
    contracts,
    allowsOwnTeam,
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
      allowsOwnTeam={allowsOwnTeam}
      areas={areas}
      clearDraft={clearDraft}
      contracts={contracts}
      executors={executors}
      flushDraft={flushDraft}
      hasLocalDraft={hasLocalDraft}
      initialValues={toFormValues(draft)}
    />
  );
}

type StopWorkCreateFormProps = {
  areas: SelectOption[];
  executors: OperationalExecutorOption[];
  contracts: WorkspaceContractOption[];
  allowsOwnTeam: boolean;
  initialValues: CreatePreventiveStopInput;
  hasLocalDraft: boolean;
  flushDraft: (values: CreatePreventiveStopInput) => void;
  clearDraft: () => void;
};

function StopWorkCreateForm({
  areas,
  executors,
  contracts,
  allowsOwnTeam,
  initialValues,
  hasLocalDraft,
  flushDraft,
  clearDraft,
}: StopWorkCreateFormProps) {
  const router = useRouter();
  const { activeWorkspace } = useActiveWorkspace();
  const { createPreventiveStop, isCreating, error: createError, reset } = useCreatePreventiveStop();
  const [formError, setFormError] = useState<string | null>(null);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [selectedExecutorId, setSelectedExecutorId] = useState(() =>
    resolveExecutorIdFromDraft({
      allowsOwnTeam,
      contractId: initialValues.contractId,
      contractorOrganizationId: initialValues.contractorOrganizationId,
      contracts,
    }),
  );
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
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreatePreventiveStopInput>({
    resolver: zodResolver(createPreventiveStopSchema),
    defaultValues: initialValues,
  });

  const executorPickerOptions: SelectOption[] = [
    ...(allowsOwnTeam ? [{ id: OWN_TEAM_CONTRACT_OPTION_ID, name: "Equipe própria" }] : []),
    ...executors,
  ];
  const isOwnTeamSelected = selectedExecutorId === OWN_TEAM_CONTRACT_OPTION_ID;
  const contractsForSelectedExecutor = contractsForExecutor(contracts, selectedExecutorId);
  const contractPickerOptions: SelectOption[] = contractsForSelectedExecutor.map((contract) => ({
    id: contract.id,
    name: formatWorkspaceContractLabel(contract),
  }));

  const watchedContractId = watch("contractId");
  const contractPickerValue =
    typeof watchedContractId === "string" && watchedContractId.length > 0 ? watchedContractId : "";

  function handleExecutorChange(value: string) {
    setSelectedExecutorId(value);
    setValue("contractId", undefined, { shouldDirty: true });
    setValue("contractorOrganizationId", undefined, { shouldDirty: true });
  }

  function handleContractPickerChange(value: string) {
    const selected = contractsForSelectedExecutor.find((contract) => contract.id === value);
    if (!selected) {
      return;
    }

    const payload = deriveCreatePayloadFromContract(selected);
    setValue("contractId", payload.contractId, { shouldDirty: true });
    setValue("contractorOrganizationId", payload.contractorOrganizationId, { shouldDirty: true });
  }

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

    if (!activeWorkspace?.id) {
      setFormError("Ambiente ativo é obrigatório para registrar a paralisação.");
      return;
    }

    const resolvedContractFields = resolveOperationalCreateContractFields({
      executorId: selectedExecutorId,
      allowsOwnTeam,
      contracts,
      contractId: values.contractId,
    });

    if (!resolvedContractFields) {
      setFormError(
        allowsOwnTeam
          ? "Selecione a Empresa da atividade e, se não for equipe própria, o Contrato."
          : "Selecione a Empresa da atividade e o Contrato.",
      );
      return;
    }

    try {
      const created = await createPreventiveStop({
        ...values,
        contractId: resolvedContractFields.contractId,
        contractorOrganizationId: resolvedContractFields.contractorOrganizationId,
      });
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
    areIndependentFieldsDisabled,
    isSubmitDisabled,
    showEmptyContractorsMessage,
  } = getPreventiveStopCreateControlState({
    isCreating,
    areasCount: areas.length,
    contractsCount: contracts.length,
    hasActiveWorkspace: Boolean(activeWorkspace?.id),
    allowsOwnTeam,
  });
  const isExecutorDisabled =
    isCreating || !activeWorkspace?.id || (contracts.length === 0 && !allowsOwnTeam);
  const isContractSelectDisabled =
    isCreating ||
    !activeWorkspace?.id ||
    isOwnTeamSelected ||
    selectedExecutorId.length === 0 ||
    contractsForSelectedExecutor.length === 0;
  const severityErrorId = errors.severity?.message ? "severity-error" : undefined;
  const showDraftBanner = hasLocalDraft || hasPreventiveStopDraftContent(watch());

  return (
    <PageShell className="gap-6" width="default">
      <PageHeader
        backHref="/stop-work"
        backLabel="Voltar para paralisações"
        eyebrow="REGISTRO OPERACIONAL"
        icon={PlusCircle}
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
        <Card className="gap-4 border-border bg-card/60 py-4 shadow-sm">
          <CardHeader className="px-4">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80">
              Onde e quem
            </CardTitle>
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

            <FormField
              describedBy="activity-company-help"
              error={errors.contractorOrganizationId?.message}
              id="activityCompanyId"
              label={ACTIVITY_COMPANY_FIELD_LABEL}
            >
              <DraftSelectControl
                disabled={isExecutorDisabled}
                options={executorPickerOptions}
                placeholder="Selecione a executora"
                value={selectedExecutorId}
                onValueChange={handleExecutorChange}
              />
            </FormField>
            <p className="text-sm text-muted-foreground" id="activity-company-help">
              {ACTIVITY_COMPANY_FIELD_HELP}
            </p>

            <FormField
              describedBy="activity-contract-help"
              error={errors.contractId?.message}
              id="contractId"
              label="Contrato"
            >
              <DraftSelectControl
                disabled={isContractSelectDisabled}
                options={contractPickerOptions}
                placeholder={
                  isOwnTeamSelected
                    ? "Equipe própria — sem contrato"
                    : selectedExecutorId
                      ? "Selecione o contrato"
                      : "Selecione a Empresa da atividade primeiro"
                }
                value={contractPickerValue}
                onValueChange={handleContractPickerChange}
              />
            </FormField>
            <p className="text-sm text-muted-foreground" id="activity-contract-help">
              {ACTIVITY_CONTRACT_FIELD_HELP}
            </p>
            {showEmptyContractorsMessage ? (
              <p className="text-sm text-status-warning-fg">{EMPTY_ACTIVE_CONTRACTORS_MESSAGE}</p>
            ) : null}
          </CardContent>
        </Card>

        <Card className="gap-4 border-border bg-card/60 py-4 shadow-sm">
          <CardHeader className="px-4">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80">
              O que está acontecendo
            </CardTitle>
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

        <Card className="gap-4 border-border bg-card/60 py-4 shadow-sm">
          <CardHeader className="px-4">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80">
              Complemento
            </CardTitle>
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
    </PageShell>
  );
}
