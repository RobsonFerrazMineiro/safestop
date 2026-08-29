import { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import type { MdhoCatalogCategory } from "@safestop/types";
import { MDHO_RETURN_REASON_MAX_LENGTH, MDHO_RETURN_REASON_MIN_LENGTH } from "@safestop/types";
import { colors, spacing, statusChip, typography } from "@safestop/ui";

import { Button, TextField } from "@/components/ui";
import { formatOccurrenceDate } from "@/features/occurrences/utils/occurrence-labels";

import type { MdhoAssessmentEnriched } from "../services/map-mdho";
import { MdhoReadOnlyView } from "./mdho-read-only-view";

type MdhoReviewPanelProps = {
  assessment: MdhoAssessmentEnriched;
  catalog: MdhoCatalogCategory[];
  canApprove: boolean;
  canReturn: boolean;
  isOnline: boolean;
  isApproving: boolean;
  isReturning: boolean;
  onApprove: () => Promise<void>;
  onReturn: (returnReason: string) => Promise<void>;
};

export function MdhoReviewPanel({
  assessment,
  catalog,
  canApprove,
  canReturn,
  isOnline,
  isApproving,
  isReturning,
  onApprove,
  onReturn,
}: MdhoReviewPanelProps) {
  const [returnReason, setReturnReason] = useState("");
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [returnError, setReturnError] = useState<string | null>(null);

  const trimmedReason = returnReason.trim();
  const canSubmitReturn =
    isOnline &&
    !isReturning &&
    trimmedReason.length >= MDHO_RETURN_REASON_MIN_LENGTH &&
    trimmedReason.length <= MDHO_RETURN_REASON_MAX_LENGTH;

  function confirmApprove() {
    Alert.alert("Aprovar Avaliação Técnica (MDHO)?", "A avaliação ficará imutável.", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Aprovar MDHO",
        onPress: () => {
          void onApprove();
        },
      },
    ]);
  }

  function confirmReturn() {
    if (!canSubmitReturn) {
      setReturnError("Informe um motivo com pelo menos 10 caracteres.");
      return;
    }

    Alert.alert("Devolver Avaliação Técnica (MDHO)?", undefined, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Devolver MDHO",
        style: "destructive",
        onPress: () => {
          void onReturn(trimmedReason);
        },
      },
    ]);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.status}>Aguardando aprovação HSE</Text>

      <MdhoReadOnlyView assessment={assessment} catalog={catalog} />

      <View style={styles.metaRow}>
        <View style={styles.metaField}>
          <Text style={styles.metaLabel}>Enviado por</Text>
          <Text style={styles.metaValue}>{assessment.submittedByName ?? "—"}</Text>
        </View>
        <View style={styles.metaField}>
          <Text style={styles.metaLabel}>Em</Text>
          <Text style={styles.metaValue}>
            {assessment.submittedAt ? formatOccurrenceDate(assessment.submittedAt) : "—"}
          </Text>
        </View>
      </View>

      {!isOnline ? (
        <Text style={styles.offline}>Conecte-se para continuar a Avaliação Técnica (MDHO).</Text>
      ) : null}

      {canReturn || canApprove ? (
        <View style={styles.actions}>
          {canReturn ? (
            <>
              {showReturnForm ? (
                <View style={styles.returnForm}>
                  <TextField
                    accessibilityLabel="Motivo da devolução do MDHO"
                    disabled={isReturning || !isOnline}
                    error={returnError ?? undefined}
                    inputStyle={styles.returnInput}
                    label="Motivo da devolução"
                    multiline
                    placeholder="Descreva o motivo..."
                    value={returnReason}
                    onChangeText={(value) => {
                      setReturnReason(value);
                      setReturnError(null);
                    }}
                  />
                  <Button
                    accessibilityLabel="Confirmar devolução do MDHO"
                    disabled={!canSubmitReturn}
                    loading={isReturning}
                    variant="destructive"
                    onPress={confirmReturn}
                  >
                    Devolver MDHO
                  </Button>
                </View>
              ) : (
                <Button
                  accessibilityLabel="Devolver MDHO"
                  disabled={!isOnline || isApproving || isReturning}
                  variant="destructive"
                  onPress={() => {
                    setShowReturnForm(true);
                  }}
                >
                  Devolver MDHO
                </Button>
              )}
            </>
          ) : null}

          {canApprove ? (
            <Button
              accessibilityLabel={isApproving ? "Aprovando MDHO" : "Aprovar MDHO"}
              disabled={!isOnline || isApproving || isReturning}
              loading={isApproving}
              style={styles.approveButton}
              variant="secondary"
              onPress={confirmApprove}
            >
              Aprovar MDHO
            </Button>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: spacing[3],
  },
  approveButton: {
    backgroundColor: colors.info,
    borderColor: colors.info,
  },
  container: {
    gap: spacing[3],
  },
  metaField: {
    flex: 1,
    gap: spacing[1],
  },
  metaLabel: {
    color: colors.foregroundMuted,
    fontSize: typography.caption.fontSize,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  metaRow: {
    flexDirection: "row",
    gap: spacing[4],
  },
  metaValue: {
    color: colors.foreground,
    fontSize: typography.body.fontSize,
  },
  offline: {
    color: statusChip.info.foreground,
    fontSize: typography.helper.fontSize,
  },
  returnForm: {
    gap: spacing[2],
  },
  returnInput: {
    maxHeight: 120,
    minHeight: 80,
  },
  status: {
    color: statusChip.info.foreground,
    fontSize: typography.label.fontSize,
    fontWeight: "600",
  },
});
