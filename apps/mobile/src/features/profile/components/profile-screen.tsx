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
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
        <Text style={styles.label}>Nome completo</Text>
        <Controller
          control={control}
          name="fullName"
          rules={{ required: "Nome completo é obrigatório." }}
          render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
            <>
              <TextInput
                accessibilityLabel="Nome completo"
                autoCapitalize="words"
                autoCorrect={false}
                editable={!isFormDisabled}
                placeholder="Seu nome completo"
                placeholderTextColor="#6B7280"
                style={styles.input}
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
              />
              {error ? <Text style={styles.fieldError}>{error.message}</Text> : null}
            </>
          )}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Telefone</Text>
        <Controller
          control={control}
          name="phone"
          render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
            <>
              <TextInput
                accessibilityLabel="Telefone"
                editable={!isFormDisabled}
                keyboardType="phone-pad"
                placeholder="(00) 00000-0000"
                placeholderTextColor="#6B7280"
                style={styles.input}
                textContentType="telephoneNumber"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
              />
              {error ? <Text style={styles.fieldError}>{error.message}</Text> : null}
            </>
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

      <Pressable
        accessibilityLabel="Salvar alterações"
        accessibilityRole="button"
        disabled={isFormDisabled}
        style={({ pressed }) => [
          styles.submitButton,
          isFormDisabled && styles.submitButtonDisabled,
          pressed && !isFormDisabled && styles.submitButtonPressed,
        ]}
        onPress={() => {
          void handleSubmit(onSubmit)();
        }}
      >
        <Text style={styles.submitButtonText}>
          {isUpdating ? "Salvando..." : "Salvar alterações"}
        </Text>
      </Pressable>
    </View>
  );
}

export function ProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { profile, isLoading, isError, error, isNotFound, updateProfile, isUpdating } =
    useProfile();

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
            <ProfileError message={error instanceof Error ? error.message : undefined} />
          ) : null}

          {!isLoading && !isError && (isNotFound || !profile) ? <ProfileNotFound /> : null}

          {!isLoading && !isError && profile ? (
            <ProfileForm
              email={user?.email}
              isUpdating={isUpdating}
              profile={profile}
              onSubmitProfile={async (input) => {
                await updateProfile(input);
              }}
            />
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#0F1115",
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    gap: 24,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  header: {
    gap: 8,
  },
  backLink: {
    alignSelf: "flex-start",
    minHeight: 44,
    justifyContent: "center",
  },
  backLinkPressed: {
    opacity: 0.8,
  },
  backLinkText: {
    color: "#FB923C",
    fontSize: 14,
    fontWeight: "600",
  },
  title: {
    color: "#F9FAFB",
    fontSize: 28,
    fontWeight: "700",
  },
  subtitle: {
    color: "#9CA3AF",
    fontSize: 14,
  },
  form: {
    gap: 16,
  },
  inactiveBanner: {
    backgroundColor: "rgba(120, 53, 15, 0.35)",
    borderColor: "rgba(180, 83, 9, 0.6)",
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  inactiveBannerText: {
    color: "#FDE68A",
    fontSize: 14,
    lineHeight: 20,
  },
  field: {
    gap: 8,
  },
  label: {
    color: "#E5E7EB",
    fontSize: 14,
    fontWeight: "600",
  },
  input: {
    backgroundColor: "#1F2937",
    borderColor: "#374151",
    borderRadius: 8,
    borderWidth: 1,
    color: "#F9FAFB",
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: 12,
  },
  fieldError: {
    color: "#FCA5A5",
    fontSize: 13,
  },
  readOnlyField: {
    gap: 4,
  },
  readOnlyLabel: {
    color: "#9CA3AF",
    fontSize: 13,
    fontWeight: "500",
  },
  readOnlyValue: {
    color: "#E5E7EB",
    fontSize: 15,
  },
  readOnlyGrid: {
    gap: 12,
    marginTop: 8,
  },
  formError: {
    color: "#FCA5A5",
    fontSize: 14,
    textAlign: "center",
  },
  submitButton: {
    alignItems: "center",
    backgroundColor: "#F97316",
    borderRadius: 8,
    justifyContent: "center",
    marginTop: 8,
    minHeight: 48,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonPressed: {
    opacity: 0.85,
  },
  submitButtonText: {
    color: "#0F1115",
    fontSize: 16,
    fontWeight: "700",
  },
});
