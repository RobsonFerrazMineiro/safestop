import type { CreatePreventiveStopInput } from "@safestop/validation";
import { createPreventiveStopSchema } from "@safestop/validation";
import { usePathname, useRouter } from "expo-router";
import { MapPin, PlusCircle } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radius, spacing, statusChip, typography } from "@safestop/ui";

import { Button, ScreenBackLink, TextField } from "@/components/ui";
import { useAuthorization } from "@/features/authorization/hooks/use-authorization";
import { useRequirePermission } from "@/features/authorization/hooks/use-require-permission";
import { useActiveOrganization } from "@/features/organization/hooks/use-active-organization";
import { OccurrenceError } from "@/features/occurrences/components/occurrence-error";
import { OccurrenceLoading } from "@/features/occurrences/components/occurrence-loading";
import { usePreventiveStopDraftNavigation } from "@/features/navigation/context/preventive-stop-draft-navigation-context";
import { confirmPreventiveStopDraftLeave } from "@/features/navigation/utils/confirm-preventive-stop-draft-leave";
import { useOccurrenceAreas } from "@/features/occurrences/hooks/use-occurrence-areas";
import { useOccurrenceContracts } from "@/features/occurrences/hooks/use-occurrence-contracts";
import { useOccurrenceContractors } from "@/features/occurrences/hooks/use-occurrence-contractors";
import { formatContractOptionLabel } from "@/features/occurrences/services/get-contracts";
import { stopWorkDetailRoute, stopWorkRoute } from "@/lib/auth/routes";

import { FormSelectField } from "./form-select-field";
import { PreventiveStopCallout } from "./preventive-stop-callout";
import { PreventiveStopSuccessView } from "./preventive-stop-success-view";
import { SeveritySelector } from "./severity-selector";
import { useCreatePreventiveStop } from "../hooks/use-create-preventive-stop";
import { usePreventiveStopDraft } from "../hooks/use-preventive-stop-draft";
import { usePreventiveStopGeo } from "../hooks/use-preventive-stop-geo";
import { hasPreventiveStopDraftContent } from "../stores/preventive-stop-draft-store";

const HEADER_ICON_SIZE = 22;
const GEO_ICON_SIZE = 14;

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
  const pathname = usePathname();
  const isCreateScreenFocused = pathname.endsWith("/stop-work/new");
  const insets = useSafeAreaInsets();
  const { isReady: isAuthReady } = useAuthorization();
  const { isReady: isOrgReady } = useActiveOrganization();
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
    flushDraft,
    clearDraft,
    isHydrated,
    hasLocalDraft,
    isSaving,
    isReady: isDraftReady,
  } = usePreventiveStopDraft();
  const geo = usePreventiveStopGeo();
  const isOffline = useIsOffline();
  const { registerDraftLeaveGuard } = usePreventiveStopDraftNavigation();

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

  const leaveToStopWorkList = useCallback(() => {
    router.replace(stopWorkRoute);
  }, [router]);

  const persistDraftBeforeLeave = useCallback(async () => {
    await flushDraft(getValues());
  }, [flushDraft, getValues]);

  const confirmLeaveIfNeeded = useCallback(
    (onConfirm: () => void) => {
      if (!hasPreventiveStopDraftContent(getValues())) {
        onConfirm();
        return;
      }

      confirmPreventiveStopDraftLeave(async () => {
        await persistDraftBeforeLeave();
        onConfirm();
      });
    },
    [getValues, persistDraftBeforeLeave],
  );

  useEffect(() => {
    if (!isCreateScreenFocused) {
      registerDraftLeaveGuard(null);
      return;
    }

    registerDraftLeaveGuard({
      shouldConfirmLeave: () => hasPreventiveStopDraftContent(getValues()),
      persistBeforeLeave: persistDraftBeforeLeave,
    });

    return () => {
      registerDraftLeaveGuard(null);
    };
  }, [getValues, isCreateScreenFocused, persistDraftBeforeLeave, registerDraftLeaveGuard]);

  useEffect(() => {
    if (!isCreateScreenFocused) {
      return;
    }

    const onBackPress = () => {
      if (!hasPreventiveStopDraftContent(getValues())) {
        return false;
      }

      confirmLeaveIfNeeded(leaveToStopWorkList);
      return true;
    };

    const subscription = BackHandler.addEventListener("hardwareBackPress", onBackPress);

    return () => {
      subscription.remove();
    };
  }, [confirmLeaveIfNeeded, getValues, isCreateScreenFocused, leaveToStopWorkList]);

  if (!isAuthReady || !isOrgReady) {
    return (
      <SafeAreaView style={styles.container}>
        <OccurrenceLoading />
      </SafeAreaView>
    );
  }

  if (!canCreate) {
    return (
      <SafeAreaView style={styles.container}>
        <OccurrenceError message="Você não possui permissão para registrar paralisações nesta organização." />
      </SafeAreaView>
    );
  }

  if (successResult) {
    return (
      <PreventiveStopSuccessView
        occurrenceId={successResult.id}
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
  const setupBlockedMessage = !hasAreas
    ? "Cadastre ao menos uma área ativa na organização para registrar paralisações."
    : !hasContractors
      ? "Cadastre ao menos uma contratada com contrato ativo na organização para registrar paralisações."
      : null;
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
    } catch (error) {
      const message =
        error instanceof Error && error.message.trim().length > 0
          ? error.message
          : "Não foi possível registrar. Seus dados foram preservados.";
      setFormError(message);
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
          contentContainerStyle={[
            styles.content,
            { paddingBottom: spacing[16] + Math.max(insets.bottom, spacing[4]) },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <ScreenBackLink
              accessibilityLabel="Voltar para listagem"
              onPress={() => {
                confirmLeaveIfNeeded(leaveToStopWorkList);
              }}
            />

            <View style={styles.titleRow}>
              <PlusCircle
                accessible={false}
                color={colors.primary}
                size={HEADER_ICON_SIZE}
                strokeWidth={2}
              />
              <Text style={styles.title}>Nova Paralisação Preventiva</Text>
            </View>
            <Text style={styles.subtitle}>Identifique a condição insegura</Text>
          </View>

          {hasLocalDraft ? (
            <View accessibilityRole="text" style={styles.draftBanner}>
              <Text style={styles.draftBannerText}>Rascunho salvo neste dispositivo</Text>
            </View>
          ) : null}

          <PreventiveStopCallout />

          {isSaving ? <Text style={styles.savingHint}>Salvando rascunho…</Text> : null}
          {isOffline ? <Text style={styles.offlineBanner}>Você está offline.</Text> : null}

          <View style={styles.form}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Onde e quem</Text>

              <Controller
                control={control}
                name="areaId"
                render={({ field: { onChange, value } }) => (
                  <FormSelectField
                    disabled={isCreating}
                    emptyMessage={
                      hasAreas ? undefined : "Nenhuma área cadastrada para esta organização."
                    }
                    items={areas.map((area) => ({
                      id: area.id,
                      label: area.name,
                      hint: area.code ?? undefined,
                    }))}
                    label="Área *"
                    placeholder="Selecione a área"
                    selectedId={value}
                    onSelect={(id) => {
                      onChange(id);
                      updateDraft({ areaId: id });
                    }}
                  />
                )}
              />

              <Controller
                control={control}
                name="locationDescription"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextField
                    accessibilityLabel="Local"
                    disabled={isCreating}
                    label="Local *"
                    placeholder="Ex: Galpão 3"
                    value={value}
                    onBlur={() => {
                      onBlur();
                      persistCurrentDraft();
                    }}
                    onChangeText={onChange}
                  />
                )}
              />

              <Controller
                control={control}
                name="contractorOrganizationId"
                render={({ field: { onChange, value } }) => (
                  <FormSelectField
                    disabled={isCreating}
                    emptyMessage={
                      hasContractors
                        ? undefined
                        : "Nenhuma contratada com contrato ativo nesta organização."
                    }
                    items={contractors.map((contractor) => ({
                      id: contractor.id,
                      label: contractor.name,
                    }))}
                    label="Contratada *"
                    placeholder="Selecione a empresa"
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
                <Controller
                  control={control}
                  name="contractId"
                  render={({ field: { onChange, value } }) => (
                    <FormSelectField
                      disabled={isCreating}
                      items={contracts.map((contract) => ({
                        id: contract.id,
                        label: formatContractOptionLabel(contract),
                      }))}
                      label="Contrato (opcional)"
                      noneOptionLabel="Nenhum contrato específico"
                      placeholder="Selecione o contrato"
                      selectedId={value ?? ""}
                      onSelect={(id) => {
                        onChange(id);
                        updateDraft({ contractId: id || undefined });
                      }}
                    />
                  )}
                />
              ) : null}

              {isContractsError ? (
                <Text style={styles.error}>Não foi possível carregar os contratos.</Text>
              ) : null}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>O que está acontecendo</Text>

              <Controller
                control={control}
                name="taskDescription"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextField
                    accessibilityLabel="Atividade"
                    disabled={isCreating}
                    label="Atividade *"
                    placeholder="Atividade sendo realizada"
                    value={value}
                    onBlur={() => {
                      onBlur();
                      persistCurrentDraft();
                    }}
                    onChangeText={onChange}
                  />
                )}
              />

              <Controller
                control={control}
                name="conditionDescription"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextField
                    accessibilityLabel="Condição insegura"
                    disabled={isCreating}
                    inputStyle={styles.multilineLarge}
                    label="Condição insegura *"
                    multiline
                    placeholder="Descreva a condição identificada"
                    value={value}
                    onBlur={() => {
                      onBlur();
                      persistCurrentDraft();
                    }}
                    onChangeText={onChange}
                  />
                )}
              />

              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>Criticidade *</Text>
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
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Complemento</Text>

              <Controller
                control={control}
                name="immediateActionDescription"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextField
                    accessibilityLabel="Medida imediata"
                    disabled={isCreating}
                    inputStyle={styles.multilineSmall}
                    label="Medida imediata (opcional)"
                    multiline
                    placeholder="Medida tomada no local, se houver"
                    value={value ?? ""}
                    onBlur={() => {
                      onBlur();
                      persistCurrentDraft();
                    }}
                    onChangeText={onChange}
                  />
                )}
              />

              <View style={styles.geoRow}>
                <MapPin
                  accessible={false}
                  color={colors.foregroundMuted}
                  size={GEO_ICON_SIZE}
                  strokeWidth={2}
                />
                <Text style={styles.geoHint}>{geoLabel}</Text>
              </View>
            </View>

            {setupBlockedMessage ? <Text style={styles.error}>{setupBlockedMessage}</Text> : null}
            {formError ? <Text style={styles.error}>{formError}</Text> : null}

            <Button
              accessibilityLabel="Paralisar atividade"
              disabled={!canSubmit}
              loading={isCreating}
              onPress={() => {
                void handleSubmit(onSubmit)();
              }}
            >
              {isCreating ? "Registrando..." : "Paralisar atividade"}
            </Button>
          </View>
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
  content: {
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingTop: spacing[2],
  },
  draftBanner: {
    alignSelf: "stretch",
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: 1,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  draftBannerText: {
    color: colors.foreground,
    fontSize: typography.helper.fontSize,
    fontWeight: "600",
  },
  error: {
    color: colors.destructive,
    fontSize: typography.helper.fontSize,
    textAlign: "center",
  },
  fieldBlock: {
    gap: spacing[1],
  },
  fieldLabel: {
    color: colors.foreground,
    fontSize: typography.helper.fontSize,
    fontWeight: "600",
  },
  form: {
    gap: spacing[3],
  },
  header: {
    gap: spacing[2],
  },
  geoHint: {
    color: colors.foregroundMuted,
    flex: 1,
    fontSize: typography.caption.fontSize,
  },
  geoRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[1],
  },
  hint: {
    color: colors.foregroundMuted,
    fontSize: typography.helper.fontSize,
  },
  keyboardView: {
    flex: 1,
  },
  multilineLarge: {
    minHeight: 88,
    textAlignVertical: "top",
  },
  multilineSmall: {
    minHeight: 64,
    textAlignVertical: "top",
  },
  offlineBanner: {
    backgroundColor: statusChip.destructive.background,
    borderColor: statusChip.destructive.border,
    borderRadius: radius.card,
    borderWidth: 1,
    color: statusChip.destructive.foreground,
    fontSize: typography.helper.fontSize,
    fontWeight: "600",
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    textAlign: "center",
  },
  savingHint: {
    color: colors.foregroundMuted,
    fontSize: typography.caption.fontSize,
  },
  section: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: 1,
    gap: spacing[3],
    padding: spacing[3],
  },
  sectionTitle: {
    color: colors.foreground,
    fontSize: typography.label.fontSize,
    fontWeight: "700",
  },
  subtitle: {
    color: colors.foregroundMuted,
    fontSize: typography.helper.fontSize,
    lineHeight: 16,
    marginTop: -spacing[1],
  },
  title: {
    color: colors.foreground,
    flex: 1,
    fontSize: typography.cardTitle.fontSize,
    fontWeight: typography.cardTitle.fontWeight,
  },
  titleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[2],
  },
});
