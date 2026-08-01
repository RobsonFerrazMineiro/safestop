import type { CreatePreventiveStopInput } from "@safestop/validation";
import { createPreventiveStopSchema } from "@safestop/validation";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { useRequirePermission } from "@/features/authorization/hooks/use-require-permission";
import { OccurrenceError } from "@/features/occurrences/components/occurrence-error";
import { OccurrenceLoading } from "@/features/occurrences/components/occurrence-loading";
import { OccurrenceSyncStatusBadge } from "@/features/occurrences/components/occurrence-sync-status-badge";
import { useOccurrenceAreas } from "@/features/occurrences/hooks/use-occurrence-areas";
import { useOccurrenceContracts } from "@/features/occurrences/hooks/use-occurrence-contracts";
import { useOccurrenceContractors } from "@/features/occurrences/hooks/use-occurrence-contractors";
import { formatContractOptionLabel } from "@/features/occurrences/services/get-contracts";
import { stopWorkDetailRoute, stopWorkRoute } from "@/lib/auth/routes";

import { OptionSelectList } from "./option-select-list";
import { PreventiveStopCallout } from "./preventive-stop-callout";
import { PreventiveStopSuccessView } from "./preventive-stop-success-view";
import { SeveritySelector } from "./severity-selector";
import { useCreatePreventiveStop } from "../hooks/use-create-preventive-stop";
import { usePreventiveStopDraft } from "../hooks/use-preventive-stop-draft";
import { usePreventiveStopGeo } from "../hooks/use-preventive-stop-geo";

const DEFAULT_VALUES: CreatePreventiveStopInput = {
  areaId: "",
  locationDescription: "",
  taskDescription: "",
  conditionDescription: "",
  contractorOrganizationId: "",
  contractId: "",
  immediateActionDescription: "",
  severity: "MEDIUM",
};

type SuccessResult = {
  id: string;
  publicCode: string;
};

function useIsOffline(): boolean {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    if (Platform.OS !== "web") {
      return;
    }

    const browserGlobal = globalThis as typeof globalThis & {
      navigator?: { onLine?: boolean };
      addEventListener?: (type: string, listener: () => void) => void;
      removeEventListener?: (type: string, listener: () => void) => void;
    };

    const updateStatus = () => {
      setIsOffline(browserGlobal.navigator?.onLine === false);
    };

    updateStatus();
    browserGlobal.addEventListener?.("online", updateStatus);
    browserGlobal.addEventListener?.("offline", updateStatus);

    return () => {
      browserGlobal.removeEventListener?.("online", updateStatus);
      browserGlobal.removeEventListener?.("offline", updateStatus);
    };
  }, []);

  return isOffline;
}

export function PreventiveStopCreateScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  useRequirePermission("occurrence.create");

  const { createPreventiveStop, isCreating, canCreate } = useCreatePreventiveStop();
  const { areas, isLoading: isAreasLoading, isError: isAreasError } = useOccurrenceAreas();
  const {
    contractors,
    isLoading: isContractorsLoading,
    isError: isContractorsError,
  } = useOccurrenceContractors();
  const {
    draft,
    updateDraft,
    clearDraft,
    isHydrated,
    hasLocalDraft,
    isSaving,
    isReady: isDraftReady,
  } = usePreventiveStopDraft();
  const geo = usePreventiveStopGeo();
  const isOffline = useIsOffline();

  const [formError, setFormError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<SuccessResult | null>(null);

  const { control, handleSubmit, reset, getValues, setValue, watch } =
    useForm<CreatePreventiveStopInput>({
      defaultValues: DEFAULT_VALUES,
    });

  const selectedContractorId = watch("contractorOrganizationId");
  const {
    contracts,
    isLoading: isContractsLoading,
    isError: isContractsError,
  } = useOccurrenceContracts({
    contractorOrganizationId: selectedContractorId || undefined,
  });

  const hasHydratedFormRef = useRef(false);
  const autoContractRef = useRef<string | null>(null);

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
      areaId: draft.areaId ?? "",
      locationDescription: draft.locationDescription ?? "",
      taskDescription: draft.taskDescription ?? "",
      conditionDescription: draft.conditionDescription ?? "",
      contractorOrganizationId: draft.contractorOrganizationId ?? "",
      contractId: draft.contractId ?? "",
      immediateActionDescription: draft.immediateActionDescription ?? "",
      severity: draft.severity ?? "MEDIUM",
    });
  }, [draft, isDraftReady, isHydrated, reset]);

  useEffect(() => {
    if (!selectedContractorId || isContractsLoading || contracts.length !== 1) {
      return;
    }

    const singleContractId = contracts[0]?.id;

    if (!singleContractId || autoContractRef.current === singleContractId) {
      return;
    }

    autoContractRef.current = singleContractId;
    setValue("contractId", singleContractId);
    updateDraft({ contractId: singleContractId });
  }, [contracts, isContractsLoading, selectedContractorId, setValue, updateDraft]);

  useEffect(() => {
    autoContractRef.current = null;
  }, [selectedContractorId]);

  if (!canCreate) {
    return null;
  }

  if (successResult) {
    return (
      <PreventiveStopSuccessView
        publicCode={successResult.publicCode}
        onCreateAnother={() => {
          setSuccessResult(null);
          reset(DEFAULT_VALUES);
          void clearDraft();
        }}
        onViewDetail={() => {
          router.replace(stopWorkDetailRoute(successResult.id));
        }}
      />
    );
  }

  if (!isHydrated || isAreasLoading || isContractorsLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <OccurrenceLoading />
      </SafeAreaView>
    );
  }

  if (isAreasError || isContractorsError) {
    return (
      <SafeAreaView style={styles.container}>
        <OccurrenceError message="Não foi possível carregar as opções do formulário." />
      </SafeAreaView>
    );
  }

  const hasAreas = areas.length > 0;
  const hasContractors = contractors.length > 0;
  const canSubmit = hasAreas && hasContractors && !isOffline && !isCreating;
  const showContractField =
    Boolean(selectedContractorId) && !isContractsLoading && contracts.length > 0;

  async function onSubmit(values: CreatePreventiveStopInput) {
    setFormError(null);

    if (isOffline) {
      setFormError("Você está offline. Conecte-se para registrar a paralisação.");
      return;
    }

    const payload = {
      ...values,
      contractId: values.contractId?.trim() ? values.contractId : undefined,
      ...geo.coords,
    };

    const parsed = createPreventiveStopSchema.safeParse(payload);

    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? "Verifique os campos do formulário.");
      return;
    }

    try {
      const result = await createPreventiveStop(parsed.data);
      await clearDraft();
      reset(DEFAULT_VALUES);
      setSuccessResult({
        id: result.id,
        publicCode: result.publicCode,
      });
    } catch {
      setFormError("Não foi possível registrar. Seus dados foram preservados.");
    }
  }

  const geoLabel =
    geo.status === "capturing"
      ? "Capturando localização…"
      : geo.status === "captured"
        ? "Localização capturada"
        : "Localização não disponível";

  return (
    <SafeAreaView edges={["top"]} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: 120 + insets.bottom }]}
          keyboardShouldPersistTaps="handled"
        >
          <Pressable
            accessibilityLabel="Voltar para listagem"
            accessibilityRole="button"
            onPress={() => {
              router.replace(stopWorkRoute);
            }}
          >
            <Text style={styles.backLink}>Voltar</Text>
          </Pressable>

          <Text style={styles.title}>Nova Paralisação Preventiva</Text>
          <Text style={styles.subtitle}>Identifique a condição insegura</Text>

          <PreventiveStopCallout />

          {hasLocalDraft ? <OccurrenceSyncStatusBadge status="saved_locally" /> : null}
          {isSaving ? <Text style={styles.savingHint}>Salvando rascunho…</Text> : null}
          {isOffline ? <Text style={styles.offlineBanner}>Você está offline.</Text> : null}

          <View style={styles.form}>
            <Text style={styles.label}>Área *</Text>
            <Controller
              control={control}
              name="areaId"
              render={({ field: { onChange, value } }) => (
                <OptionSelectList
                  disabled={isCreating}
                  emptyMessage={
                    hasAreas ? undefined : "Nenhuma área cadastrada para esta organização."
                  }
                  items={areas.map((area) => ({
                    id: area.id,
                    label: area.name,
                    hint: area.code ?? undefined,
                  }))}
                  selectedId={value}
                  onSelect={(id) => {
                    onChange(id);
                    updateDraft({ areaId: id });
                  }}
                />
              )}
            />

            <Text style={styles.label}>Local *</Text>
            <Controller
              control={control}
              name="locationDescription"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  accessibilityLabel="Local"
                  editable={!isCreating}
                  placeholder="Ex: Galpão 3"
                  placeholderTextColor="#6B7280"
                  style={styles.input}
                  value={value}
                  onBlur={() => {
                    onBlur();
                    persistCurrentDraft();
                  }}
                  onChangeText={onChange}
                />
              )}
            />

            <Text style={styles.label}>Atividade *</Text>
            <Controller
              control={control}
              name="taskDescription"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  accessibilityLabel="Atividade"
                  editable={!isCreating}
                  placeholder="Atividade sendo realizada"
                  placeholderTextColor="#6B7280"
                  style={styles.input}
                  value={value}
                  onBlur={() => {
                    onBlur();
                    persistCurrentDraft();
                  }}
                  onChangeText={onChange}
                />
              )}
            />

            <Text style={styles.label}>Condição insegura *</Text>
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
                  style={[styles.input, styles.multilineLarge]}
                  value={value}
                  onBlur={() => {
                    onBlur();
                    persistCurrentDraft();
                  }}
                  onChangeText={onChange}
                />
              )}
            />

            <Text style={styles.label}>Criticidade *</Text>
            <Controller
              control={control}
              name="severity"
              render={({ field: { onChange, value } }) => (
                <SeveritySelector
                  disabled={isCreating}
                  value={value}
                  onChange={(severity) => {
                    onChange(severity);
                    updateDraft({ severity });
                  }}
                />
              )}
            />

            <Text style={styles.label}>Contratada *</Text>
            <Controller
              control={control}
              name="contractorOrganizationId"
              render={({ field: { onChange, value } }) => (
                <OptionSelectList
                  disabled={isCreating}
                  emptyMessage={
                    hasContractors
                      ? undefined
                      : "Nenhuma contratada com contrato ativo. Contate o administrador."
                  }
                  items={contractors.map((contractor) => ({
                    id: contractor.id,
                    label: contractor.name,
                  }))}
                  selectedId={value}
                  onSelect={(id) => {
                    onChange(id);
                    setValue("contractId", "");
                    updateDraft({ contractorOrganizationId: id, contractId: undefined });
                  }}
                />
              )}
            />

            {selectedContractorId && isContractsLoading ? (
              <Text style={styles.hint}>Carregando contratos…</Text>
            ) : null}

            {showContractField ? (
              <>
                <Text style={styles.label}>Contrato (opcional)</Text>
                <Controller
                  control={control}
                  name="contractId"
                  render={({ field: { onChange, value } }) => (
                    <OptionSelectList
                      disabled={isCreating}
                      items={contracts.map((contract) => ({
                        id: contract.id,
                        label: formatContractOptionLabel(contract),
                      }))}
                      noneOptionLabel="Nenhum contrato específico"
                      selectedId={value ?? ""}
                      onSelect={(id) => {
                        onChange(id);
                        updateDraft({ contractId: id || undefined });
                      }}
                    />
                  )}
                />
              </>
            ) : null}

            {isContractsError ? (
              <Text style={styles.error}>Não foi possível carregar os contratos.</Text>
            ) : null}

            <Text style={styles.label}>Medida imediata (opcional)</Text>
            <Controller
              control={control}
              name="immediateActionDescription"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  accessibilityLabel="Medida imediata"
                  editable={!isCreating}
                  multiline
                  placeholder="Medida tomada no local, se houver"
                  placeholderTextColor="#6B7280"
                  style={[styles.input, styles.multilineSmall]}
                  value={value ?? ""}
                  onBlur={() => {
                    onBlur();
                    persistCurrentDraft();
                  }}
                  onChangeText={onChange}
                />
              )}
            />

            <Text style={styles.geoHint}>📍 {geoLabel}</Text>

            {formError ? <Text style={styles.error}>{formError}</Text> : null}
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <Pressable
            accessibilityLabel="Paralisar atividade"
            accessibilityRole="button"
            disabled={!canSubmit}
            style={({ pressed }) => [
              styles.submitButton,
              !canSubmit && styles.submitButtonDisabled,
              pressed && canSubmit && styles.buttonPressed,
            ]}
            onPress={() => {
              void handleSubmit(onSubmit)();
            }}
          >
            {isCreating ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color="#0F1115" />
                <Text style={styles.submitButtonText}>Registrando...</Text>
              </View>
            ) : (
              <Text style={styles.submitButtonText}>Paralisar atividade</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  },
  error: {
    color: "#F87171",
    fontSize: 14,
    textAlign: "center",
  },
  footer: {
    backgroundColor: "#0F1115",
    borderTopColor: "#1F2937",
    borderTopWidth: 1,
    bottom: 0,
    left: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    position: "absolute",
    right: 0,
  },
  form: {
    gap: 10,
  },
  geoHint: {
    color: "#6B7280",
    fontSize: 13,
  },
  hint: {
    color: "#9CA3AF",
    fontSize: 13,
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
  loadingRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  multilineLarge: {
    minHeight: 96,
    textAlignVertical: "top",
  },
  multilineSmall: {
    minHeight: 72,
    textAlignVertical: "top",
  },
  offlineBanner: {
    backgroundColor: "#450A0A",
    borderRadius: 8,
    color: "#FCA5A5",
    fontSize: 14,
    fontWeight: "600",
    paddingHorizontal: 12,
    paddingVertical: 10,
    textAlign: "center",
  },
  savingHint: {
    color: "#6B7280",
    fontSize: 12,
  },
  submitButton: {
    alignItems: "center",
    backgroundColor: "#F97316",
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 52,
  },
  submitButtonDisabled: {
    opacity: 0.5,
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
