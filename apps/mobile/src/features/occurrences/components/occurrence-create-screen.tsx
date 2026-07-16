import { OCCURRENCE_SEVERITIES } from "@safestop/types";
import { createOccurrenceSchema, type CreateOccurrenceInput } from "@safestop/validation";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
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

import { useRequirePermission } from "@/features/authorization/hooks/use-require-permission";
import { authRoutes, occurrenceDetailRoute } from "@/lib/auth/routes";

import { OccurrenceError } from "./occurrence-error";
import { OccurrenceLoading } from "./occurrence-loading";
import { OccurrenceSyncStatusBadge } from "./occurrence-sync-status-badge";
import { useCreateOccurrence } from "../hooks/use-create-occurrence";
import { useOccurrenceAreas } from "../hooks/use-occurrence-areas";
import { useOccurrenceDraft } from "../hooks/use-occurrence-draft";
import { getOccurrenceSeverityLabel } from "../utils/occurrence-labels";

const DEFAULT_VALUES: CreateOccurrenceInput = {
  title: "",
  taskDescription: "",
  locationDescription: "",
  conditionDescription: "",
  immediateActionDescription: "",
  severity: "MEDIUM",
  areaId: "",
};

export function OccurrenceCreateScreen() {
  const router = useRouter();
  useRequirePermission("occurrence.create");

  const { createOccurrence, isCreating, canCreate } = useCreateOccurrence();
  const { areas, isLoading: isAreasLoading, isError: isAreasError } = useOccurrenceAreas();
  const {
    draft,
    updateDraft,
    clearDraft,
    isHydrated,
    hasLocalDraft,
    isSaving,
    isReady: isDraftReady,
  } = useOccurrenceDraft();

  const [formError, setFormError] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);

  const { control, handleSubmit, reset, getValues } = useForm<CreateOccurrenceInput>({
    defaultValues: DEFAULT_VALUES,
  });

  const hasHydratedFormRef = useRef(false);

  const persistCurrentDraft = () => {
    updateDraft(getValues());
  };

  useEffect(() => {
    if (!isHydrated || !isDraftReady) {
      hasHydratedFormRef.current = false;
      return;
    }

    if (hasHydratedFormRef.current) {
      return;
    }

    hasHydratedFormRef.current = true;
    reset({
      title: draft.title ?? "",
      taskDescription: draft.taskDescription ?? "",
      locationDescription: draft.locationDescription ?? "",
      conditionDescription: draft.conditionDescription ?? "",
      immediateActionDescription: draft.immediateActionDescription ?? "",
      severity: draft.severity ?? "MEDIUM",
      areaId: draft.areaId ?? "",
    });
  }, [draft, isDraftReady, isHydrated, reset]);

  if (!canCreate) {
    return null;
  }

  if (!isHydrated || isAreasLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <OccurrenceLoading />
      </SafeAreaView>
    );
  }

  if (isAreasError) {
    return (
      <SafeAreaView style={styles.container}>
        <OccurrenceError message="Não foi possível carregar as áreas." />
      </SafeAreaView>
    );
  }

  async function onSubmit(values: CreateOccurrenceInput) {
    setFormError(null);

    const parsed = createOccurrenceSchema.safeParse(values);

    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? "Verifique os campos do formulário.");
      return;
    }

    try {
      const result = await createOccurrence(parsed.data);
      await clearDraft();
      setIsRegistered(true);
      reset(DEFAULT_VALUES);

      router.replace(occurrenceDetailRoute(result.id));
    } catch {
      setFormError("Não foi possível registrar a ocorrência. Seus dados foram preservados.");
    }
  }

  function handleDiscardDraft() {
    Alert.alert("Descartar rascunho", "Os dados salvos neste dispositivo serão removidos.", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Descartar",
        style: "destructive",
        onPress: () => {
          void (async () => {
            await clearDraft();
            reset(DEFAULT_VALUES);
            setIsRegistered(false);
          })();
        },
      },
    ]);
  }

  const syncStatus = isRegistered ? "registered_on_server" : hasLocalDraft ? "saved_locally" : null;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Pressable
            accessibilityLabel="Voltar para ocorrências"
            accessibilityRole="button"
            onPress={() => {
              router.replace(authRoutes.occurrences);
            }}
          >
            <Text style={styles.backLink}>Voltar</Text>
          </Pressable>

          <Text style={styles.title}>Nova Paralisação</Text>
          <Text style={styles.subtitle}>
            Preencha o mínimo necessário para comunicar a condição insegura.
          </Text>

          {syncStatus ? <OccurrenceSyncStatusBadge status={syncStatus} /> : null}

          {isSaving ? <Text style={styles.savingHint}>Salvando rascunho…</Text> : null}

          <View style={styles.form}>
            <Text style={styles.label}>Título</Text>
            <Controller
              control={control}
              name="title"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  accessibilityLabel="Título"
                  editable={!isCreating}
                  placeholder="Resumo curto da ocorrência"
                  placeholderTextColor="#6B7280"
                  style={styles.input}
                  value={value}
                  onBlur={() => {
                    onBlur();
                    persistCurrentDraft();
                  }}
                  onChangeText={(text) => {
                    onChange(text);
                  }}
                />
              )}
            />

            <Text style={styles.label}>Atividade</Text>
            <Controller
              control={control}
              name="taskDescription"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  accessibilityLabel="Atividade"
                  editable={!isCreating}
                  multiline
                  placeholder="Descreva a atividade interrompida"
                  placeholderTextColor="#6B7280"
                  style={[styles.input, styles.multiline]}
                  value={value}
                  onBlur={() => {
                    onBlur();
                    persistCurrentDraft();
                  }}
                  onChangeText={(text) => {
                    onChange(text);
                  }}
                />
              )}
            />

            <Text style={styles.label}>Local</Text>
            <Controller
              control={control}
              name="locationDescription"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  accessibilityLabel="Local"
                  editable={!isCreating}
                  placeholder="Onde a condição foi identificada"
                  placeholderTextColor="#6B7280"
                  style={styles.input}
                  value={value}
                  onBlur={() => {
                    onBlur();
                    persistCurrentDraft();
                  }}
                  onChangeText={(text) => {
                    onChange(text);
                  }}
                />
              )}
            />

            <Text style={styles.label}>Condição insegura</Text>
            <Controller
              control={control}
              name="conditionDescription"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  accessibilityLabel="Condição insegura"
                  editable={!isCreating}
                  multiline
                  placeholder="Descreva a condição identificada"
                  placeholderTextColor="#6B7280"
                  style={[styles.input, styles.multiline]}
                  value={value}
                  onBlur={() => {
                    onBlur();
                    persistCurrentDraft();
                  }}
                  onChangeText={(text) => {
                    onChange(text);
                  }}
                />
              )}
            />

            <Text style={styles.label}>Ação imediata (opcional)</Text>
            <Controller
              control={control}
              name="immediateActionDescription"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  accessibilityLabel="Ação imediata"
                  editable={!isCreating}
                  multiline
                  placeholder="Medida tomada no local, se houver"
                  placeholderTextColor="#6B7280"
                  style={[styles.input, styles.multiline]}
                  value={value ?? ""}
                  onBlur={() => {
                    onBlur();
                    persistCurrentDraft();
                  }}
                  onChangeText={(text) => {
                    onChange(text);
                  }}
                />
              )}
            />

            <Text style={styles.label}>Criticidade</Text>
            <Controller
              control={control}
              name="severity"
              render={({ field: { onChange, value } }) => (
                <View style={styles.severityRow}>
                  {OCCURRENCE_SEVERITIES.map((severity) => {
                    const isSelected = value === severity;

                    return (
                      <Pressable
                        key={severity}
                        accessibilityLabel={getOccurrenceSeverityLabel(severity)}
                        accessibilityRole="button"
                        accessibilityState={{ selected: isSelected }}
                        disabled={isCreating}
                        style={({ pressed }) => [
                          styles.severityChip,
                          isSelected && styles.severityChipSelected,
                          pressed && !isCreating && styles.buttonPressed,
                        ]}
                        onPress={() => {
                          onChange(severity);
                          updateDraft({ severity });
                        }}
                      >
                        <Text
                          style={[
                            styles.severityChipText,
                            isSelected && styles.severityChipTextSelected,
                          ]}
                        >
                          {getOccurrenceSeverityLabel(severity)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            />

            <Text style={styles.label}>Área</Text>
            <Controller
              control={control}
              name="areaId"
              render={({ field: { onChange, value } }) => (
                <View style={styles.areaList}>
                  {areas.map((area) => {
                    const isSelected = value === area.id;

                    return (
                      <Pressable
                        key={area.id}
                        accessibilityLabel={area.name}
                        accessibilityRole="button"
                        accessibilityState={{ selected: isSelected }}
                        disabled={isCreating}
                        style={({ pressed }) => [
                          styles.areaOption,
                          isSelected && styles.areaOptionSelected,
                          pressed && !isCreating && styles.buttonPressed,
                        ]}
                        onPress={() => {
                          onChange(area.id);
                          updateDraft({ areaId: area.id });
                        }}
                      >
                        <Text
                          style={[
                            styles.areaOptionText,
                            isSelected && styles.areaOptionTextSelected,
                          ]}
                        >
                          {area.name}
                          {area.code ? ` (${area.code})` : ""}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            />

            {formError ? <Text style={styles.error}>{formError}</Text> : null}

            <Pressable
              accessibilityLabel="Registrar ocorrência"
              accessibilityRole="button"
              disabled={isCreating}
              style={({ pressed }) => [
                styles.submitButton,
                isCreating && styles.submitButtonDisabled,
                pressed && !isCreating && styles.buttonPressed,
              ]}
              onPress={() => {
                void handleSubmit(onSubmit)();
              }}
            >
              {isCreating ? (
                <ActivityIndicator color="#0F1115" />
              ) : (
                <Text style={styles.submitButtonText}>Registrar no servidor</Text>
              )}
            </Pressable>

            {hasLocalDraft ? (
              <Pressable
                accessibilityLabel="Descartar rascunho"
                accessibilityRole="button"
                disabled={isCreating}
                onPress={handleDiscardDraft}
              >
                <Text style={styles.discardLink}>Descartar rascunho local</Text>
              </Pressable>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  areaList: {
    gap: 8,
  },
  areaOption: {
    backgroundColor: "#1F2937",
    borderColor: "#374151",
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  areaOptionSelected: {
    borderColor: "#F97316",
  },
  areaOptionText: {
    color: "#D1D5DB",
    fontSize: 14,
  },
  areaOptionTextSelected: {
    color: "#F9FAFB",
    fontWeight: "600",
  },
  backLink: {
    color: "#F97316",
    fontSize: 14,
    fontWeight: "600",
  },
  buttonPressed: {
    opacity: 0.85,
  },
  container: {
    backgroundColor: "#0F1115",
    flex: 1,
  },
  content: {
    gap: 12,
    padding: 16,
    paddingBottom: 32,
  },
  discardLink: {
    color: "#F87171",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  error: {
    color: "#F87171",
    fontSize: 14,
    textAlign: "center",
  },
  form: {
    gap: 10,
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
    paddingVertical: 10,
  },
  keyboardView: {
    flex: 1,
  },
  label: {
    color: "#D1D5DB",
    fontSize: 14,
    fontWeight: "600",
  },
  multiline: {
    minHeight: 88,
    textAlignVertical: "top",
  },
  savingHint: {
    color: "#6B7280",
    fontSize: 12,
  },
  severityChip: {
    backgroundColor: "#1F2937",
    borderColor: "#374151",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  severityChipSelected: {
    backgroundColor: "#F97316",
    borderColor: "#F97316",
  },
  severityChipText: {
    color: "#D1D5DB",
    fontSize: 12,
    fontWeight: "600",
  },
  severityChipTextSelected: {
    color: "#0F1115",
  },
  severityRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
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
  submitButtonText: {
    color: "#0F1115",
    fontSize: 16,
    fontWeight: "700",
  },
  subtitle: {
    color: "#9CA3AF",
    fontSize: 14,
  },
  title: {
    color: "#F9FAFB",
    fontSize: 24,
    fontWeight: "700",
  },
});
