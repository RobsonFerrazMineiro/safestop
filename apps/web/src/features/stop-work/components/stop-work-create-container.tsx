"use client";

import { type CreatePreventiveStopInput } from "@safestop/validation";
import { OCCURRENCE_SEVERITIES } from "@safestop/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

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
    formState: { errors },
  } = useForm<CreatePreventiveStopInput>({
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
        <Link className="text-sm text-orange-400 hover:text-orange-300" href="/stop-work">
          ← Voltar para paralisações
        </Link>
        <h1 className="text-3xl font-bold text-gray-100">Nova Paralisação Preventiva</h1>
        <p className="text-sm text-gray-400">
          Preencha os dados mínimos para registrar a paralisação na organização ativa.
        </p>
      </header>

      <form className="flex flex-col gap-5" onSubmit={handleSubmit(onSubmit)}>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-200" htmlFor="areaId">
            Área
          </label>
          <select
            className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-base text-gray-100 outline-none focus:border-orange-500"
            disabled={isFormDisabled}
            id="areaId"
            {...register("areaId", { required: "Área é obrigatória." })}
          >
            <option value="">Selecione uma área</option>
            {areas.map((area) => (
              <option key={area.id} value={area.id}>
                {area.name}
                {area.code ? ` (${area.code})` : ""}
              </option>
            ))}
          </select>
          {errors.areaId ? <p className="text-sm text-red-300">{errors.areaId.message}</p> : null}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-200" htmlFor="contractorOrganizationId">
            Empresa envolvida
          </label>
          <select
            className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-base text-gray-100 outline-none focus:border-orange-500"
            disabled={isFormDisabled}
            id="contractorOrganizationId"
            {...register("contractorOrganizationId", {
              required: "Empresa envolvida é obrigatória.",
            })}
          >
            <option value="">Selecione a empresa</option>
            {contractors.map((contractor) => (
              <option key={contractor.id} value={contractor.id}>
                {contractor.name}
              </option>
            ))}
          </select>
          {errors.contractorOrganizationId ? (
            <p className="text-sm text-red-300">{errors.contractorOrganizationId.message}</p>
          ) : null}
          {contractors.length === 0 ? (
            <p className="text-sm text-amber-200">
              Nenhuma contratada com contrato ativo nesta organização.
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-200" htmlFor="severity">
            Criticidade
          </label>
          <select
            className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-base text-gray-100 outline-none focus:border-orange-500"
            disabled={isFormDisabled}
            id="severity"
            {...register("severity")}
          >
            {OCCURRENCE_SEVERITIES.map((severity) => (
              <option key={severity} value={severity}>
                {formatOccurrenceSeverity(severity)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-200" htmlFor="taskDescription">
            Atividade
          </label>
          <textarea
            className="min-h-24 rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-base text-gray-100 outline-none focus:border-orange-500"
            disabled={isFormDisabled}
            id="taskDescription"
            {...register("taskDescription", { required: "Atividade é obrigatória." })}
          />
          {errors.taskDescription ? (
            <p className="text-sm text-red-300">{errors.taskDescription.message}</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-200" htmlFor="locationDescription">
            Local
          </label>
          <textarea
            className="min-h-20 rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-base text-gray-100 outline-none focus:border-orange-500"
            disabled={isFormDisabled}
            id="locationDescription"
            {...register("locationDescription", { required: "Local é obrigatório." })}
          />
          {errors.locationDescription ? (
            <p className="text-sm text-red-300">{errors.locationDescription.message}</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-200" htmlFor="conditionDescription">
            Condição insegura
          </label>
          <textarea
            className="min-h-24 rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-base text-gray-100 outline-none focus:border-orange-500"
            disabled={isFormDisabled}
            id="conditionDescription"
            {...register("conditionDescription", {
              required: "Condição insegura é obrigatória.",
            })}
          />
          {errors.conditionDescription ? (
            <p className="text-sm text-red-300">{errors.conditionDescription.message}</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-200" htmlFor="immediateActionDescription">
            Ação imediata (opcional)
          </label>
          <textarea
            className="min-h-20 rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-base text-gray-100 outline-none focus:border-orange-500"
            disabled={isFormDisabled}
            id="immediateActionDescription"
            {...register("immediateActionDescription")}
          />
        </div>

        {formError || mutationMessage ? (
          <p className="rounded-lg border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-200">
            {formError ?? mutationMessage}
          </p>
        ) : null}

        <button
          className="rounded-lg bg-orange-500 px-4 py-2 text-base font-semibold text-white transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isFormDisabled}
          type="submit"
        >
          {isCreating ? "Registrando..." : "Registrar paralisação"}
        </button>
      </form>
    </main>
  );
}
