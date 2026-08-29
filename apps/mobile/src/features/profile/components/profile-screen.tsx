import { profileUpdateSchema, type ProfileUpdateInput } from "@safestop/validation";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, controlHeight, radius, spacing, statusChip, typography } from "@safestop/ui";

import { Button, TextField } from "@/components/ui";
import { useAuth } from "@/hooks/use-auth";
import { authRoutes } from "@/lib/auth/routes";

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
    <View style={styles.readOnlyField}>
      <Text style={styles.readOnlyLabel}>{label}</Text>
      <Text style={styles.readOnlyValue}>{value}</Text>
    </View>
  );
}

type ProfileFormProps = {
  profile: Profile;
  email: string | null | undefined;
  isUpdating: boolean;
  onSubmitProfile: (input: ProfileUpdateInput) => Promise<void>;
};

function ProfileInactiveBanner() {
  return (
    <View accessibilityRole="alert" style={styles.inactiveBanner}>
      <Text style={styles.inactiveBannerText}>
        {PROFILE_INACTIVE_MESSAGE} A edição do perfil está desabilitada.
      </Text>
    </View>
  );
}

function ProfileForm({ profile, email, isUpdating, onSubmitProfile }: ProfileFormProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const isProfileInactive = !profile.is_active;
  const isFormDisabled = isUpdating || isProfileInactive;

  const { control, handleSubmit, reset } = useForm<ProfileUpdateInput>({
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
      Alert.alert("Perfil inativo", PROFILE_INACTIVE_MESSAGE);
      return;
    }

    setFormError(null);

    const parsed = profileUpdateSchema.safeParse(values);

    if (!parsed.success) {
      setFormError("Verifique os campos e tente novamente.");
      return;
    }

    try {
      await onSubmitProfile(parsed.data);
      Alert.alert("Sucesso", "Perfil atualizado com sucesso.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Não foi possível salvar o perfil. Tente novamente.";
      setFormError(message);
      Alert.alert("Erro", message);
    }
  }

  return (
    <View style={styles.form}>
      {isProfileInactive ? <ProfileInactiveBanner /> : null}

      <ReadOnlyField label="E-mail" value={email ?? "—"} />

      <View style={styles.field}>
        <Controller
          control={control}
          name="fullName"
          rules={{ required: "Nome completo é obrigatório." }}
          render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
            <TextField
              accessibilityLabel="Nome completo"
              autoCapitalize="words"
              autoCorrect={false}
              disabled={isFormDisabled}
              error={error?.message}
              label="Nome completo"
              placeholder="Seu nome completo"
              value={value}
              onBlur={onBlur}
              onChangeText={onChange}
            />
          )}
        />
      </View>

      <View style={styles.field}>
        <Controller
          control={control}
          name="phone"
          render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
            <TextField
              accessibilityLabel="Telefone"
              disabled={isFormDisabled}
              error={error?.message}
              keyboardType="phone-pad"
              label="Telefone"
              placeholder="(00) 00000-0000"
              textContentType="telephoneNumber"
              value={value}
              onBlur={onBlur}
              onChangeText={onChange}
            />
          )}
        />
      </View>

      <View style={styles.readOnlyGrid}>
        <ReadOnlyField label="Cargo" value={profile.job_title ?? "—"} />
        <ReadOnlyField label="Status" value={profile.is_active ? "Ativo" : "Inativo"} />
        <ReadOnlyField label="Criado em" value={formatDate(profile.created_at)} />
        <ReadOnlyField label="Atualizado em" value={formatDate(profile.updated_at)} />
        <ReadOnlyField label="Último acesso" value={formatDate(profile.last_access_at)} />
        {profile.avatar_path ? <ReadOnlyField label="Avatar" value={profile.avatar_path} /> : null}
      </View>

      {formError ? <Text style={styles.formError}>{formError}</Text> : null}

      <Button
        accessibilityLabel="Salvar alterações"
        disabled={isFormDisabled}
        loading={isUpdating}
        onPress={() => {
          void handleSubmit(onSubmit)();
        }}
      >
        {isUpdating ? "Salvando..." : "Salvar alterações"}
      </Button>
    </View>
  );
}

export function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { profile, isLoading, isError, error, isNotFound, updateProfile, isUpdating, refetch } =
    useProfile();

  async function handleSignOut() {
    await signOut();
    router.replace(authRoutes.login);
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Pressable
              accessibilityLabel="Voltar"
              accessibilityRole="button"
              style={({ pressed }) => [styles.backLink, pressed && styles.backLinkPressed]}
              onPress={() => {
                router.replace(authRoutes.app);
              }}
            >
              <Text style={styles.backLinkText}>← Voltar</Text>
            </Pressable>
            <Text style={styles.title}>Meu perfil</Text>
            <Text style={styles.subtitle}>Atualize seus dados de contato.</Text>
          </View>

          {isLoading ? <ProfileLoading /> : null}

          {!isLoading && isError ? (
            <ProfileError
              message={error instanceof Error ? error.message : undefined}
              onRetry={() => {
                void refetch();
              }}
            />
          ) : null}

          {!isLoading && !isError && (isNotFound || !profile) ? <ProfileNotFound /> : null}

          {!isLoading && !isError && profile ? (
            <>
              <ProfileForm
                email={user?.email}
                isUpdating={isUpdating}
                profile={profile}
                onSubmitProfile={async (input) => {
                  await updateProfile(input);
                }}
              />

              <Button
                accessibilityLabel="Sair"
                style={styles.signOutButton}
                variant="destructive"
                onPress={() => {
                  void handleSignOut();
                }}
              >
                Sair
              </Button>
            </>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    gap: spacing[6],
    paddingBottom: spacing[8],
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[4],
  },
  signOutButton: {
    marginTop: spacing[2],
  },
  header: {
    gap: spacing[2],
  },
  backLink: {
    alignSelf: "flex-start",
    minHeight: controlHeight.mobile,
    justifyContent: "center",
  },
  backLinkPressed: {
    opacity: 0.8,
  },
  backLinkText: {
    color: colors.primary,
    fontSize: typography.label.fontSize,
    fontWeight: "600",
  },
  title: {
    color: colors.foreground,
    fontSize: typography.sectionTitle.fontSize,
    fontWeight: typography.sectionTitle.fontWeight,
  },
  subtitle: {
    color: colors.foregroundMuted,
    fontSize: typography.label.fontSize,
  },
  form: {
    gap: spacing[4],
  },
  inactiveBanner: {
    backgroundColor: statusChip.warning.background,
    borderColor: statusChip.warning.border,
    borderRadius: radius.button,
    borderWidth: 1,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
  },
  inactiveBannerText: {
    color: statusChip.warning.foreground,
    fontSize: typography.label.fontSize,
    lineHeight: 20,
  },
  field: {
    gap: spacing[2],
  },
  readOnlyField: {
    gap: spacing[1],
  },
  readOnlyLabel: {
    color: colors.foregroundMuted,
    fontSize: typography.helper.fontSize,
    fontWeight: "500",
  },
  readOnlyValue: {
    color: colors.foreground,
    fontSize: typography.body.fontSize,
  },
  readOnlyGrid: {
    gap: spacing[3],
    marginTop: spacing[2],
  },
  formError: {
    color: colors.destructive,
    fontSize: typography.label.fontSize,
    textAlign: "center",
  },
});
