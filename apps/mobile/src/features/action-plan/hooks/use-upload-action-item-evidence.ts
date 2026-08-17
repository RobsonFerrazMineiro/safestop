import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import {
  ACTION_ITEM_ATTACHMENT_MAX_FILE_SIZE_BYTES,
  ACTION_ITEM_ATTACHMENT_MIME_TYPES,
  type ActionItemAttachmentMimeType,
} from "@safestop/types";
import { actionPlanKeys } from "@safestop/query-keys";

import { useActiveOrganization } from "@/features/organization/hooks/use-active-organization";
import {
  compressEvidenceImage,
  resolvePickerMimeType,
} from "@/features/evidence/services/compress-image";

import {
  completeActionItemAttachmentUpload,
  failActionItemAttachmentUpload,
  prepareActionItemAttachmentUpload,
  uploadActionItemAttachmentToStorage,
} from "../services/action-item-attachment-upload";
import { ACTION_ITEM_ATTACHMENT_MAX_COUNT } from "../types";

function isAcceptedMimeType(mimeType: string | undefined, uri: string): boolean {
  const resolved = resolvePickerMimeType(mimeType, uri);
  return (ACTION_ITEM_ATTACHMENT_MIME_TYPES as readonly string[]).includes(resolved);
}

type UploadParams = {
  occurrenceId: string;
  itemId: string;
  completedCount: number;
};

export function useUploadActionItemEvidence({
  occurrenceId,
  itemId,
  completedCount,
}: UploadParams) {
  const queryClient = useQueryClient();
  const { activeOrganization } = useActiveOrganization();
  const organizationId = activeOrganization?.id;

  const invalidateAttachments = useCallback(async () => {
    if (!organizationId) {
      return;
    }

    await queryClient.invalidateQueries({
      queryKey: actionPlanKeys.attachments(organizationId, itemId),
    });
  }, [itemId, organizationId, queryClient]);

  const uploadMutation = useMutation({
    mutationFn: async (asset: ImagePicker.ImagePickerAsset) => {
      const compressed = await compressEvidenceImage(asset.uri);

      if (compressed.fileSize > ACTION_ITEM_ATTACHMENT_MAX_FILE_SIZE_BYTES) {
        throw new Error("Arquivo excede o limite de 10 MiB.");
      }

      const mimeType = compressed.mimeType as ActionItemAttachmentMimeType;

      const prepared = await prepareActionItemAttachmentUpload({
        actionItemId: itemId,
        originalFileName: compressed.fileName,
        mimeType,
        fileSize: compressed.fileSize,
      });

      try {
        await uploadActionItemAttachmentToStorage({
          bucket: prepared.bucket,
          storagePath: prepared.storagePath,
          uri: compressed.uri,
          mimeType,
        });
      } catch (error) {
        await failActionItemAttachmentUpload(
          prepared.attachmentId,
          error instanceof Error ? error.message : "Falha no Storage",
        );
        throw error;
      }

      await completeActionItemAttachmentUpload(prepared.attachmentId);
    },
    onSuccess: async () => {
      await invalidateAttachments();
      await queryClient.invalidateQueries({
        queryKey: actionPlanKeys.byOccurrence(organizationId ?? "", occurrenceId),
      });
    },
  });

  const assertCanUpload = useCallback(() => {
    if (completedCount >= ACTION_ITEM_ATTACHMENT_MAX_COUNT) {
      throw new Error("Limite de evidências por ação atingido.");
    }
  }, [completedCount]);

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
      allowsMultipleSelection: false,
      quality: 1,
    });

    if (result.canceled || !result.assets[0]) {
      return;
    }

    const asset = result.assets[0];

    if (!isAcceptedMimeType(asset.mimeType, asset.uri)) {
      throw new Error("Use apenas imagens JPG, PNG ou WebP.");
    }

    await uploadMutation.mutateAsync(asset);
  }, [assertCanUpload, uploadMutation]);

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

    if (!isAcceptedMimeType(asset.mimeType, asset.uri)) {
      throw new Error("Use apenas imagens JPG, PNG ou WebP.");
    }

    await uploadMutation.mutateAsync(asset);
  }, [assertCanUpload, uploadMutation]);

  return {
    pickFromCamera,
    pickFromLibrary,
    isUploading: uploadMutation.isPending,
  };
}
