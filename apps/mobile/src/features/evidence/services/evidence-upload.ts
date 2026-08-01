import type {
  OccurrenceAttachmentUploadStatus,
  PrepareOccurrenceAttachmentUploadResult,
} from "@safestop/types";
import type { PrepareAttachmentUploadInput } from "@safestop/validation";

import { getSupabaseClient } from "@/lib/auth/client";

import { mapOccurrenceAttachmentRow } from "../utils/map-evidence";
import type { EvidenceListItem } from "../types";

type RpcError = {
  code?: string;
  message?: string;
};

type PrepareRpcResponse = {
  success: boolean;
  data?: {
    attachment_id: string;
    bucket: PrepareOccurrenceAttachmentUploadResult["bucket"];
    storage_path: string;
    upload_status: "PENDING";
  };
  error?: RpcError;
};

type CompleteRpcResponse = {
  success: boolean;
  data?: {
    attachment_id: string;
    upload_status: OccurrenceAttachmentUploadStatus;
  };
  error?: RpcError;
};

type AttachmentRow = {
  id: string;
  occurrence_id: string;
  organization_id: string;
  attachment_type: string;
  original_file_name: string;
  mime_type: string;
  file_size: number;
  caption: string | null;
  upload_status: string;
  created_at: string;
  profiles: { full_name: string | null } | { full_name: string | null }[] | null;
};

function toPrepareRpcPayload(input: PrepareAttachmentUploadInput) {
  return {
    occurrence_id: input.occurrenceId,
    attachment_type: input.attachmentType,
    original_file_name: input.originalFileName,
    mime_type: input.mimeType,
    file_size: input.fileSize,
    caption: input.caption ?? null,
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
    captured_at: input.capturedAt ?? null,
  };
}

function parseRpcError(response: { error?: RpcError }, fallback: string): Error {
  return new Error(response.error?.message ?? fallback);
}

export async function prepareAttachmentUpload(input: PrepareAttachmentUploadInput) {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.rpc("prepare_occurrence_attachment_upload", {
    payload: toPrepareRpcPayload(input),
  });

  if (error) {
    throw new Error("Não foi possível preparar o upload da evidência.");
  }

  const response = data as PrepareRpcResponse;

  if (!response.success || !response.data) {
    throw parseRpcError(response, "Não foi possível preparar o upload da evidência.");
  }

  return {
    attachmentId: response.data.attachment_id,
    bucket: response.data.bucket,
    storagePath: response.data.storage_path,
    uploadStatus: response.data.upload_status,
  } satisfies PrepareOccurrenceAttachmentUploadResult;
}

export async function uploadAttachmentToStorage(params: {
  bucket: string;
  storagePath: string;
  uri: string;
  mimeType: string;
}) {
  const supabase = getSupabaseClient();
  const fileResponse = await fetch(params.uri);

  if (!fileResponse.ok) {
    throw new Error("Não foi possível ler o arquivo local.");
  }

  const body = await fileResponse.arrayBuffer();

  const { error } = await supabase.storage.from(params.bucket).upload(params.storagePath, body, {
    contentType: params.mimeType,
    upsert: false,
  });

  if (error) {
    throw new Error("Falha no envio da evidência.");
  }
}

export async function completeAttachmentUpload(attachmentId: string) {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.rpc("complete_occurrence_attachment_upload", {
    target_attachment_id: attachmentId,
  });

  if (error) {
    throw new Error("Não foi possível concluir o upload da evidência.");
  }

  const response = data as CompleteRpcResponse;

  if (!response.success || !response.data) {
    throw parseRpcError(response, "Não foi possível concluir o upload da evidência.");
  }

  return response.data;
}

export async function failAttachmentUpload(attachmentId: string, failureReason?: string) {
  const supabase = getSupabaseClient();

  await supabase.rpc("fail_occurrence_attachment_upload", {
    target_attachment_id: attachmentId,
    failure_reason: failureReason ?? null,
  });
}

export async function getOccurrenceEvidence(occurrenceId: string): Promise<EvidenceListItem[]> {
  const supabase = getSupabaseClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Não autenticado.");
  }

  const { data, error } = await supabase
    .from("occurrence_attachments")
    .select(
      "id, occurrence_id, organization_id, attachment_type, original_file_name, mime_type, file_size, caption, upload_status, created_at, profiles:uploaded_by(full_name)",
    )
    .eq("occurrence_id", occurrenceId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error("Não foi possível carregar as evidências.");
  }

  return (data as AttachmentRow[])
    .map((row) => mapOccurrenceAttachmentRow(row))
    .filter((item): item is EvidenceListItem => item !== null);
}
