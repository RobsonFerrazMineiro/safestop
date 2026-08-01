import { ActivityIndicator, Image, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuthorization } from "@/features/authorization/hooks/use-authorization";

import { useEvidenceSignedUrl } from "../hooks/use-evidence-signed-url";
import { evidenceColors } from "../theme/colors";
import type { EvidenceListItem } from "../types";
import { formatEvidenceDate, getAttachmentTypeLabel } from "../utils/evidence-labels";

type EvidencePreviewModalProps = {
  occurrenceId: string;
  evidence: EvidenceListItem | null;
  visible: boolean;
  onClose: () => void;
  onDelete?: (item: EvidenceListItem) => void;
};

export function EvidencePreviewModal({
  occurrenceId,
  evidence,
  visible,
  onClose,
  onDelete,
}: EvidencePreviewModalProps) {
  const { can } = useAuthorization();
  const canDelete = can("occurrence.create");
  const { signedUrl, isLoading, isError, refetch } = useEvidenceSignedUrl(
    occurrenceId,
    visible ? evidence?.id : null,
  );

  if (!evidence) {
    return null;
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
            <ActivityIndicator color={evidenceColors.primary} size="large" />
          ) : isError || !signedUrl ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>Não foi possível carregar a imagem.</Text>
              <Pressable
                accessibilityLabel="Tentar novamente"
                accessibilityRole="button"
                onPress={() => {
                  void refetch();
                }}
              >
                <Text style={styles.retryLink}>Tentar novamente</Text>
              </Pressable>
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
          <Text style={styles.typeLabel}>{getAttachmentTypeLabel("INITIAL_EVIDENCE")}</Text>
          <Text style={styles.fileName}>{evidence.originalFileName}</Text>
          <Text style={styles.metaLine}>
            {evidence.uploadedByName ? `Por ${evidence.uploadedByName} · ` : ""}
            {formatEvidenceDate(evidence.createdAt)}
          </Text>
          {evidence.caption ? <Text style={styles.caption}>{evidence.caption}</Text> : null}

          {canDelete && onDelete ? (
            <Pressable
              accessibilityLabel="Remover evidência"
              accessibilityRole="button"
              style={({ pressed }) => [styles.deleteButton, pressed && styles.pressed]}
              onPress={() => {
                onDelete(evidence);
              }}
            >
              <Text style={styles.deleteText}>Remover</Text>
            </Pressable>
          ) : null}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  caption: {
    color: evidenceColors.foregroundLabel,
    fontSize: 14,
    marginTop: 8,
  },
  close: {
    color: evidenceColors.foreground,
    fontSize: 24,
    fontWeight: "600",
  },
  container: {
    backgroundColor: evidenceColors.background,
    flex: 1,
  },
  deleteButton: {
    alignSelf: "flex-start",
    borderColor: evidenceColors.destructive,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  deleteText: {
    color: evidenceColors.destructive,
    fontSize: 14,
    fontWeight: "600",
  },
  errorBox: {
    alignItems: "center",
    gap: 8,
    padding: 16,
  },
  errorText: {
    color: evidenceColors.foregroundMuted,
    fontSize: 14,
    textAlign: "center",
  },
  fileName: {
    color: evidenceColors.foreground,
    fontSize: 16,
    fontWeight: "600",
    marginTop: 4,
  },
  header: {
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  image: {
    height: "100%",
    width: "100%",
  },
  imageContainer: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  meta: {
    borderTopColor: evidenceColors.borderSubtle,
    borderTopWidth: 1,
    padding: 16,
  },
  metaLine: {
    color: evidenceColors.foregroundMuted,
    fontSize: 13,
    marginTop: 4,
  },
  pressed: {
    opacity: 0.85,
  },
  retryLink: {
    color: evidenceColors.primary,
    fontSize: 14,
    fontWeight: "600",
  },
  typeLabel: {
    color: evidenceColors.foregroundMuted,
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },
});
