import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import type { MdhoCatalogCategory } from "@safestop/types";
import {
  MDHO_COMPLEMENT_MAX_LENGTH,
  MDHO_DEVIATION_TYPE_CATEGORY_CODE,
  MDHO_OTHER_OPTION_CODE,
} from "@safestop/types";
import { createSubmitMdhoSchema } from "@safestop/validation";

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
                    placeholderTextColor="#6B7280"
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
            placeholderTextColor="#6B7280"
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
        <Pressable
          accessibilityLabel="Voltar"
          accessibilityRole="button"
          disabled={stepIndex === 0}
          style={({ pressed }) => [
            styles.navButton,
            stepIndex === 0 && styles.navButtonDisabled,
            pressed && stepIndex > 0 && styles.pressed,
          ]}
          onPress={() => {
            setStepIndex((current) => Math.max(0, current - 1));
          }}
        >
          <Text style={styles.navText}>Voltar</Text>
        </Pressable>

        <Pressable
          accessibilityLabel="Próximo"
          accessibilityRole="button"
          disabled={stepIndex >= catalog.length}
          style={({ pressed }) => [
            styles.navButton,
            stepIndex >= catalog.length && styles.navButtonDisabled,
            pressed && stepIndex < catalog.length && styles.pressed,
          ]}
          onPress={() => {
            setStepIndex((current) => Math.min(catalog.length, current + 1));
          }}
        >
          <Text style={styles.navText}>Próximo</Text>
        </Pressable>
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
    gap: 8,
  },
  complementHelper: {
    color: "#9CA3AF",
    fontSize: 13,
  },
  complementInput: {
    backgroundColor: "#1F2937",
    borderColor: "#374151",
    borderRadius: 12,
    borderWidth: 1,
    color: "#F9FAFB",
    fontSize: 15,
    maxHeight: 160,
    minHeight: 100,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  container: {
    gap: 12,
  },
  counter: {
    color: "#9CA3AF",
    fontSize: 12,
    textAlign: "right",
  },
  detailInput: {
    backgroundColor: "#1F2937",
    borderColor: "#374151",
    borderRadius: 8,
    borderWidth: 1,
    color: "#F9FAFB",
    fontSize: 14,
    marginLeft: 28,
    minHeight: 72,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  dot: {
    backgroundColor: "#374151",
    borderRadius: 999,
    height: 8,
    width: 8,
  },
  dotActive: {
    backgroundColor: "#2563EB",
  },
  dots: {
    flexDirection: "row",
    gap: 6,
  },
  error: {
    color: "#F87171",
    fontSize: 13,
  },
  navButton: {
    alignItems: "center",
    borderColor: "#374151",
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: 44,
  },
  navButtonDisabled: {
    opacity: 0.4,
  },
  navRow: {
    flexDirection: "row",
    gap: 10,
  },
  navText: {
    color: "#D1D5DB",
    fontSize: 14,
    fontWeight: "600",
  },
  optionBlock: {
    gap: 8,
  },
  optionIndicator: {
    color: "#2563EB",
    fontSize: 14,
    width: 18,
  },
  optionLabel: {
    color: "#F9FAFB",
    flex: 1,
    fontSize: 15,
  },
  optionRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    minHeight: 44,
  },
  options: {
    gap: 8,
  },
  pressed: {
    opacity: 0.85,
  },
  stepHeader: {
    gap: 8,
  },
  stepTitle: {
    color: "#DBEAFE",
    fontSize: 14,
    fontWeight: "700",
  },
});
