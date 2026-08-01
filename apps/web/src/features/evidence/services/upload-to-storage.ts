import { createClient } from "@/lib/auth/client";
import { getSupabaseEnv } from "@/lib/auth/env";

export async function uploadToStorageWithProgress(params: {
  bucket: string;
  storagePath: string;
  body: Blob;
  mimeType: string;
  onProgress?: (percent: number) => void;
}): Promise<void> {
  const supabase = createClient();
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.access_token) {
    throw new Error("Sessão expirada. Faça login novamente.");
  }

  const { url, publishableKey } = getSupabaseEnv();
  const encodedPath = params.storagePath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (event) => {
      if (!event.lengthComputable || !params.onProgress) {
        return;
      }

      const percent = Math.round((event.loaded / event.total) * 100);
      params.onProgress(percent);
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
        return;
      }

      reject(new Error("Falha no envio da evidência."));
    });

    xhr.addEventListener("error", () => {
      reject(new Error("Falha no envio da evidência."));
    });

    xhr.open("POST", `${url}/storage/v1/object/${params.bucket}/${encodedPath}`);
    xhr.setRequestHeader("apikey", publishableKey);
    xhr.setRequestHeader("Authorization", `Bearer ${session.access_token}`);
    xhr.setRequestHeader("Content-Type", params.mimeType);
    xhr.setRequestHeader("x-upsert", "false");
    xhr.send(params.body);
  });
}
