import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import {
  ACTION_ITEM_ATTACHMENT_MAX_FILE_SIZE_BYTES,
  type ActionItemAttachmentMimeType,
} from "@safestop/types";
import { actionPlanKeys } from "@safestop/query-keys";

import { useActiveOrganization } from "@/features/organization/hooks/use-active-organization";
import { resolvePickerMimeType } from "@/features/evidence/services/compress-image";
import { pickEvidencePdf } from "@/features/evidence/services/pick-evidence-pdf";
import {
  EVIDENCE_UNSUPPORTED_FORMAT_MESSAGE,
  prepareEvidenceAssetForUpload,
  type EvidenceSourceAsset,
} from "@/features/evidence/services/prepare-evidence-asset";
import { isEvidenceImageMimeType } from "@/features/evidence/utils/is-evidence-mime";

import {
  completeActionItemAttachmentUpload,
  failActionItemAttachmentUpload,
  prepareActionItemAttachmentUpload,
  uploadActionItemAttachmentToStorage,
} from "../services/action-item-attachment-upload";
import { ACTION_ITEM_ATTACHMENT_MAX_COUNT } from "../types";

export type ActionItemEvidencePickResult = "canceled" | "uploaded";

function isAcceptedImageMimeType(mimeType: string | undefined, uri: string): boolean {
  const resolved = resolvePickerMimeType(mimeType, uri);
  return isEvidenceImageMimeType(resolved);
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
    mutationFn: async (source: EvidenceSourceAsset) => {
      const preparedAsset = await prepareEvidenceAssetForUpload(source);

      if (preparedAsset.fileSize > ACTION_ITEM_ATTACHMENT_MAX_FILE_SIZE_BYTES) {
        throw new Error("Arquivo excede o limite de 10 MiB.");
      }

      const mimeType = preparedAsset.mimeType as ActionItemAttachmentMimeType;

      const prepared = await prepareActionItemAttachmentUpload({
        actionItemId: itemId,
        originalFileName: preparedAsset.fileName,
        mimeType,
        fileSize: preparedAsset.fileSize,
      });

      try {
        await uploadActionItemAttachmentToStorage({
          bucket: prepared.bucket,
          storagePath: prepared.storagePath,
          uri: preparedAsset.uri,
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

  const pickFromLibrary = useCallback(async (): Promise<ActionItemEvidencePickResult> => {
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
      return "canceled";
    }

    const asset = result.assets[0];

    if (!isAcceptedImageMimeType(asset.mimeType, asset.uri)) {
      throw new Error(EVIDENCE_UNSUPPORTED_FORMAT_MESSAGE);
    }

    await uploadMutation.mutateAsync({
      uri: asset.uri,
      fileName: asset.fileName,
      mimeType: resolvePickerMimeType(asset.mimeType, asset.uri),
      fileSize: asset.fileSize && asset.fileSize > 0 ? asset.fileSize : null,
    });

    return "uploaded";
  }, [assertCanUpload, uploadMutation]);

  const pickFromCamera = useCallback(async (): Promise<ActionItemEvidencePickResult> => {
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
      return "canceled";
    }

    const asset = result.assets[0];

    if (!isAcceptedImageMimeType(asset.mimeType, asset.uri)) {
      throw new Error(EVIDENCE_UNSUPPORTED_FORMAT_MESSAGE);
    }

    await uploadMutation.mutateAsync({
      uri: asset.uri,
      fileName: asset.fileName,
      mimeType: resolvePickerMimeType(asset.mimeType, asset.uri),
      fileSize: asset.fileSize && asset.fileSize > 0 ? asset.fileSize : null,
    });

    return "uploaded";
  }, [assertCanUpload, uploadMutation]);

  const pickFromPdf = useCallback(async (): Promise<ActionItemEvidencePickResult> => {
    assertCanUpload();

    const picked = await pickEvidencePdf();

    if (picked.canceled) {
      return "canceled";
    }

    await uploadMutation.mutateAsync(picked.asset);
    return "uploaded";
  }, [assertCanUpload, uploadMutation]);

  return {
    pickFromCamera,
    pickFromLibrary,
    pickFromPdf,
    isUploading: uploadMutation.isPending,
  };
}
