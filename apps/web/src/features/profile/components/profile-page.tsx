"use client";

import { profileUpdateSchema, type ProfileUpdateInput } from "@safestop/validation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import Link from "next/link";

import { useAuth } from "@/hooks/use-auth";

import { useProfile } from "../hooks/use-profile";
import { PROFILE_INACTIVE_MESSAGE, type Profile } from "../types";
import { ProfileError } from "./profile-error";
import { ProfileLoading } from "./profile-loading";
import { ProfileNotFound } from "./profile-not-found";

function formatDate(value: string | null): string {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleString("pt-BR");
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 text-left">
      <span className="text-sm font-medium text-gray-400">{label}</span>
      <span className="text-base text-gray-200">{value}</span>
    </div>
  );
}

type ProfileFormProps = {
  profile: Profile;
  email: string | null | undefined;
  isUpdating: boolean;
  isUpdateSuccess: boolean;
  onSubmitProfile: (input: ProfileUpdateInput) => Promise<void>;
  onResetUpdateState: () => void;
};

function ProfileInactiveBanner() {
  return (
    <p
      className="rounded-lg border border-amber-700/60 bg-amber-950/40 px-3 py-2 text-sm text-amber-100"
      role="alert"
    >
      {PROFILE_INACTIVE_MESSAGE} A edição do perfil está desabilitada.
    </p>
  );
}

function ProfileForm({
  profile,
  email,
  isUpdating,
  isUpdateSuccess,
  onSubmitProfile,
  onResetUpdateState,
}: ProfileFormProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const isProfileInactive = !profile.is_active;
  const isFormDisabled = isUpdating || isProfileInactive;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileUpdateInput>({
    defaultValues: {
      fullName: profile.full_name,
      phone: profile.phone ?? "",
    },
  });

  useEffect(() => {
    reset({
      fullName: profile.full_name,
      phone: profile.phone ?? "",
    });
  }, [profile, reset]);

  async function onSubmit(values: ProfileUpdateInput) {
    if (isProfileInactive) {
      setFormError(PROFILE_INACTIVE_MESSAGE);
      return;
    }

    setFormError(null);
    onResetUpdateState();

    const parsed = profileUpdateSchema.safeParse(values);

    if (!parsed.success) {
      setFormError("Verifique os campos e tente novamente.");
      return;
    }

    try {
      await onSubmitProfile(parsed.data);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Não foi possível salvar o perfil. Tente novamente.";
      setFormError(message);
    }
  }

  return (
    <form className="flex flex-col gap-6" onSubmit={handleSubmit(onSubmit)}>
      {isProfileInactive ? <ProfileInactiveBanner /> : null}

      <ReadOnlyField label="E-mail" value={email ?? "—"} />

      <div className="flex flex-col gap-2 text-left">
        <label className="text-sm font-medium text-gray-200" htmlFor="fullName">
          Nome completo
        </label>
        <input
          className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-base text-gray-100 outline-none focus:border-orange-500"
          disabled={isFormDisabled}
          id="fullName"
          {...register("fullName", { required: "Nome completo é obrigatório." })}
        />
        {errors.fullName ? <p className="text-sm text-red-300">{errors.fullName.message}</p> : null}
      </div>

      <div className="flex flex-col gap-2 text-left">
        <label className="text-sm font-medium text-gray-200" htmlFor="phone">
          Telefone
        </label>
        <input
          className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-base text-gray-100 outline-none focus:border-orange-500"
          disabled={isFormDisabled}
          id="phone"
          type="tel"
          {...register("phone")}
        />
        {errors.phone ? <p className="text-sm text-red-300">{errors.phone.message}</p> : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <ReadOnlyField label="Cargo" value={profile.job_title ?? "—"} />
        <ReadOnlyField label="Status" value={profile.is_active ? "Ativo" : "Inativo"} />
        <ReadOnlyField label="Criado em" value={formatDate(profile.created_at)} />
        <ReadOnlyField label="Atualizado em" value={formatDate(profile.updated_at)} />
        <ReadOnlyField label="Último acesso" value={formatDate(profile.last_access_at)} />
        {profile.avatar_path ? <ReadOnlyField label="Avatar" value={profile.avatar_path} /> : null}
      </div>

      {formError ? (
        <p className="rounded-lg border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-200">
          {formError}
        </p>
      ) : null}

      {isUpdateSuccess ? (
        <p className="rounded-lg border border-green-900/60 bg-green-950/30 px-3 py-2 text-sm text-green-200">
          Perfil atualizado com sucesso.
        </p>
      ) : null}

      <button
        className="rounded-lg bg-orange-500 px-4 py-2 text-base font-semibold text-white transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isFormDisabled}
        type="submit"
      >
        {isUpdating ? "Salvando..." : "Salvar alterações"}
      </button>
    </form>
  );
}

export function ProfilePage() {
  const { user } = useAuth();
  const {
    profile,
    isLoading,
    isError,
    error,
    isNotFound,
    updateProfile,
    isUpdating,
    isUpdateSuccess,
    resetUpdateState,
  } = useProfile();

  if (isLoading) {
    return <ProfileLoading />;
  }

  if (isError) {
    return <ProfileError message={error instanceof Error ? error.message : undefined} />;
  }

  if (isNotFound || !profile) {
    return <ProfileNotFound />;
  }

  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-10">
      <header className="flex flex-col gap-2">
        <Link className="text-sm text-orange-400 hover:text-orange-300" href="/">
          ← Voltar
        </Link>
        <h1 className="text-3xl font-bold text-gray-100">Meu perfil</h1>
        <p className="text-sm text-gray-400">Atualize seus dados de contato.</p>
      </header>

      <ProfileForm
        email={user?.email}
        isUpdateSuccess={isUpdateSuccess}
        isUpdating={isUpdating}
        onResetUpdateState={resetUpdateState}
        onSubmitProfile={async (input) => {
          await updateProfile(input);
        }}
        profile={profile}
      />
    </section>
  );
}
