import { useState } from "react";
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
import { colors, radius, radiusScale, spacing, typography } from "@safestop/ui";

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

type PreventiveStopOperationalFiltersModalProps = {
  funnel: OperationalListFunnelState;
  onApply: (funnel: OperationalListFunnelState) => void;
};

type SelectOption = {
  value: string;
  label: string;
};

function SelectField({
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
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.optionList}>
        {options.map((option) => {
          const isSelected =
            option.value === "all" ? selectedValue === null : selectedValue === option.value;

          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              key={option.value}
              style={({ pressed }) => [
                styles.optionRow,
                isSelected && styles.optionRowSelected,
                pressed && styles.optionRowPressed,
              ]}
              onPress={() => {
                onSelect(option.value === "all" ? null : option.value);
              }}
            >
              <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
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
      <Button
        accessibilityLabel={
          activeFilterCount > 0 ? `Filtros, ${activeFilterCount} ativos` : "Filtros"
        }
        style={activeFilterCount > 0 ? styles.filtersButtonActive : undefined}
        variant="secondary"
        onPress={openModal}
      >
        {activeFilterCount > 0 ? `Filtros · ${activeFilterCount}` : "Filtros"}
      </Button>

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

          <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing[4]) }]}>
            <Text style={styles.title}>Filtros</Text>
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

            <ScrollView
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>Status</Text>
                <Text style={styles.fieldHint}>Sem seleção: todos os status.</Text>
                <View style={styles.statusGrid}>
                  {OCCURRENCE_STATUSES.map((status) => {
                    const checked = draft.status.includes(status);

                    return (
                      <Pressable
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked }}
                        key={status}
                        style={({ pressed }) => [
                          styles.statusRow,
                          checked && styles.statusRowChecked,
                          pressed && styles.optionRowPressed,
                        ]}
                        onPress={() => {
                          toggleStatus(status);
                        }}
                      >
                        <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                          {checked ? <Text style={styles.checkboxMark}>✓</Text> : null}
                        </View>
                        <Text style={styles.statusText}>{getOccurrenceStatusLabel(status)}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <SelectField
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

              <SelectField
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

              <SelectField
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
              <Button
                accessibilityLabel="Aplicar filtros"
                onPress={() => {
                  onApply(draft);
                  closeModal();
                }}
              >
                Aplicar
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
    borderColor: colors.border,
    borderRadius: radiusScale.sm,
    borderWidth: 1,
    height: 20,
    justifyContent: "center",
    width: 20,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkboxMark: {
    color: colors.background,
    fontSize: 12,
    fontWeight: "700",
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
  },
  fieldLabel: {
    color: colors.foreground,
    fontSize: typography.label.fontSize,
    fontWeight: "600",
  },
  filtersButtonActive: {
    borderColor: colors.primary,
  },
  footer: {
    gap: spacing[2],
    marginTop: spacing[3],
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
  optionList: {
    gap: spacing[1],
  },
  optionRow: {
    borderColor: colors.border,
    borderRadius: radius.input,
    borderWidth: 1,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  optionRowPressed: {
    opacity: 0.85,
  },
  optionRowSelected: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.primary,
  },
  optionText: {
    color: colors.foreground,
    fontSize: typography.label.fontSize,
  },
  optionTextSelected: {
    color: colors.primary,
    fontWeight: "600",
  },
  overlay: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    flex: 1,
    justifyContent: "flex-end",
  },
  scrollContent: {
    gap: spacing[4],
    paddingVertical: spacing[3],
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.dialog,
    borderTopRightRadius: radius.dialog,
    maxHeight: "88%",
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
  },
  statusGrid: {
    gap: spacing[2],
  },
  statusRow: {
    alignItems: "center",
    borderColor: colors.border,
    borderRadius: radius.input,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing[2],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  statusRowChecked: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.primary,
  },
  statusText: {
    color: colors.foreground,
    flex: 1,
    fontSize: typography.label.fontSize,
  },
  title: {
    color: colors.foreground,
    fontSize: typography.cardTitle.fontSize,
    fontWeight: typography.cardTitle.fontWeight,
  },
});
