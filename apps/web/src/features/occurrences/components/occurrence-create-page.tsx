"use client";

import { createOccurrenceSchema, type CreateOccurrenceInput } from "@safestop/validation";
import { OCCURRENCE_SEVERITIES } from "@safestop/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { useRequirePermission } from "@/features/authorization";

import { useCreateOccurrence, useOrganizationAreas } from "../hooks/use-occurrences";
import { formatOccurrenceSeverity } from "../utils/format-labels";
import { OccurrenceError } from "./occurrence-error";
import { OccurrenceLoading } from "./occurrence-loading";

const defaultValues: CreateOccurrenceInput = {
  title: "",
  taskDescription: "",
  locationDescription: "",
  conditionDescription: "",
  immediateActionDescription: "",
  severity: "MEDIUM",
  areaId: "",
};

export function OccurrenceCreatePage() {
  useRequirePermission("occurrence.create");

  const router = useRouter();
  const {
    areas,
    isLoading: isAreasLoading,
    isError: isAreasError,
    error: areasError,
  } = useOrganizationAreas();
  const { createOccurrence, isCreating, error: createError, reset } = useCreateOccurrence();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateOccurrenceInput>({
    defaultValues,
  });

  if (isAreasLoading) {
    return <OccurrenceLoading message="Carregando áreas..." />;
  }

  if (isAreasError) {
    return (
      <OccurrenceError message={areasError instanceof Error ? areasError.message : undefined} />
    );
  }

  async function onSubmit(values: CreateOccurrenceInput) {
    setFormError(null);
    reset();

    const parsed = createOccurrenceSchema.safeParse(values);

    if (!parsed.success) {
      setFormError("Verifique os campos obrigatórios e tente novamente.");
      return;
    }

    try {
      const created = await createOccurrence(parsed.data);
      router.replace(`/occurrences/${created.id}`);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Não foi possível registrar a ocorrência. Tente novamente.";
      setFormError(message);
    }
  }

  const mutationMessage = createError instanceof Error ? createError.message : null;

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-6 py-10">
      <header className="flex flex-col gap-2">
        <Link className="text-sm text-orange-400 hover:text-orange-300" href="/occurrences">
          ← Voltar para ocorrências
        </Link>
        <h1 className="text-3xl font-bold text-gray-100">Nova ocorrência</h1>
        <p className="text-sm text-gray-400">
          Registro de Paralisação Preventiva na organização ativa.
        </p>
      </header>

      <form className="flex flex-col gap-5" onSubmit={handleSubmit(onSubmit)}>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-200" htmlFor="title">
            Título
          </label>
          <input
            className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-base text-gray-100 outline-none focus:border-orange-500"
            disabled={isCreating}
            id="title"
            {...register("title", { required: "Título é obrigatório." })}
          />
          {errors.title ? <p className="text-sm text-red-300">{errors.title.message}</p> : null}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-200" htmlFor="areaId">
            Área
          </label>
          <select
            className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-base text-gray-100 outline-none focus:border-orange-500"
            disabled={isCreating || areas.length === 0}
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
          {areas.length === 0 ? (
            <p className="text-sm text-amber-200">
              Nenhuma área ativa disponível nesta organização.
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-200" htmlFor="severity">
            Criticidade
          </label>
          <select
            className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-base text-gray-100 outline-none focus:border-orange-500"
            disabled={isCreating}
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
            disabled={isCreating}
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
            disabled={isCreating}
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
            disabled={isCreating}
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
            disabled={isCreating}
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
          disabled={isCreating || areas.length === 0}
          type="submit"
        >
          {isCreating ? "Registrando..." : "Registrar paralisação"}
        </button>
      </form>
    </main>
  );
}
