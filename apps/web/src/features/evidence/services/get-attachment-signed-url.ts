import type { OccurrenceAttachmentSignedUrlResult } from "@safestop/types";
import { OCCURRENCE_ATTACHMENT_SIGNED_URL_TTL_SECONDS } from "@safestop/types";

import { createClient } from "@/lib/auth/client";
import { assertRpcSuccess } from "@/features/occurrences/utils/rpc-error";

type RpcSignedUrlMeta = {
  attachment_id: string;
  bucket: "occurrence-evidence";
  storage_path: string;
  expires_in_seconds: number;
  expires_at: string;
  signed_url: string | null;
};

export async function getOccurrenceAttachmentSignedUrl(
  attachmentId: string,
): Promise<OccurrenceAttachmentSignedUrlResult & { signedUrl: string }> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("get_occurrence_attachment_signed_url", {
    target_attachment_id: attachmentId,
  });

  if (error) {
    throw new Error("Não foi possível autorizar o acesso à evidência.");
  }

  const meta = assertRpcSuccess<RpcSignedUrlMeta>(
    data,
    "Não foi possível autorizar o acesso à evidência.",
  );

  const { data: signedData, error: signedError } = await supabase.storage
    .from(meta.bucket)
    .createSignedUrl(meta.storage_path, meta.expires_in_seconds);

  if (signedError || !signedData?.signedUrl) {
    throw new Error("Não foi possível gerar a URL da evidência.");
  }

  return {
    attachmentId: meta.attachment_id,
    bucket: meta.bucket,
    storagePath: meta.storage_path,
    expiresInSeconds: OCCURRENCE_ATTACHMENT_SIGNED_URL_TTL_SECONDS,
    expiresAt: meta.expires_at,
    signedUrl: signedData.signedUrl,
  };
}
