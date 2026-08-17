import { createClient } from "@/lib/auth/client";
import { assertRpcSuccess } from "@/features/occurrences/utils/rpc-error";

type RpcSignedUrlMeta = {
  attachment_id: string;
  bucket: "occurrence-evidence";
  storage_path: string;
  expires_in_seconds: number;
  signed_url: string | null;
};

export async function getActionItemAttachmentSignedUrl(attachmentId: string): Promise<string> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("get_action_item_attachment_signed_url", {
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

  return signedData.signedUrl;
}
