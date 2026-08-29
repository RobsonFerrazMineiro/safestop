import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import type { MdhoCatalogCategory } from "@safestop/types";
import {
  MDHO_COMPLEMENT_MAX_LENGTH,
  MDHO_DEVIATION_TYPE_CATEGORY_CODE,
  MDHO_OTHER_OPTION_CODE,
} from "@safestop/types";
import { createSubmitMdhoSchema } from "@safestop/validation";
import { colors, radius, spacing, statusChip, typography } from "@safestop/ui";

import { Button } from "@/components/ui";
import { confirmAction } from "@/lib/confirm-action";

import type { MdhoAssessmentEnriched } from "../services/map-mdho";
import {
  buildFormStateFromAssessment,
  getSelectionDetail,
  isOptionSelected,
  setRadioSelection,
  setSelectionDetail,
  toggleCheckboxSelection,
  type MdhoFormState,
} from "../utils/mdho-form-state";
import { getMdhoCategoryLabel, MDHO_CATEGORY_STEP_COUNT } from "../utils/mdho-labels";
import { MdhoDraftBar } from "./mdho-draft-bar";

type MdhoStepperFormProps = {
  assessment: MdhoAssessmentEnriched;
  catalog: MdhoCatalogCategory[];
  isOnline: boolean;
  canSubmit: boolean;
  isSaving: boolean;
  isSubmitting: boolean;
  onSaveDraft: (form: MdhoFormState) => Promise<void>;
  onSubmit: (form: MdhoFormState) => Promise<void>;
};

export function MdhoStepperForm({
  assessment,
  catalog,
  isOnline,
  canSubmit,
  isSaving,
  isSubmitting,
  onSaveDraft,
  onSubmit,
}: MdhoStepperFormProps) {
  const [form, setForm] = useState<MdhoFormState>(() => buildFormStateFromAssessment(assessment));
  const [stepIndex, setStepIndex] = useState(0);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [draftMessage, setDraftMessage] = useState<string | null>(null);

  const isComplementStep = stepIndex >= catalog.length;
  const currentCategory = isComplementStep ? null : catalog[stepIndex];
  const stepLabel = isComplementStep
    ? "Complemento da avaliação"
    : currentCategory
      ? getMdhoCategoryLabel(currentCategory.code)
      : "";

  function validateForSubmit(): string | null {
    const schema = createSubmitMdhoSchema(catalog);

    const result = schema.safeParse({
      assessmentId: assessment.id,
      selections: form.selections,
      complement: form.complement.trim() ? form.complement : undefined,
    });

    if (!result.success) {
      return result.error.issues[0]?.message ?? "Preencha todos os campos obrigatórios.";
    }

    return null;
  }

  async function handleSaveDraft() {
    setDraftMessage(null);

    try {
      await onSaveDraft(form);
      setDraftMessage("Rascunho salvo");
    } catch (error) {
      setDraftMessage(
        error instanceof Error ? error.message : "Não foi possível salvar o rascunho.",
      );
    }
  }

  async function handleSubmitPress() {
    const error = validateForSubmit();

    if (error) {
      setValidationError(error);
      return;
    }

    const confirmed = await confirmAction({
      title: "Enviar Avaliação Técnica (MDHO)?",
      message: "Após o envio, a edição só será possível se a liderança devolver.",
      confirmLabel: "Enviar MDHO",
    });

    if (confirmed) {
      await onSubmit(form);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.stepHeader}>
        <Text accessibilityRole="header" style={styles.stepTitle}>
          {isComplementStep
            ? stepLabel
            : `Passo ${stepIndex + 1} de ${MDHO_CATEGORY_STEP_COUNT} · ${stepLabel}`}
        </Text>
        <View style={styles.dots}>
          {catalog.map((category, index) => (
            <View key={category.id} style={[styles.dot, index === stepIndex && styles.dotActive]} />
          ))}
          <View style={[styles.dot, isComplementStep && styles.dotActive]} />
        </View>
      </View>

      {validationError ? <Text style={styles.error}>{validationError}</Text> : null}

      {currentCategory ? (
        <View style={styles.options}>
          {currentCategory.options.map((option) => {
            const selected = isOptionSelected(form, currentCategory.id, option.id);
            const isRadio = currentCategory.code === MDHO_DEVIATION_TYPE_CATEGORY_CODE;

            return (
              <View key={option.id} style={styles.optionBlock}>
                <Pressable
                  accessibilityLabel={option.label}
                  accessibilityRole={isRadio ? "radio" : "checkbox"}
                  accessibilityState={{ checked: selected }}
                  style={({ pressed }) => [styles.optionRow, pressed && styles.pressed]}
                  onPress={() => {
                    setValidationError(null);
                    setForm((current) =>
                      isRadio
                        ? setRadioSelection(current, currentCategory.id, option.id)
                        : toggleCheckboxSelection(current, currentCategory.id, option.id),
                    );
                  }}
                >
                  <Text style={styles.optionIndicator}>{selected ? "●" : "○"}</Text>
                  <Text style={styles.optionLabel}>{option.label}</Text>
                </Pressable>

                {selected && option.code === MDHO_OTHER_OPTION_CODE && option.allowsDetail ? (
                  <TextInput
                    accessibilityLabel="Descreva a opção Outro"
                    multiline
                    placeholder="Descreva..."
                    placeholderTextColor={colors.foregroundMuted}
                    style={styles.detailInput}
                    value={getSelectionDetail(form, currentCategory.id, option.id)}
                    onChangeText={(value) => {
                      setForm((current) =>
                        setSelectionDetail(current, currentCategory.id, option.id, value),
                      );
                    }}
                  />
                ) : null}
              </View>
            );
          })}
        </View>
      ) : (
        <View style={styles.complementBlock}>
          <Text style={styles.complementHelper}>Opcional · máximo 4000 caracteres</Text>
          <TextInput
            accessibilityLabel="Complemento da avaliação"
            multiline
            placeholder="Complemento da avaliação..."
            placeholderTextColor={colors.foregroundMuted}
            style={styles.complementInput}
            value={form.complement}
            onChangeText={(value) => {
              setForm((current) => ({ ...current, complement: value }));
            }}
          />
          <Text style={styles.counter}>
            {form.complement.trim().length}/{MDHO_COMPLEMENT_MAX_LENGTH}
          </Text>
        </View>
      )}

      <View style={styles.navRow}>
        <Button
          accessibilityLabel="Voltar"
          disabled={stepIndex === 0}
          style={styles.navButton}
          variant="secondary"
          onPress={() => {
            setStepIndex((current) => Math.max(0, current - 1));
          }}
        >
          Voltar
        </Button>

        <Button
          accessibilityLabel="Próximo"
          disabled={stepIndex >= catalog.length}
          style={styles.navButton}
          variant="secondary"
          onPress={() => {
            setStepIndex((current) => Math.min(catalog.length, current + 1));
          }}
        >
          Próximo
        </Button>
      </View>

      <MdhoDraftBar
        canSubmit={canSubmit}
        draftMessage={draftMessage}
        isOnline={isOnline}
        isSaving={isSaving}
        isSubmitting={isSubmitting}
        onSaveDraft={() => {
          void handleSaveDraft();
        }}
        onSubmit={() => {
          void handleSubmitPress();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  complementBlock: {
    gap: spacing[2],
  },
  complementHelper: {
    color: colors.foregroundMuted,
    fontSize: typography.helper.fontSize,
  },
  complementInput: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: 1,
    color: colors.foreground,
    fontSize: typography.body.fontSize,
    maxHeight: 160,
    minHeight: 100,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  container: {
    gap: spacing[3],
  },
  counter: {
    color: colors.foregroundMuted,
    fontSize: typography.caption.fontSize,
    textAlign: "right",
  },
  detailInput: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.input,
    borderWidth: 1,
    color: colors.foreground,
    fontSize: typography.label.fontSize,
    marginLeft: 28,
    minHeight: 72,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[2],
  },
  dot: {
    backgroundColor: colors.border,
    borderRadius: 999,
    height: 8,
    width: 8,
  },
  dotActive: {
    backgroundColor: colors.info,
  },
  dots: {
    flexDirection: "row",
    gap: 6,
  },
  error: {
    color: colors.destructive,
    fontSize: typography.helper.fontSize,
  },
  navButton: {
    flex: 1,
  },
  navRow: {
    flexDirection: "row",
    gap: spacing[2],
  },
  optionBlock: {
    gap: spacing[2],
  },
  optionIndicator: {
    color: colors.info,
    fontSize: typography.label.fontSize,
    width: 18,
  },
  optionLabel: {
    color: colors.foreground,
    flex: 1,
    fontSize: typography.body.fontSize,
  },
  optionRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[2],
    minHeight: 44,
  },
  options: {
    gap: spacing[2],
  },
  pressed: {
    opacity: 0.85,
  },
  stepHeader: {
    gap: spacing[2],
  },
  stepTitle: {
    color: statusChip.info.foreground,
    fontSize: typography.label.fontSize,
    fontWeight: "700",
  },
});
