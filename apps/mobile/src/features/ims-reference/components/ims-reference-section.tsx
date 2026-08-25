import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { OccurrenceDetails } from "@safestop/types";
import { registerImsReferenceSchema } from "@safestop/validation";

import { CollapsibleSection } from "@/components/collapsible-section";
import { useAuthorization } from "@/features/authorization/hooks/use-authorization";
import { EvaluationConflictCard } from "@/features/ver-e-agir/components/evaluation-conflict-card";
import { confirmAction } from "@/lib/confirm-action";

import { ImsEditDialog } from "./ims-edit-dialog";
import { ImsReferenceCard } from "./ims-reference-card";
import { ImsRegisterForm } from "./ims-register-form";
import { useRegisterImsReference, useUpdateImsReference } from "../hooks";
import type { ImsRegisterFooterState } from "../types";
import { ImsReferenceMutationError } from "../utils/ims-reference-errors";
import { IMS_REFERENCE_COPY } from "../utils/ims-reference-copy";
import {
  canRegisterImsReference,
  canUpdateImsReference,
  shouldShowImsReferenceSection,
} from "../utils/ims-reference-permissions";

type ImsReferenceSectionProps = {
  occurrence: OccurrenceDetails;
  isOnline: boolean;
  isRefreshing?: boolean;
  onRefresh: () => Promise<unknown>;
  onRegisterFooterChange?: (state: ImsRegisterFooterState | null) => void;
};

export function ImsReferenceSection({
  occurrence,
  isOnline,
  isRefreshing = false,
  onRefresh,
  onRegisterFooterChange,
}: ImsReferenceSectionProps) {
  const { can, isPlatformAdmin } = useAuthorization();
  const canRegisterPermission = can("ims_reference.register");
  const canUpdatePermission = can("ims_reference.update");
  const canRead = can("occurrence.read");

  const { registerImsReference, isRegistering } = useRegisterImsReference(occurrence.id);
  const { updateImsReference, isUpdating } = useUpdateImsReference(occurrence.id);

  const [code, setCode] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showConflict, setShowConflict] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const shouldRender = canRead && shouldShowImsReferenceSection(occurrence);

  const showRegister = canRegisterImsReference({
    canRegister: canRegisterPermission,
    isPlatformAdmin,
    occurrence,
  });

  const showCard = !!occurrence.imsReferenceCode?.trim();

  const canUpdate = canUpdateImsReference({
    canUpdate: canUpdatePermission,
    isPlatformAdmin,
    occurrence,
  });

  async function handleRefresh() {
    setShowConflict(false);
    await onRefresh();
  }

  async function handleMutationError(error: unknown, fallbackMessage: string) {
    if (error instanceof ImsReferenceMutationError && error.code === "ALREADY_REGISTERED") {
      await handleRefresh();
      return;
    }

    if (error instanceof ImsReferenceMutationError && error.isConflict()) {
      setShowConflict(true);
      return;
    }

    setValidationError(error instanceof Error ? error.message : fallbackMessage);
  }

  async function submitRegister() {
    const parsed = registerImsReferenceSchema.safeParse({
      occurrenceId: occurrence.id,
      imsReferenceCode: code,
    });

    if (!parsed.success) {
      setValidationError(parsed.error.issues[0]?.message ?? IMS_REFERENCE_COPY.formatError);
      return;
    }

    try {
      await registerImsReference(parsed.data);
      setCode("");
      setValidationError(null);
      setShowConflict(false);
      setSuccessMessage(IMS_REFERENCE_COPY.successRegister);
    } catch (error) {
      await handleMutationError(error, "Não foi possível registrar a referência IMS.");
    }
  }

  async function handleRegisterPress() {
    const parsed = registerImsReferenceSchema.safeParse({
      occurrenceId: occurrence.id,
      imsReferenceCode: code,
    });

    if (!parsed.success) {
      setValidationError(parsed.error.issues[0]?.message ?? IMS_REFERENCE_COPY.formatError);
      return;
    }

    if (!isOnline) {
      setValidationError(IMS_REFERENCE_COPY.offlineToast);
      return;
    }

    const confirmed = await confirmAction({
      title: IMS_REFERENCE_COPY.confirmTitle,
      message: `${IMS_REFERENCE_COPY.confirmBody}\n\nCódigo: ${parsed.data.imsReferenceCode}`,
      confirmLabel: IMS_REFERENCE_COPY.confirmAction,
    });

    if (confirmed) {
      await submitRegister();
    }
  }

  async function handleUpdate(newCode: string, updateReason: string) {
    if (!isOnline) {
      setValidationError(IMS_REFERENCE_COPY.offlineToast);
      return;
    }

    try {
      await updateImsReference({
        occurrenceId: occurrence.id,
        imsReferenceCode: newCode,
        updateReason,
      });
      setEditVisible(false);
      setShowConflict(false);
    } catch (error) {
      await handleMutationError(error, "Não foi possível corrigir a referência IMS.");
    }
  }

  useEffect(() => {
    if (!onRegisterFooterChange || !shouldRender) {
      onRegisterFooterChange?.(null);
      return;
    }

    if (!showConflict && showRegister) {
      onRegisterFooterChange({
        visible: true,
        isOnline,
        isRegistering,
        onRegister: handleRegisterPress,
      });
      return;
    }

    onRegisterFooterChange(null);
  });

  if (!shouldRender) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text accessibilityRole="header" style={styles.sectionTitle}>
        {IMS_REFERENCE_COPY.sectionLabel}
      </Text>

      {successMessage ? <Text style={styles.success}>{successMessage}</Text> : null}

      {showConflict ? (
        <EvaluationConflictCard
          isRefreshing={isRefreshing}
          message="Atualize para ver o estado atual antes de continuar."
          title={IMS_REFERENCE_COPY.conflictMessage}
          onRefresh={() => {
            void handleRefresh();
          }}
        />
      ) : null}

      {!showConflict && showRegister ? (
        <ImsRegisterForm
          error={validationError}
          isOnline={isOnline}
          value={code}
          onChange={(value) => {
            setCode(value);
            setValidationError(null);
            setSuccessMessage(null);
          }}
        />
      ) : null}

      {!showConflict && showCard && occurrence.imsReferenceCode ? (
        <CollapsibleSection
          accessibilityLabel="Referência IMS registrada"
          summary={
            <Text accessibilityRole="text" style={styles.collapsedSummary}>
              {occurrence.imsReferenceCode.trim()}
            </Text>
          }
        >
          <ImsReferenceCard
            canUpdate={canUpdate}
            occurrence={occurrence}
            onEdit={() => {
              if (!isOnline) {
                setValidationError(IMS_REFERENCE_COPY.offlineToast);
                return;
              }
              setEditVisible(true);
            }}
          />
        </CollapsibleSection>
      ) : null}

      <ImsEditDialog
        currentCode={occurrence.imsReferenceCode ?? ""}
        isOnline={isOnline}
        isUpdating={isUpdating}
        visible={editVisible}
        onClose={() => {
          setEditVisible(false);
        }}
        onConfirm={(newCode, updateReason) => {
          void handleUpdate(newCode, updateReason);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
    marginTop: 8,
  },
  sectionTitle: {
    borderTopColor: "#1F2937",
    borderTopWidth: 1,
    color: "#93C5FD",
    fontSize: 13,
    fontWeight: "700",
    paddingTop: 12,
    textTransform: "uppercase",
  },
  collapsedSummary: {
    color: "#E5E7EB",
    fontFamily: "monospace",
    fontSize: 14,
    fontWeight: "600",
  },
  success: {
    color: "#86EFAC",
    fontSize: 14,
    fontWeight: "600",
  },
});
