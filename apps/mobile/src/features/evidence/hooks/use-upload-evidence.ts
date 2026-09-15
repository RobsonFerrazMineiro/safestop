import { useCallback, useSyncExternalStore } from "react";
import * as ImagePicker from "expo-image-picker";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  OCCURRENCE_ATTACHMENT_MAX_COUNT_PER_OCCURRENCE,
  type OccurrenceAttachmentType,
} from "@safestop/types";
import { prepareAttachmentUploadSchema } from "@safestop/validation";

import { useAuthorization } from "@/features/authorization/hooks/use-authorization";
import { useActiveOrganization } from "@/features/organization/hooks/use-active-organization";

import { resolvePickerMimeType } from "../services/compress-image";
import {
  completeAttachmentUpload,
  failAttachmentUpload,
  prepareAttachmentUpload,
  uploadAttachmentToStorage,
} from "../services/evidence-upload";
import { pickEvidencePdf } from "../services/pick-evidence-pdf";
import {
  EVIDENCE_UNSUPPORTED_FORMAT_MESSAGE,
  prepareEvidenceAssetForUpload,
} from "../services/prepare-evidence-asset";
import {
  getEvidenceUploadQueue,
  getEvidenceUploadQueueSnapshot,
  removeEvidenceUploadQueueItem,
  setEvidenceUploadQueue,
  subscribeEvidenceUploadQueue,
  upsertEvidenceUploadQueueItem,
} from "../stores/evidence-upload-queue-store";
import {
  EVIDENCE_BATCH_SELECTION_LIMIT,
  evidenceQueryKeys,
  type EvidenceUploadQueueItem,
} from "../types";
import { isEvidenceImageMimeType } from "../utils/is-evidence-mime";

import { useOccurrenceEvidence } from "./use-occurrence-evidence";

function createLocalId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function isOnline(): boolean {
  const browserGlobal = globalThis as typeof globalThis & {
    navigator?: { onLine?: boolean };
  };

  return browserGlobal.navigator?.onLine !== false;
}

function isAcceptedImageMimeType(mimeType: string | undefined, uri: string): boolean {
  const resolved = resolvePickerMimeType(mimeType, uri);
  return isEvidenceImageMimeType(resolved);
}

type UploadEvidenceParams = {
  occurrenceId: string;
  attachmentType?: OccurrenceAttachmentType;
};

export function useUploadEvidence({
  occurrenceId,
  attachmentType = "INITIAL_EVIDENCE",
}: UploadEvidenceParams) {
  const queryClient = useQueryClient();
  const { can } = useAuthorization();
  const { activeOrganization, isReady } = useActiveOrganization();
  const organizationId = activeOrganization?.id;
  const canCreate = can("occurrence.create");
  const { evidence } = useOccurrenceEvidence(occurrenceId);

  const queue = useSyncExternalStore(
    subscribeEvidenceUploadQueue,
    () => getEvidenceUploadQueueSnapshot(occurrenceId),
    () => getEvidenceUploadQueueSnapshot(occurrenceId),
  );

  const syncQueue = useCallback(
    (next: EvidenceUploadQueueItem[]) => {
      setEvidenceUploadQueue(occurrenceId, next);
    },
    [occurrenceId],
  );

  const updateQueueItem = useCallback(
    (item: EvidenceUploadQueueItem) => {
      upsertEvidenceUploadQueueItem(occurrenceId, item);
    },
    [occurrenceId],
  );

  const invalidateEvidenceList = useCallback(async () => {
    if (!organizationId) {
      return;
    }

    await queryClient.invalidateQueries({
      queryKey: evidenceQueryKeys.list(organizationId, occurrenceId),
    });
  }, [occurrenceId, organizationId, queryClient]);

  const uploadItemMutation = useMutation({
    mutationFn: async (item: EvidenceUploadQueueItem) => {
      const isPdf = item.mimeType === "application/pdf";

      let workingItem: EvidenceUploadQueueItem = {
        ...item,
        status: isPdf ? "preparing" : "compressing",
        progress: 0.1,
        error: null,
      };
      updateQueueItem(workingItem);

      const preparedAsset = await prepareEvidenceAssetForUpload({
        uri: item.uri,
        fileName: item.originalFileName,
        mimeType: item.mimeType,
        fileSize: item.fileSize > 0 ? item.fileSize : null,
      });

      workingItem = {
        ...workingItem,
        uri: preparedAsset.uri,
        previewUri: preparedAsset.uri,
        originalFileName: preparedAsset.fileName,
        mimeType: preparedAsset.mimeType,
        fileSize: preparedAsset.fileSize,
        status: "preparing",
        progress: 0.25,
      };
      updateQueueItem(workingItem);

      const prepareInput = prepareAttachmentUploadSchema.parse({
        occurrenceId,
        attachmentType: workingItem.attachmentType,
        originalFileName: preparedAsset.fileName,
        mimeType: preparedAsset.mimeType,
        fileSize: preparedAsset.fileSize,
      });

      const prepared = await prepareAttachmentUpload(prepareInput);

      workingItem = {
        ...workingItem,
        attachmentId: prepared.attachmentId,
        status: "uploading",
        progress: 0.5,
      };
      updateQueueItem(workingItem);

      try {
        await uploadAttachmentToStorage({
          bucket: prepared.bucket,
          storagePath: prepared.storagePath,
          uri: preparedAsset.uri,
          mimeType: preparedAsset.mimeType,
        });
      } catch (error) {
        await failAttachmentUpload(
          prepared.attachmentId,
          error instanceof Error ? error.message : "Falha no Storage",
        );
        throw error;
      }

      workingItem = {
        ...workingItem,
        status: "completing",
        progress: 0.85,
      };
      updateQueueItem(workingItem);

      await completeAttachmentUpload(prepared.attachmentId);

      return workingItem;
    },
    onSuccess: async (_data, item) => {
      removeEvidenceUploadQueueItem(occurrenceId, item.localId);
      await invalidateEvidenceList();
    },
    onError: (error, item) => {
      updateQueueItem({
        ...item,
        status: "failed",
        error: error instanceof Error ? error.message : "Falha no envio.",
        progress: 0,
      });
    },
  });

  const countActiveEvidence = useCallback(() => {
    const current = getEvidenceUploadQueue(occurrenceId);
    const inFlight = current.filter(
      (entry) => entry.status !== "completed" && entry.status !== "failed",
    ).length;

    return evidence.length + inFlight;
  }, [evidence.length, occurrenceId]);

  const assertCanUpload = useCallback(() => {
    if (!canCreate || !isReady) {
      return;
    }

    if (!isOnline()) {
      throw new Error("Sem conexão. Conecte-se para enviar evidências ao servidor.");
    }
  }, [canCreate, isReady]);

  const pickFromLibrary = useCallback(async () => {
    assertCanUpload();

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      throw new Error(
        "Permissão necessária para anexar fotos. Abra as configurações do dispositivo para habilitar.",
      );
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: EVIDENCE_BATCH_SELECTION_LIMIT,
      quality: 1,
    });

    if (result.canceled || result.assets.length === 0) {
      return;
    }

    const acceptedAssets = result.assets.filter((asset) =>
      isAcceptedImageMimeType(asset.mimeType, asset.uri),
    );

    if (acceptedAssets.length === 0) {
      throw new Error(EVIDENCE_UNSUPPORTED_FORMAT_MESSAGE);
    }

    const current = getEvidenceUploadQueue(occurrenceId);
    const remaining = OCCURRENCE_ATTACHMENT_MAX_COUNT_PER_OCCURRENCE - countActiveEvidence();

    if (remaining <= 0) {
      throw new Error("Limite de evidências por ocorrência atingido.");
    }

    const assets = acceptedAssets.slice(0, remaining);
    const nextItems: EvidenceUploadQueueItem[] = assets.map((asset) => ({
      localId: createLocalId(),
      occurrenceId,
      uri: asset.uri,
      previewUri: asset.uri,
      originalFileName: asset.fileName ?? `evidencia-${Date.now()}.jpg`,
      mimeType: resolvePickerMimeType(asset.mimeType, asset.uri),
      fileSize: asset.fileSize && asset.fileSize > 0 ? asset.fileSize : 0,
      attachmentType,
      status: "queued",
      progress: 0,
      error: null,
      attachmentId: null,
    }));

    syncQueue([...current, ...nextItems]);

    for (const item of nextItems) {
      await uploadItemMutation.mutateAsync(item);
    }
  }, [
    assertCanUpload,
    attachmentType,
    countActiveEvidence,
    occurrenceId,
    syncQueue,
    uploadItemMutation,
  ]);

  const pickFromCamera = useCallback(async () => {
    assertCanUpload();

    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      throw new Error(
        "Permissão necessária para anexar fotos. Abra as configurações do dispositivo para habilitar.",
      );
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 1,
      cameraType: ImagePicker.CameraType.back,
    });

    if (result.canceled || !result.assets[0]) {
      return;
    }

    const asset = result.assets[0];

    if (!isAcceptedImageMimeType(asset.mimeType, asset.uri)) {
      throw new Error(EVIDENCE_UNSUPPORTED_FORMAT_MESSAGE);
    }

    if (countActiveEvidence() >= OCCURRENCE_ATTACHMENT_MAX_COUNT_PER_OCCURRENCE) {
      throw new Error("Limite de evidências por ocorrência atingido.");
    }

    const item: EvidenceUploadQueueItem = {
      localId: createLocalId(),
      occurrenceId,
      uri: asset.uri,
      previewUri: asset.uri,
      originalFileName: asset.fileName ?? `evidencia-${Date.now()}.jpg`,
      mimeType: resolvePickerMimeType(asset.mimeType, asset.uri),
      fileSize: asset.fileSize && asset.fileSize > 0 ? asset.fileSize : 0,
      attachmentType,
      status: "queued",
      progress: 0,
      error: null,
      attachmentId: null,
    };

    syncQueue([...getEvidenceUploadQueue(occurrenceId), item]);
    await uploadItemMutation.mutateAsync(item);
  }, [
    assertCanUpload,
    attachmentType,
    countActiveEvidence,
    occurrenceId,
    syncQueue,
    uploadItemMutation,
  ]);

  const pickFromPdf = useCallback(async () => {
    assertCanUpload();

    if (countActiveEvidence() >= OCCURRENCE_ATTACHMENT_MAX_COUNT_PER_OCCURRENCE) {
      throw new Error("Limite de evidências por ocorrência atingido.");
    }

    const picked = await pickEvidencePdf();

    if (picked.canceled) {
      return;
    }

    const item: EvidenceUploadQueueItem = {
      localId: createLocalId(),
      occurrenceId,
      uri: picked.asset.uri,
      previewUri: picked.asset.uri,
      originalFileName: picked.asset.fileName?.trim() || "evidencia.pdf",
      mimeType: "application/pdf",
      fileSize:
        typeof picked.asset.fileSize === "number" && picked.asset.fileSize > 0
          ? picked.asset.fileSize
          : 0,
      attachmentType,
      status: "queued",
      progress: 0,
      error: null,
      attachmentId: null,
    };

    syncQueue([...getEvidenceUploadQueue(occurrenceId), item]);
    await uploadItemMutation.mutateAsync(item);
  }, [
    assertCanUpload,
    attachmentType,
    countActiveEvidence,
    occurrenceId,
    syncQueue,
    uploadItemMutation,
  ]);

  const retryUpload = useCallback(
    async (localId: string) => {
      if (!isOnline()) {
        throw new Error("Sem conexão. Conecte-se para enviar evidências ao servidor.");
      }

      const item = getEvidenceUploadQueue(occurrenceId).find((entry) => entry.localId === localId);

      if (!item) {
        return;
      }

      const resetItem: EvidenceUploadQueueItem = {
        ...item,
        status: "queued",
        progress: 0,
        error: null,
        attachmentId: null,
      };

      updateQueueItem(resetItem);
      await uploadItemMutation.mutateAsync(resetItem);
    },
    [occurrenceId, updateQueueItem, uploadItemMutation],
  );

  const removeQueuedItem = useCallback(
    (localId: string) => {
      removeEvidenceUploadQueueItem(occurrenceId, localId);
    },
    [occurrenceId],
  );

  const activeQueue = queue.filter((item) => item.status !== "completed");

  return {
    queue: activeQueue,
    pickFromCamera,
    pickFromLibrary,
    pickFromPdf,
    retryUpload,
    removeQueuedItem,
    isUploading: uploadItemMutation.isPending,
    canCreate: isReady && canCreate,
    isOffline: !isOnline(),
  };
}
