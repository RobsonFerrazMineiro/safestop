"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { createPreventiveStopSchema, type CreatePreventiveStopInput } from "@safestop/validation";
import { OCCURRENCE_SEVERITIES, type OccurrenceSeverity } from "@safestop/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

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

import {
  useCreatePreventiveStop,
  usePreventiveStopAreas,
  usePreventiveStopContractors,
} from "../hooks/use-stop-work";
import { StopWorkError, StopWorkLoading } from "./stop-work-states";

const defaultValues: CreatePreventiveStopInput = {
  taskDescription: "",
  locationDescription: "",
  conditionDescription: "",
  immediateActionDescription: "",
  severity: "MEDIUM",
  areaId: "",
  contractorOrganizationId: "",
};

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-sm text-destructive">{message}</p>;
}

export function StopWorkCreateContainer() {
  useRequirePermission("occurrence.create");

  const router = useRouter();
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
  const { createPreventiveStop, isCreating, error: createError, reset } = useCreatePreventiveStop();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CreatePreventiveStopInput>({
    resolver: zodResolver(createPreventiveStopSchema),
    defaultValues,
  });

  if (isAreasLoading || isContractorsLoading) {
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

  async function onSubmit(values: CreatePreventiveStopInput) {
    setFormError(null);
    reset();

    try {
      const created = await createPreventiveStop(values);
      router.replace(`/stop-work/${created.id}`);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Não foi possível registrar a paralisação. Tente novamente.";
      setFormError(message);
    }
  }

  const mutationMessage = createError instanceof Error ? createError.message : null;
  const isFormDisabled = isCreating || areas.length === 0 || contractors.length === 0;

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-6 py-10">
      <header className="flex flex-col gap-2">
        <Link className="text-sm text-primary hover:text-primary/90" href="/stop-work">
          ← Voltar para paralisações
        </Link>
        <h1 className="text-3xl font-bold">Nova Paralisação Preventiva</h1>
        <p className="text-sm text-muted-foreground">
          Preencha os dados mínimos para registrar a paralisação na organização ativa.
        </p>
      </header>

      <form className="flex flex-col gap-5" onSubmit={handleSubmit(onSubmit)}>
        <Card className="gap-4 py-4">
          <CardHeader className="px-4">
            <CardTitle className="text-base">Onde e quem</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 px-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium" htmlFor="areaId">
                Área
              </label>
              <Controller
                control={control}
                name="areaId"
                render={({ field }) => (
                  <Select
                    disabled={isFormDisabled}
                    onValueChange={field.onChange}
                    value={field.value || undefined}
                  >
                    <SelectTrigger className="w-full" id="areaId">
                      <SelectValue placeholder="Selecione uma área" />
                    </SelectTrigger>
                    <SelectContent>
                      {areas.map((area) => (
                        <SelectItem key={area.id} value={area.id}>
                          {area.name}
                          {area.code ? ` (${area.code})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError message={errors.areaId?.message} />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium" htmlFor="locationDescription">
                Local
              </label>
              <Textarea
                disabled={isFormDisabled}
                id="locationDescription"
                {...register("locationDescription")}
              />
              <FieldError message={errors.locationDescription?.message} />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium" htmlFor="contractorOrganizationId">
                Contratada
              </label>
              <Controller
                control={control}
                name="contractorOrganizationId"
                render={({ field }) => (
                  <Select
                    disabled={isFormDisabled}
                    onValueChange={field.onChange}
                    value={field.value || undefined}
                  >
                    <SelectTrigger className="w-full" id="contractorOrganizationId">
                      <SelectValue placeholder="Selecione a empresa" />
                    </SelectTrigger>
                    <SelectContent>
                      {contractors.map((contractor) => (
                        <SelectItem key={contractor.id} value={contractor.id}>
                          {contractor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError message={errors.contractorOrganizationId?.message} />
              {contractors.length === 0 ? (
                <p className="text-sm text-amber-200">
                  Nenhuma contratada com contrato ativo nesta organização.
                </p>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card className="gap-4 py-4">
          <CardHeader className="px-4">
            <CardTitle className="text-base">O que está acontecendo</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 px-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium" htmlFor="taskDescription">
                Atividade
              </label>
              <Textarea
                disabled={isFormDisabled}
                id="taskDescription"
                {...register("taskDescription")}
              />
              <FieldError message={errors.taskDescription?.message} />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium" htmlFor="conditionDescription">
                Condição insegura
              </label>
              <Textarea
                disabled={isFormDisabled}
                id="conditionDescription"
                {...register("conditionDescription")}
              />
              <FieldError message={errors.conditionDescription?.message} />
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium" id="severity-label">
                Criticidade
              </span>
              <Controller
                control={control}
                name="severity"
                render={({ field }) => (
                  <RadioGroup
                    aria-labelledby="severity-label"
                    className="grid grid-cols-2 gap-2 sm:grid-cols-4"
                    disabled={isFormDisabled}
                    onValueChange={(value) => {
                      field.onChange(value as OccurrenceSeverity);
                    }}
                    value={field.value}
                  >
                    {OCCURRENCE_SEVERITIES.map((severity) => {
                      const selected = field.value === severity;

                      return (
                        <label
                          className={cn(
                            "flex cursor-pointer items-center justify-center rounded-lg border px-3 py-2 text-sm font-medium transition",
                            selected
                              ? "border-primary bg-primary/15 text-foreground"
                              : "border-border text-muted-foreground hover:border-primary/50",
                            isFormDisabled ? "cursor-not-allowed opacity-50" : "",
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
              <FieldError message={errors.severity?.message} />
            </div>
          </CardContent>
        </Card>

        <Card className="gap-4 py-4">
          <CardHeader className="px-4">
            <CardTitle className="text-base">Complemento</CardTitle>
          </CardHeader>
          <CardContent className="px-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium" htmlFor="immediateActionDescription">
                Medida imediata (opcional)
              </label>
              <Textarea
                disabled={isFormDisabled}
                id="immediateActionDescription"
                {...register("immediateActionDescription")}
              />
            </div>
          </CardContent>
        </Card>

        {formError || mutationMessage ? (
          <p className="rounded-lg border border-destructive/60 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {formError ?? mutationMessage}
          </p>
        ) : null}

        <Button disabled={isFormDisabled} size="lg" type="submit">
          {isCreating ? "Registrando..." : "Registrar paralisação"}
        </Button>
      </form>
    </main>
  );
}
