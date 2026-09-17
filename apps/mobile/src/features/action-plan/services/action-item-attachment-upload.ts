import type { ActionItemAttachmentMimeType } from "@safestop/types";

import { getSupabaseClient } from "@/lib/auth/client";
import { readLocalFileBody } from "@/features/evidence/utils/read-local-file-body";

import { assertActionPlanRpcDataOrThrow } from "../utils/action-plan-rpc";

type PrepareRpcResponse = {
  attachment_id: string;
  bucket: string;
  storage_path: string;
  upload_status: "PENDING";
};

export async function prepareActionItemAttachmentUpload(input: {
  actionItemId: string;
  originalFileName: string;
  mimeType: ActionItemAttachmentMimeType;
  fileSize: number;
  caption?: string;
}) {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.rpc("prepare_action_item_attachment_upload", {
    payload: {
      action_item_id: input.actionItemId,
      original_file_name: input.originalFileName,
      mime_type: input.mimeType,
      file_size: input.fileSize,
      caption: input.caption ?? null,
    },
  });

  if (error) {
    throw new Error("Não foi possível preparar o upload da evidência.");
  }

  const result = assertActionPlanRpcDataOrThrow<PrepareRpcResponse>(
    data,
    "Não foi possível preparar o upload da evidência.",
  );

  return {
    attachmentId: result.attachment_id,
    bucket: result.bucket,
    storagePath: result.storage_path,
    uploadStatus: result.upload_status,
  };
}

export async function uploadActionItemAttachmentToStorage(params: {
  bucket: string;
  storagePath: string;
  uri: string;
  mimeType: string;
}) {
  const supabase = getSupabaseClient();
  const body = await readLocalFileBody(params.uri);

  const { error } = await supabase.storage.from(params.bucket).upload(params.storagePath, body, {
    contentType: params.mimeType,
    upsert: false,
  });

  if (error) {
    throw new Error("Falha no envio da evidência.");
  }
}

export async function completeActionItemAttachmentUpload(attachmentId: string) {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.rpc("complete_action_item_attachment_upload", {
    target_attachment_id: attachmentId,
  });

  if (error) {
    throw new Error("Não foi possível concluir o upload da evidência.");
  }

  assertActionPlanRpcDataOrThrow(data, "Não foi possível concluir o upload da evidência.");
}

export async function failActionItemAttachmentUpload(attachmentId: string, failureReason?: string) {
  const supabase = getSupabaseClient();

  await supabase.rpc("fail_action_item_attachment_upload", {
    target_attachment_id: attachmentId,
    failure_reason: failureReason ?? null,
  });
}
