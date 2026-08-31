import { useMemo, useState } from "react";
import { Check, ChevronDown, SlidersHorizontal, X } from "lucide-react-native";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  OCCURRENCE_SEVERITIES,
  OCCURRENCE_STATUSES,
  isOccurrenceSeverity,
  type OccurrenceStatus,
} from "@safestop/types";
import { colors, controlHeight, radius, radiusScale, spacing, typography } from "@safestop/ui";

import { Button } from "@/components/ui";
import { useOccurrenceListFilterOptions } from "@/features/occurrences/hooks/use-occurrence-list-filter-options";
import {
  getOccurrenceSeverityLabel,
  getOccurrenceStatusLabel,
} from "@/features/occurrences/utils/occurrence-labels";

import {
  EMPTY_OPERATIONAL_FUNNEL,
  countActiveOperationalFunnelFilters,
  type OperationalListFunnelState,
} from "../utils/operational-list-filters";

const CHECKBOX_SIZE = 16;
const CHECK_ICON_SIZE = 14;
const CHEVRON_SIZE = 16;
const CLOSE_ICON_SIZE = 18;
const STATUS_ROW_MIN_HEIGHT = 36;

type PreventiveStopOperationalFiltersModalProps = {
  funnel: OperationalListFunnelState;
  onApply: (funnel: OperationalListFunnelState) => void;
};

type SelectOption = {
  value: string;
  label: string;
};

function FilterSelect({
  label,
  options,
  selectedValue,
  onSelect,
}: {
  label: string;
  options: SelectOption[];
  selectedValue: string | null;
  onSelect: (value: string | null) => void;
}) {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);

  const selectedLabel = useMemo(() => {
    const match = options.find((option) =>
      option.value === "all" ? selectedValue === null : option.value === selectedValue,
    );
    return match?.label ?? "Todas";
  }, [options, selectedValue]);

  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.selectLabel}>{label}</Text>
      <Pressable
        accessibilityLabel={`${label}: ${selectedLabel}`}
        accessibilityRole="button"
        style={({ pressed }) => [styles.selectTrigger, pressed && styles.rowPressed]}
        onPress={() => {
          setOpen(true);
        }}
      >
        <Text numberOfLines={1} style={styles.selectTriggerText}>
          {selectedLabel}
        </Text>
        <ChevronDown
          accessible={false}
          color={colors.foregroundMuted}
          size={CHEVRON_SIZE}
          strokeWidth={2}
        />
      </Pressable>

      <Modal animationType="fade" transparent visible={open} onRequestClose={() => setOpen(false)}>
        <View style={styles.selectOverlay}>
          <Pressable
            accessibilityLabel={`Fechar ${label}`}
            style={styles.selectBackdrop}
            onPress={() => {
              setOpen(false);
            }}
          />
          <View
            style={[styles.selectSheet, { paddingBottom: Math.max(insets.bottom, spacing[4]) }]}
          >
            <View style={styles.selectSheetHeader}>
              <Text style={styles.selectSheetTitle}>{label}</Text>
              <Pressable
                accessibilityLabel={`Fechar ${label}`}
                accessibilityRole="button"
                hitSlop={8}
                onPress={() => {
                  setOpen(false);
                }}
              >
                <X accessible={false} color={colors.foregroundMuted} size={CLOSE_ICON_SIZE} />
              </Pressable>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled">
              {options.map((option) => {
                const isSelected =
                  option.value === "all" ? selectedValue === null : selectedValue === option.value;

                return (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    key={option.value}
                    style={({ pressed }) => [
                      styles.selectOptionRow,
                      isSelected && styles.selectOptionRowSelected,
                      pressed && styles.rowPressed,
                    ]}
                    onPress={() => {
                      onSelect(option.value === "all" ? null : option.value);
                      setOpen(false);
                    }}
                  >
                    <Text
                      numberOfLines={2}
                      style={[
                        styles.selectOptionText,
                        isSelected && styles.selectOptionTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                    {isSelected ? (
                      <Check
                        accessible={false}
                        color={colors.primary}
                        size={16}
                        strokeWidth={2.5}
                      />
                    ) : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

export function PreventiveStopOperationalFiltersModal({
  funnel,
  onApply,
}: PreventiveStopOperationalFiltersModalProps) {
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);
  const [draft, setDraft] = useState<OperationalListFunnelState>(funnel);
  const { areas, contractors, isLoading, isError } = useOccurrenceListFilterOptions({
    enabled: visible,
  });

  const activeFilterCount = countActiveOperationalFunnelFilters(funnel);

  function openModal() {
    setDraft(funnel);
    setVisible(true);
  }

  function closeModal() {
    setVisible(false);
  }

  function toggleStatus(status: OccurrenceStatus) {
    setDraft((current) => ({
      ...current,
      status: current.status.includes(status)
        ? current.status.filter((entry) => entry !== status)
        : [...current.status, status],
    }));
  }

  const severityOptions: SelectOption[] = [
    { value: "all", label: "Todas" },
    ...OCCURRENCE_SEVERITIES.map((severity) => ({
      value: severity,
      label: getOccurrenceSeverityLabel(severity),
    })),
  ];

  const areaOptions: SelectOption[] = [
    { value: "all", label: "Todas" },
    ...areas.map((area) => ({
      value: area.id,
      label: area.name,
    })),
  ];

  const contractorOptions: SelectOption[] = [
    { value: "all", label: "Todas" },
    ...contractors.map((contractor) => ({
      value: contractor.id,
      label: contractor.name,
    })),
  ];

  return (
    <>
      <Pressable
        accessibilityLabel={
          activeFilterCount > 0 ? `Filtros, ${activeFilterCount} ativos` : "Filtros"
        }
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.filtersTrigger,
          activeFilterCount > 0 && styles.filtersButtonActive,
          pressed && styles.filtersTriggerPressed,
        ]}
        onPress={openModal}
      >
        <SlidersHorizontal
          accessible={false}
          color={activeFilterCount > 0 ? colors.primary : colors.foregroundMuted}
          size={16}
          strokeWidth={2}
        />
        <Text
          numberOfLines={1}
          style={[
            styles.filtersTriggerText,
            activeFilterCount > 0 && styles.filtersTriggerTextActive,
          ]}
        >
          {activeFilterCount > 0 ? `Filtros · ${activeFilterCount}` : "Filtros"}
        </Text>
      </Pressable>

      <Modal animationType="slide" transparent visible={visible} onRequestClose={closeModal}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.overlay}
        >
          <Pressable
            accessibilityLabel="Fechar filtros"
            style={styles.backdrop}
            onPress={closeModal}
          />

          <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing[3]) }]}>
            <View style={styles.sheetHeader}>
              <View style={styles.titleRow}>
                <Text style={styles.title}>Filtros</Text>
                <Pressable
                  accessibilityLabel="Fechar filtros"
                  accessibilityRole="button"
                  hitSlop={8}
                  onPress={closeModal}
                >
                  <X accessible={false} color={colors.foregroundMuted} size={CLOSE_ICON_SIZE} />
                </Pressable>
              </View>
              <Text style={styles.description}>
                Status, criticidade, área e empresa. Sem seleção de status: todas as Paralisações
                Preventivas visíveis.
              </Text>

              {isLoading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color={colors.primary} />
                  <Text style={styles.loadingText}>Carregando opções…</Text>
                </View>
              ) : null}

              {isError ? (
                <Text accessibilityRole="alert" style={styles.errorText}>
                  Não foi possível carregar as opções de filtro.
                </Text>
              ) : null}
            </View>

            <ScrollView
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              style={styles.scroll}
            >
              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>Status</Text>
                <Text style={styles.fieldHint}>Sem seleção: todos os status.</Text>
                <View style={styles.statusList}>
                  {OCCURRENCE_STATUSES.map((status) => {
                    const checked = draft.status.includes(status);

                    return (
                      <Pressable
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked }}
                        key={status}
                        style={({ pressed }) => [styles.statusRow, pressed && styles.rowPressed]}
                        onPress={() => {
                          toggleStatus(status);
                        }}
                      >
                        <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                          {checked ? (
                            <Check
                              accessible={false}
                              color={colors.foreground}
                              size={CHECK_ICON_SIZE}
                              strokeWidth={3}
                            />
                          ) : null}
                        </View>
                        <Text style={styles.statusText}>{getOccurrenceStatusLabel(status)}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <FilterSelect
                label="Criticidade"
                options={severityOptions}
                selectedValue={draft.severity}
                onSelect={(value) => {
                  setDraft((current) => ({
                    ...current,
                    severity: value !== null && isOccurrenceSeverity(value) ? value : null,
                  }));
                }}
              />

              <FilterSelect
                label="Área"
                options={areaOptions}
                selectedValue={draft.areaId}
                onSelect={(value) => {
                  setDraft((current) => ({
                    ...current,
                    areaId: value,
                  }));
                }}
              />

              <FilterSelect
                label="Contratada"
                options={contractorOptions}
                selectedValue={draft.contractorOrganizationId}
                onSelect={(value) => {
                  setDraft((current) => ({
                    ...current,
                    contractorOrganizationId: value,
                  }));
                }}
              />
            </ScrollView>

            <View style={styles.footer}>
              <Button
                accessibilityLabel="Aplicar filtros"
                onPress={() => {
                  onApply(draft);
                  closeModal();
                }}
              >
                Aplicar
              </Button>
              <Button
                accessibilityLabel="Limpar filtros"
                variant="secondary"
                onPress={() => {
                  onApply(EMPTY_OPERATIONAL_FUNNEL);
                  setDraft(EMPTY_OPERATIONAL_FUNNEL);
                  closeModal();
                }}
              >
                Limpar filtros
              </Button>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
  },
  checkbox: {
    alignItems: "center",
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    borderRadius: radiusScale.xs,
    borderWidth: 1,
    flexShrink: 0,
    height: CHECKBOX_SIZE,
    justifyContent: "center",
    width: CHECKBOX_SIZE,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  description: {
    color: colors.foregroundMuted,
    fontSize: typography.helper.fontSize,
    lineHeight: 18,
  },
  errorText: {
    color: colors.destructive,
    fontSize: typography.helper.fontSize,
  },
  fieldBlock: {
    gap: spacing[2],
  },
  fieldHint: {
    color: colors.foregroundMuted,
    fontSize: typography.caption.fontSize,
    lineHeight: 14,
    marginTop: -spacing[1],
  },
  fieldLabel: {
    color: colors.foreground,
    fontSize: typography.helper.fontSize,
    fontWeight: "600",
  },
  filtersButtonActive: {
    borderColor: colors.primary,
  },
  filtersTrigger: {
    alignItems: "center",
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    borderRadius: radius.button,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing[1],
    justifyContent: "center",
    minHeight: controlHeight.mobile,
    minWidth: 96,
    paddingHorizontal: spacing[3],
  },
  filtersTriggerPressed: {
    opacity: 0.85,
  },
  filtersTriggerText: {
    color: colors.foreground,
    fontSize: typography.helper.fontSize,
    fontWeight: "600",
  },
  filtersTriggerTextActive: {
    color: colors.primary,
  },
  footer: {
    flexGrow: 0,
    flexShrink: 0,
    gap: spacing[2],
    paddingTop: spacing[3],
  },
  loadingRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[2],
  },
  loadingText: {
    color: colors.foregroundMuted,
    fontSize: typography.helper.fontSize,
  },
  overlay: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    flex: 1,
    justifyContent: "flex-end",
  },
  rowPressed: {
    opacity: 0.85,
  },
  scroll: {
    flexGrow: 0,
    flexShrink: 1,
  },
  scrollContent: {
    gap: spacing[4],
    paddingBottom: spacing[3],
    paddingTop: spacing[3],
  },
  selectBackdrop: {
    flex: 1,
  },
  selectLabel: {
    color: colors.foregroundMuted,
    fontSize: typography.helper.fontSize,
  },
  selectOptionRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[2],
    minHeight: controlHeight.mobile,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
  },
  selectOptionRowSelected: {
    backgroundColor: colors.surfaceMuted,
  },
  selectOptionText: {
    color: colors.foreground,
    flex: 1,
    fontSize: typography.label.fontSize,
  },
  selectOptionTextSelected: {
    color: colors.primary,
    fontWeight: "600",
  },
  selectOverlay: {
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    flex: 1,
    justifyContent: "flex-end",
  },
  selectSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.dialog,
    borderTopRightRadius: radius.dialog,
    maxHeight: "70%",
    paddingTop: spacing[3],
  },
  selectSheetHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: spacing[2],
    paddingHorizontal: spacing[4],
  },
  selectSheetTitle: {
    color: colors.foreground,
    fontSize: typography.cardTitle.fontSize,
    fontWeight: typography.cardTitle.fontWeight,
  },
  selectTrigger: {
    alignItems: "center",
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    borderRadius: radius.input,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing[2],
    justifyContent: "space-between",
    minHeight: controlHeight.mobile,
    paddingHorizontal: spacing[3],
  },
  selectTriggerText: {
    color: colors.foreground,
    flex: 1,
    fontSize: typography.label.fontSize,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.dialog,
    borderTopRightRadius: radius.dialog,
    maxHeight: "92%",
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
  },
  sheetHeader: {
    flexGrow: 0,
    flexShrink: 0,
    gap: spacing[2],
  },
  statusList: {
    gap: spacing[2],
  },
  statusRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[2],
    minHeight: STATUS_ROW_MIN_HEIGHT,
  },
  statusText: {
    color: colors.foreground,
    flex: 1,
    fontSize: typography.helper.fontSize,
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
