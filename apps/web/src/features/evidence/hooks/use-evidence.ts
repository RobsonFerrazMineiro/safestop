"use client";

import { useCallback, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  OCCURRENCE_ATTACHMENT_MAX_COUNT_PER_OCCURRENCE,
  OCCURRENCE_ATTACHMENT_MAX_FILE_SIZE_BYTES,
} from "@safestop/types";

import { useAuthorization } from "@/features/authorization";
import { useActiveOrganization } from "@/features/organization/hooks/use-active-organization";
import { useInvalidateOccurrenceTimeline } from "@/features/timeline";

import { getOccurrenceAttachmentSignedUrl } from "../services/get-attachment-signed-url";
import { deleteOccurrenceAttachment } from "../services/delete-occurrence-evidence";
import { getOccurrenceEvidence } from "../services/get-occurrence-evidence";
import { uploadEvidenceFile } from "../services/upload-evidence-file";
import {
  EVIDENCE_LIST_STALE_TIME_MS,
  EVIDENCE_SIGNED_URL_STALE_TIME_MS,
  evidenceQueryKeys,
  type EvidenceUploadQueueItem,
} from "../types";
import { isAcceptedEvidenceFile } from "../utils/is-evidence-mime";
import {
  EVIDENCE_MAX_SIZE_MESSAGE,
  EVIDENCE_UNSUPPORTED_FORMAT_MESSAGE,
} from "../utils/prepare-evidence-file";

function createLocalId(): string {
  return crypto.randomUUID();
}

export function useOccurrenceEvidence(occurrenceId: string | undefined) {
  const { can, isReady: isAuthzReady } = useAuthorization();
  const { activeOrganization, isReady: isOrgReady } = useActiveOrganization();

  const organizationId = activeOrganization?.id;
  const canRead = can("occurrence.read");
  const enabled =
    isOrgReady &&
    isAuthzReady &&
    organizationId !== undefined &&
    occurrenceId !== undefined &&
    occurrenceId.length > 0 &&
    canRead;

  const query = useQuery({
    queryKey: evidenceQueryKeys(organizationId ?? "", occurrenceId ?? "").list(),
    queryFn: () => getOccurrenceEvidence(organizationId!, occurrenceId!),
    enabled,
    staleTime: EVIDENCE_LIST_STALE_TIME_MS,
  });

  const completedEvidence = (query.data ?? []).filter(
    (item) => item.uploadStatus === "COMPLETED" && item.attachmentType === "INITIAL_EVIDENCE",
  );

  return {
    evidence: completedEvidence,
    allAttachments: query.data ?? [],
    isLoading: enabled && query.isLoading,
    isError: query.isError,
    error: query.error,
    isReady: enabled && query.isSuccess,
    refetch: query.refetch,
  };
}

export function useEvidenceSignedUrl(
  occurrenceId: string,
  attachmentId: string | null | undefined,
) {
  const { can, isReady: isAuthzReady } = useAuthorization();
  const { activeOrganization, isReady: isOrgReady } = useActiveOrganization();

  const organizationId = activeOrganization?.id;
  const canRead = can("occurrence.read");
  const enabled =
    isOrgReady &&
    isAuthzReady &&
    organizationId !== undefined &&
    occurrenceId.length > 0 &&
    attachmentId !== undefined &&
    attachmentId !== null &&
    attachmentId.length > 0 &&
    canRead;

  const query = useQuery({
    queryKey: evidenceQueryKeys(organizationId ?? "", occurrenceId).signedUrl(attachmentId ?? ""),
    queryFn: () => getOccurrenceAttachmentSignedUrl(attachmentId!),
    enabled,
    staleTime: EVIDENCE_SIGNED_URL_STALE_TIME_MS,
  });

  return {
    signedUrl: query.data?.signedUrl ?? null,
    isLoading: enabled && query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}

export function useUploadEvidence(occurrenceId: string) {
  const queryClient = useQueryClient();
  const { can } = useAuthorization();
  const { activeOrganization } = useActiveOrganization();
  const organizationId = activeOrganization?.id;
  const invalidateTimeline = useInvalidateOccurrenceTimeline();
  const { evidence } = useOccurrenceEvidence(occurrenceId);

  const [queue, setQueue] = useState<EvidenceUploadQueueItem[]>([]);
  const canCreate = can("occurrence.create");

  const uploadMutation = useMutation({
    mutationFn: async (item: EvidenceUploadQueueItem) => {
      const attachmentId = await uploadEvidenceFile({
        occurrenceId,
        file: item.file,
        onPhaseChange: (phase) => {
          setQueue((current) =>
            current.map((entry) =>
              entry.localId === item.localId ? { ...entry, phase, errorMessage: null } : entry,
            ),
          );
        },
        onProgress: (progress) => {
          setQueue((current) =>
            current.map((entry) =>
              entry.localId === item.localId ? { ...entry, progress } : entry,
            ),
          );
        },
      });

      return attachmentId;
    },
    onSuccess: async (_attachmentId, item) => {
      setQueue((current) => {
        const target = current.find((entry) => entry.localId === item.localId);

        if (target) {
          URL.revokeObjectURL(target.previewUrl);
        }

        return current.filter((entry) => entry.localId !== item.localId);
      });

      if (organizationId) {
        await queryClient.invalidateQueries({
          queryKey: evidenceQueryKeys(organizationId, occurrenceId).list(),
        });
        await invalidateTimeline(organizationId, occurrenceId);
      }
    },
    onError: (error, item) => {
      setQueue((current) =>
        current.map((entry) =>
          entry.localId === item.localId
            ? {
                ...entry,
                phase: "failed",
                errorMessage:
                  error instanceof Error ? error.message : "Não foi possível enviar a evidência.",
              }
            : entry,
        ),
      );
    },
  });

  const countActiveEvidence = useCallback(() => {
    const inFlight = queue.filter((entry) => entry.phase !== "failed").length;
    return evidence.length + inFlight;
  }, [evidence.length, queue]);

  const enqueueFiles = useCallback(
    async (files: FileList | File[]) => {
      if (!canCreate) {
        return;
      }

      if (typeof navigator !== "undefined" && !navigator.onLine) {
        throw new Error("Sem conexão. Conecte-se para enviar evidências ao servidor.");
      }

      const candidates = Array.from(files);
      const accepted = candidates.filter(isAcceptedEvidenceFile);

      if (accepted.length === 0) {
        throw new Error(EVIDENCE_UNSUPPORTED_FORMAT_MESSAGE);
      }

      if (accepted.some((file) => file.size > OCCURRENCE_ATTACHMENT_MAX_FILE_SIZE_BYTES)) {
        throw new Error(EVIDENCE_MAX_SIZE_MESSAGE);
      }

      const remaining = OCCURRENCE_ATTACHMENT_MAX_COUNT_PER_OCCURRENCE - countActiveEvidence();

      if (remaining <= 0) {
        throw new Error("Limite de evidências por ocorrência atingido.");
      }

      const batch = accepted.slice(0, remaining);
      const newItems: EvidenceUploadQueueItem[] = batch.map((file) => ({
        localId: createLocalId(),
        file,
        fileName: file.name,
        previewUrl: URL.createObjectURL(file),
        phase: "preparing",
        progress: 0,
        errorMessage: null,
        attachmentId: null,
      }));

      setQueue((current) => [...current, ...newItems]);

      for (const item of newItems) {
        await uploadMutation.mutateAsync(item);
      }
    },
    [canCreate, countActiveEvidence, uploadMutation],
  );

  const retryUpload = useCallback(
    async (localId: string) => {
      const item = queue.find((entry) => entry.localId === localId);

      if (!item) {
        return;
      }

      const resetItem: EvidenceUploadQueueItem = {
        ...item,
        phase: "preparing",
        progress: 0,
        errorMessage: null,
        attachmentId: null,
      };

      setQueue((current) =>
        current.map((entry) => (entry.localId === localId ? resetItem : entry)),
      );

      await uploadMutation.mutateAsync(resetItem);
    },
    [queue, uploadMutation],
  );

  const removeQueueItem = useCallback((localId: string) => {
    setQueue((current) => {
      const target = current.find((entry) => entry.localId === localId);

      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }

      return current.filter((entry) => entry.localId !== localId);
    });
  }, []);

  return {
    queue,
    enqueueFiles,
    retryUpload,
    removeQueueItem,
    isUploading: uploadMutation.isPending,
    canCreate,
  };
}

export function useDeleteEvidence(occurrenceId: string) {
  const queryClient = useQueryClient();
  const { activeOrganization } = useActiveOrganization();
  const organizationId = activeOrganization?.id;
  const invalidateTimeline = useInvalidateOccurrenceTimeline();

  const mutation = useMutation({
    mutationFn: (attachmentId: string) => deleteOccurrenceAttachment(attachmentId),
    onSuccess: async (_data, attachmentId) => {
      if (organizationId) {
        await queryClient.invalidateQueries({
          queryKey: evidenceQueryKeys(organizationId, occurrenceId).list(),
        });
        await queryClient.removeQueries({
          queryKey: evidenceQueryKeys(organizationId, occurrenceId).signedUrl(attachmentId),
        });
        await invalidateTimeline(organizationId, occurrenceId);
      }
    },
  });

  return {
    deleteEvidence: mutation.mutateAsync,
    isDeleting: mutation.isPending,
    deleteError: mutation.error,
    resetDelete: mutation.reset,
  };
}
