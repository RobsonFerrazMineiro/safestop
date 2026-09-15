import { useState } from "react";
import { FileText } from "lucide-react-native";
import { ActivityIndicator, Image, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing, typography } from "@safestop/ui";

import { Button } from "@/components/ui";
import { useAuthorization } from "@/features/authorization/hooks/use-authorization";

import { useEvidenceSignedUrl } from "../hooks/use-evidence-signed-url";
import type { EvidenceListItem } from "../types";
import { formatEvidenceDate, getAttachmentTypeLabel } from "../utils/evidence-labels";
import { isEvidencePdfMimeType } from "../utils/is-evidence-mime";
import { openEvidenceSignedUrl } from "../utils/open-evidence-signed-url";

type EvidencePreviewModalProps = {
  occurrenceId: string;
  evidence: EvidenceListItem | null;
  visible: boolean;
  isDeleting?: boolean;
  onClose: () => void;
  onDelete?: (item: EvidenceListItem) => void;
};

export function EvidencePreviewModal({
  occurrenceId,
  evidence,
  visible,
  isDeleting = false,
  onClose,
  onDelete,
}: EvidencePreviewModalProps) {
  const { can } = useAuthorization();
  const canDelete = can("occurrence.create");
  const [openError, setOpenError] = useState<string | null>(null);
  const { signedUrl, isLoading, isError, refetch } = useEvidenceSignedUrl(
    occurrenceId,
    visible ? evidence?.id : null,
  );

  if (!evidence) {
    return null;
  }

  const isPdf = isEvidencePdfMimeType(evidence.mimeType);

  async function handleOpenPdf() {
    if (!signedUrl) {
      return;
    }

    setOpenError(null);

    try {
      await openEvidenceSignedUrl(signedUrl);
    } catch (error) {
      setOpenError(error instanceof Error ? error.message : "Não foi possível abrir o PDF.");
    }
  }

  return (
    <Modal animationType="fade" visible={visible} onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable
            accessibilityLabel="Fechar visualização"
            accessibilityRole="button"
            onPress={onClose}
          >
            <Text style={styles.close}>✕</Text>
          </Pressable>
        </View>

        <View style={styles.imageContainer}>
          {isLoading ? (
            <ActivityIndicator color={colors.primary} size="large" />
          ) : isError || !signedUrl ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>
                {isPdf
                  ? "Não foi possível carregar o documento."
                  : "Não foi possível carregar a imagem."}
              </Text>
              <Button
                accessibilityLabel="Tentar novamente"
                variant="ghost"
                onPress={() => {
                  void refetch();
                }}
              >
                Tentar novamente
              </Button>
            </View>
          ) : isPdf ? (
            <View style={styles.pdfBox}>
              <FileText accessible={false} color={colors.foregroundMuted} size={48} />
              <Text style={styles.pdfBadge}>PDF</Text>
              <Text style={styles.pdfName}>{evidence.originalFileName}</Text>
              <Button accessibilityLabel="Abrir PDF" onPress={() => void handleOpenPdf()}>
                Abrir PDF
              </Button>
              {openError ? <Text style={styles.errorText}>{openError}</Text> : null}
            </View>
          ) : (
            <Image
              accessibilityLabel={evidence.caption ?? evidence.originalFileName}
              resizeMode="contain"
              source={{ uri: signedUrl }}
              style={styles.image}
            />
          )}
        </View>

        <View style={styles.meta}>
          <Text style={styles.typeLabel}>
            {isPdf ? "Evidência PDF" : getAttachmentTypeLabel("INITIAL_EVIDENCE")}
          </Text>
          <Text style={styles.fileName}>{evidence.originalFileName}</Text>
          <Text style={styles.metaLine}>
            {evidence.uploadedByName ? `Por ${evidence.uploadedByName} · ` : ""}
            {formatEvidenceDate(evidence.createdAt)}
          </Text>
          {evidence.caption ? <Text style={styles.caption}>{evidence.caption}</Text> : null}

          {canDelete && onDelete ? (
            <Button
              accessibilityLabel="Remover evidência"
              disabled={isDeleting}
              loading={isDeleting}
              variant="destructive"
              style={styles.deleteButton}
              onPress={() => {
                onDelete(evidence);
              }}
            >
              Remover
            </Button>
          ) : null}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  caption: {
    color: colors.foregroundMuted,
    fontSize: typography.body.fontSize,
    marginTop: spacing[2],
  },
  close: {
    color: colors.foreground,
    fontSize: 24,
    fontWeight: "600",
  },
  container: {
    backgroundColor: colors.background,
    flex: 1,
  },
  deleteButton: {
    alignSelf: "flex-start",
    marginTop: spacing[4],
  },
  errorBox: {
    alignItems: "center",
    gap: spacing[2],
    padding: spacing[4],
  },
  errorText: {
    color: colors.foregroundMuted,
    fontSize: typography.body.fontSize,
    textAlign: "center",
  },
  fileName: {
    color: colors.foreground,
    fontSize: typography.cardTitle.fontSize,
    fontWeight: "600",
    marginTop: spacing[1],
  },
  header: {
    alignItems: "flex-end",
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
  },
  image: {
    height: "100%",
    width: "100%",
  },
  imageContainer: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing[4],
  },
  meta: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    padding: spacing[4],
  },
  metaLine: {
    color: colors.foregroundMuted,
    fontSize: typography.caption.fontSize,
    marginTop: spacing[1],
  },
  pdfBadge: {
    color: colors.foregroundMuted,
    fontSize: typography.caption.fontSize,
    fontWeight: "700",
    letterSpacing: 1,
    marginTop: spacing[2],
  },
  pdfBox: {
    alignItems: "center",
    gap: spacing[3],
    padding: spacing[4],
  },
  pdfName: {
    color: colors.foreground,
    fontSize: typography.body.fontSize,
    fontWeight: "600",
    textAlign: "center",
  },
  typeLabel: {
    color: colors.foregroundMuted,
    fontSize: typography.caption.fontSize,
    fontWeight: "600",
    textTransform: "uppercase",
  },
});
