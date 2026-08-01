import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { OccurrenceLoading } from "@/features/occurrences/components/occurrence-loading";

import { EvidenceAddSheet } from "./evidence-add-sheet";
import { EvidencePreviewModal } from "./evidence-preview-modal";
import { EvidenceAddTile, EvidenceQueueTile, EvidenceSyncedTile } from "./evidence-tile";
import { useDeleteEvidence } from "../hooks/use-delete-evidence";
import { useEvidenceSignedUrl } from "../hooks/use-evidence-signed-url";
import { useOccurrenceEvidence } from "../hooks/use-occurrence-evidence";
import { useUploadEvidence } from "../hooks/use-upload-evidence";
import { evidenceColors } from "../theme/colors";
import type { EvidenceListItem } from "../types";

type EvidenceSectionProps = {
  occurrenceId: string;
  showOfflineBanner?: boolean;
};

function SyncedEvidenceTile({
  occurrenceId,
  item,
  index,
  onPress,
}: {
  occurrenceId: string;
  item: EvidenceListItem;
  index: number;
  onPress: (item: EvidenceListItem) => void;
}) {
  const { signedUrl, isLoading, isError, refetch } = useEvidenceSignedUrl(occurrenceId, item.id);

  return (
    <EvidenceSyncedTile
      hasError={isError}
      imageSource={signedUrl ? { uri: signedUrl } : { uri: "" }}
      index={index}
      isLoading={isLoading}
      onPress={() => {
        onPress(item);
      }}
      onRetry={() => {
        void refetch();
      }}
    />
  );
}

export function EvidenceSection({ occurrenceId, showOfflineBanner = true }: EvidenceSectionProps) {
  const [sheetVisible, setSheetVisible] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<EvidenceListItem | null>(null);

  const { evidence, isLoading, isError, refetch, canRead } = useOccurrenceEvidence(occurrenceId);
  const { queue, pickFromCamera, pickFromLibrary, retryUpload, isUploading, canCreate, isOffline } =
    useUploadEvidence({ occurrenceId });
  const { deleteEvidence, isDeleting } = useDeleteEvidence(occurrenceId);

  if (!canRead) {
    return null;
  }

  const syncedCount = evidence.length;
  const hasGalleryItems = syncedCount > 0 || queue.length > 0;

  async function runPicker(action: () => Promise<void>) {
    setActionError(null);

    try {
      await action();
      setSheetVisible(false);
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Não foi possível adicionar a evidência.",
      );
    }
  }

  function confirmDelete(item: EvidenceListItem) {
    Alert.alert(
      "Remover evidência?",
      "A imagem deixará de aparecer nesta ocorrência.\nEsta ação será registrada na auditoria.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Remover",
          style: "destructive",
          onPress: () => {
            void (async () => {
              await deleteEvidence(item.id);
              setPreviewItem(null);
            })();
          },
        },
      ],
    );
  }

  return (
    <View style={styles.block}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Evidências</Text>
        <Text style={styles.counter}>{syncedCount}</Text>
      </View>

      {showOfflineBanner && isOffline ? (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineTitle}>Você está offline.</Text>
          <Text style={styles.offlineBody}>
            As evidências já sincronizadas podem não atualizar. Novos envios ficarão aguardando
            conexão.
          </Text>
        </View>
      ) : null}

      {isLoading ? (
        <OccurrenceLoading />
      ) : isError ? (
        <View style={styles.messageBox}>
          <Text style={styles.errorTitle}>Não foi possível carregar as evidências.</Text>
          <Text style={styles.errorBody}>Verifique sua conexão e tente novamente.</Text>
          <Pressable
            accessibilityLabel="Tentar novamente"
            accessibilityRole="button"
            style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}
            onPress={() => {
              void refetch();
            }}
          >
            <Text style={styles.retryButtonText}>Tentar novamente</Text>
          </Pressable>
        </View>
      ) : (
        <>
          {!hasGalleryItems ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>Nenhuma evidência anexada.</Text>
              <Text style={styles.emptyBody}>
                Adicione fotos da condição insegura para fortalecer o registro.
              </Text>
            </View>
          ) : null}

          <ScrollView
            horizontal
            contentContainerStyle={styles.gallery}
            showsHorizontalScrollIndicator={false}
          >
            {queue.map((item, index) => (
              <EvidenceQueueTile
                key={item.localId}
                index={index}
                item={item}
                onRetry={() => {
                  void runPicker(() => retryUpload(item.localId));
                }}
              />
            ))}

            {evidence.map((item, index) => (
              <SyncedEvidenceTile
                key={item.id}
                index={queue.length + index}
                item={item}
                occurrenceId={occurrenceId}
                onPress={setPreviewItem}
              />
            ))}

            {canCreate ? (
              <EvidenceAddTile
                disabled={isUploading || isOffline}
                onPress={() => {
                  if (isOffline) {
                    setActionError("Sem conexão. Conecte-se para enviar evidências ao servidor.");
                    return;
                  }

                  setActionError(null);
                  setSheetVisible(true);
                }}
              />
            ) : null}
          </ScrollView>
        </>
      )}

      {actionError ? <Text style={styles.actionError}>{actionError}</Text> : null}

      <EvidenceAddSheet
        isBusy={isUploading}
        visible={sheetVisible}
        onClose={() => {
          setSheetVisible(false);
        }}
        onPickCamera={() => {
          void runPicker(pickFromCamera);
        }}
        onPickLibrary={() => {
          void runPicker(pickFromLibrary);
        }}
      />

      <EvidencePreviewModal
        evidence={previewItem}
        occurrenceId={occurrenceId}
        visible={previewItem !== null}
        onClose={() => {
          setPreviewItem(null);
        }}
        onDelete={(item) => {
          if (isDeleting) {
            return;
          }

          confirmDelete(item);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  actionError: {
    color: evidenceColors.destructive,
    fontSize: 13,
    marginTop: 8,
  },
  block: {
    gap: 12,
  },
  counter: {
    color: evidenceColors.foregroundMuted,
    fontSize: 14,
    fontWeight: "600",
  },
  emptyBody: {
    color: evidenceColors.foregroundMuted,
    fontSize: 14,
  },
  emptyBox: {
    gap: 4,
  },
  emptyTitle: {
    color: evidenceColors.foreground,
    fontSize: 14,
    fontWeight: "600",
  },
  errorBody: {
    color: evidenceColors.foregroundMuted,
    fontSize: 14,
  },
  errorTitle: {
    color: evidenceColors.foreground,
    fontSize: 14,
    fontWeight: "600",
  },
  gallery: {
    gap: 8,
    paddingVertical: 4,
  },
  header: {
    alignItems: "center",
    borderTopColor: evidenceColors.borderSubtle,
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 12,
  },
  messageBox: {
    gap: 8,
  },
  offlineBanner: {
    backgroundColor: evidenceColors.destructiveSurface,
    borderRadius: 12,
    gap: 4,
    padding: 12,
  },
  offlineBody: {
    color: evidenceColors.foregroundMuted,
    fontSize: 13,
  },
  offlineTitle: {
    color: evidenceColors.foreground,
    fontSize: 14,
    fontWeight: "600",
  },
  pressed: {
    opacity: 0.85,
  },
  retryButton: {
    alignSelf: "flex-start",
    backgroundColor: evidenceColors.surface,
    borderColor: evidenceColors.border,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  retryButtonText: {
    color: evidenceColors.primary,
    fontSize: 14,
    fontWeight: "600",
  },
  sectionTitle: {
    color: evidenceColors.foregroundLabel,
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
  },
});
