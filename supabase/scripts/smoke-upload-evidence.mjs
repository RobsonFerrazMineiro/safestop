import { loadQaCredentials, loadSupabaseLocalEnv } from "./_local-env.mjs";

const QA_ALPHA_ORG_ID = "b0000000-0000-4000-8000-000000000001";
const QA_ALPHA_AREA_ID = "f0000000-0000-4000-8000-000000000001";
const QA_ALPHA_CONTRACTOR_ID = "b0000000-0000-4000-8000-000000000002";
const SIGNED_URL_TTL_SECONDS = 3600;

/** JPEG mínimo válido (~631 bytes) */
const MINIMAL_JPEG = Buffer.from(
  "/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBxAQEBUQEBAVFRUVFRUVFRUVFRUWFxUVFRUXFxUYHSggGBolGxUVITEhJSkrLi4uFx8zODMsNygtLisBCgoKDg0OGxAQGy0lHyUtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLf/AABEIAAEAAQMBIgACEQEDEQH/xAAXAAEBAQEAAAAAAAAAAAAAAAAAAQID/8QAFhEBAQEAAAAAAAAAAAAAAAAAAAER/9oADAMBAAIQAxAAAAG6p//EABQQAQAAAAAAAAAAAAAAAAAAAJD/2gAIAQEAAQUCcJ//xAAUEQEAAAAAAAAAAAAAAAAAAACQ/9oACAEDAQE/AXCf/8QAFBEBAAAAAAAAAAAAAAAAAAAAkP/aAAgBAgEBPwFwn//EABQQAQAAAAAAAAAAAAAAAAAAAJD/2gAIAQEABj8CcJ//xAAUEAEAAAAAAAAAAAAAAAAAAACQ/9oACAEBAAE/IXCf/9k=",
  "base64",
);

async function signInWithPassword(apiUrl, anonKey, email, password) {
  const response = await fetch(`${apiUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`signInWithPassword falhou (${response.status}): ${body}`);
  }

  return response.json();
}

async function rpc(apiUrl, anonKey, accessToken, fn, body) {
  const response = await fetch(`${apiUrl}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`RPC ${fn} HTTP ${response.status}: ${text}`);
  }

  return response.json();
}

async function restSelect(apiUrl, anonKey, accessToken, path) {
  const response = await fetch(`${apiUrl}/rest/v1/${path}`, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`SELECT falhou (${response.status}): ${text}`);
  }

  return response.json();
}

async function uploadToStorage(apiUrl, anonKey, accessToken, bucket, storagePath, body, mimeType) {
  const encodedPath = storagePath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  const response = await fetch(`${apiUrl}/storage/v1/object/${bucket}/${encodedPath}`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": mimeType,
      "x-upsert": "false",
    },
    body,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Storage upload falhou (${response.status}): ${text}`);
  }
}

async function createStorageSignedUrl(apiUrl, anonKey, accessToken, bucket, storagePath, expiresIn) {
  const encodedPath = storagePath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  const response = await fetch(`${apiUrl}/storage/v1/object/sign/${bucket}/${encodedPath}`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ expiresIn }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Storage sign falhou (${response.status}): ${text}`);
  }

  const payload = await response.json();
  const signedPath = payload.signedURL ?? payload.signedUrl;

  if (!signedPath) {
    throw new Error(`Resposta de sign inválida: ${JSON.stringify(payload)}`);
  }

  if (signedPath.startsWith("http")) {
    return signedPath;
  }

  return `${apiUrl}/storage/v1${signedPath.startsWith("/") ? signedPath : `/${signedPath}`}`;
}

function buildPreventiveStopPayload() {
  return {
    organization_id: QA_ALPHA_ORG_ID,
    area_id: QA_ALPHA_AREA_ID,
    contractor_organization_id: QA_ALPHA_CONTRACTOR_ID,
    title: "QA upload evidência",
    task_description: "Ocorrência para smoke upload evidência",
    location_description: "Local QA",
    condition_description: "Condição QA",
    severity: "HIGH",
  };
}

async function main() {
  const credentials = loadQaCredentials();
  const { apiUrl, anonKey } = loadSupabaseLocalEnv();

  console.log("1) Autenticação qa-field...");
  const session = await signInWithPassword(apiUrl, anonKey, credentials.email, credentials.password);

  console.log("2) create_occurrence...");
  const createResult = await rpc(apiUrl, anonKey, session.access_token, "create_occurrence", {
    payload: buildPreventiveStopPayload(),
  });

  if (!createResult.success) {
    throw new Error(`create_occurrence falhou: ${JSON.stringify(createResult)}`);
  }

  const occurrenceId = createResult.data.id;
  console.log(`   OK — occurrence_id=${occurrenceId}`);

  console.log("3) prepare_occurrence_attachment_upload → PENDING...");
  const fileSize = MINIMAL_JPEG.byteLength;
  const prepareResult = await rpc(
    apiUrl,
    anonKey,
    session.access_token,
    "prepare_occurrence_attachment_upload",
    {
      payload: {
        occurrence_id: occurrenceId,
        attachment_type: "INITIAL_EVIDENCE",
        original_file_name: "evidencia-smoke.jpg",
        mime_type: "image/jpeg",
        file_size: fileSize,
        caption: "Smoke upload evidência",
      },
    },
  );

  if (!prepareResult.success || prepareResult.data?.upload_status !== "PENDING") {
    throw new Error(`prepare falhou: ${JSON.stringify(prepareResult)}`);
  }

  const attachmentId = prepareResult.data.attachment_id;
  const storagePath = prepareResult.data.storage_path;
  console.log(`   OK — attachment_id=${attachmentId}`);

  console.log("4) Upload Storage (binário)...");
  await uploadToStorage(
    apiUrl,
    anonKey,
    session.access_token,
    "occurrence-evidence",
    storagePath,
    MINIMAL_JPEG,
    "image/jpeg",
  );
  console.log("   OK — objeto enviado");

  console.log("5) complete_occurrence_attachment_upload → COMPLETED...");
  const completeResult = await rpc(
    apiUrl,
    anonKey,
    session.access_token,
    "complete_occurrence_attachment_upload",
    { target_attachment_id: attachmentId },
  );

  if (!completeResult.success || completeResult.data?.upload_status !== "COMPLETED") {
    throw new Error(`complete falhou: ${JSON.stringify(completeResult)}`);
  }

  const rows = await restSelect(
    apiUrl,
    anonKey,
    session.access_token,
    `occurrence_attachments?select=id,upload_status,attachment_type&occurrence_id=eq.${occurrenceId}&id=eq.${attachmentId}`,
  );

  if (rows.length !== 1 || rows[0].upload_status !== "COMPLETED") {
    throw new Error(`SELECT pós-complete inválido: ${JSON.stringify(rows)}`);
  }

  console.log("   OK — COMPLETED via RPC + SELECT RLS");

  console.log("6) get_occurrence_attachment_signed_url (TTL centralizado)...");
  const signedMeta = await rpc(
    apiUrl,
    anonKey,
    session.access_token,
    "get_occurrence_attachment_signed_url",
    { target_attachment_id: attachmentId },
  );

  if (!signedMeta.success) {
    throw new Error(`get_signed_url falhou: ${JSON.stringify(signedMeta)}`);
  }

  if (signedMeta.data.expires_in_seconds !== SIGNED_URL_TTL_SECONDS) {
    throw new Error(
      `TTL esperado ${SIGNED_URL_TTL_SECONDS}, recebido ${signedMeta.data.expires_in_seconds}`,
    );
  }

  const signedUrl = await createStorageSignedUrl(
    apiUrl,
    anonKey,
    session.access_token,
    signedMeta.data.bucket,
    signedMeta.data.storage_path,
    signedMeta.data.expires_in_seconds,
  );

  const downloadResponse = await fetch(signedUrl);
  if (!downloadResponse.ok) {
    throw new Error(`Download via signed URL falhou (${downloadResponse.status})`);
  }

  console.log(`   OK — TTL=${SIGNED_URL_TTL_SECONDS}s; download HTTP ${downloadResponse.status}`);

  console.log("7) fail_occurrence_attachment_upload (PENDING + cleanup)...");
  const failPrepare = await rpc(
    apiUrl,
    anonKey,
    session.access_token,
    "prepare_occurrence_attachment_upload",
    {
      payload: {
        occurrence_id: occurrenceId,
        attachment_type: "INITIAL_EVIDENCE",
        original_file_name: "evidencia-fail.jpg",
        mime_type: "image/jpeg",
        file_size: fileSize,
      },
    },
  );

  if (!failPrepare.success) {
    throw new Error(`prepare (fail) falhou: ${JSON.stringify(failPrepare)}`);
  }

  const failAttachmentId = failPrepare.data.attachment_id;
  await uploadToStorage(
    apiUrl,
    anonKey,
    session.access_token,
    "occurrence-evidence",
    failPrepare.data.storage_path,
    MINIMAL_JPEG,
    "image/jpeg",
  );

  const failResult = await rpc(
    apiUrl,
    anonKey,
    session.access_token,
    "fail_occurrence_attachment_upload",
    {
      target_attachment_id: failAttachmentId,
      failure_reason: "Smoke — upload abortado",
    },
  );

  if (!failResult.success || failResult.data?.upload_status !== "FAILED") {
    throw new Error(`fail falhou: ${JSON.stringify(failResult)}`);
  }

  console.log("   OK — FAILED + cleanup Storage");

  console.log("8) delete_occurrence_attachment (soft delete + Storage)...");
  const deleteResult = await rpc(
    apiUrl,
    anonKey,
    session.access_token,
    "delete_occurrence_attachment",
    { target_attachment_id: attachmentId },
  );

  if (!deleteResult.success) {
    throw new Error(`delete falhou: ${JSON.stringify(deleteResult)}`);
  }

  const deletedRows = await restSelect(
    apiUrl,
    anonKey,
    session.access_token,
    `occurrence_attachments?select=id,deleted_at&occurrence_id=eq.${occurrenceId}&id=eq.${attachmentId}`,
  );

  if (deletedRows.length !== 0) {
    throw new Error(`Anexo soft-deleted ainda visível via RLS: ${JSON.stringify(deletedRows)}`);
  }

  const completeBeforeDelete = await rpc(
    apiUrl,
    anonKey,
    session.access_token,
    "complete_occurrence_attachment_upload",
    { target_attachment_id: attachmentId },
  );

  if (completeBeforeDelete.success !== false || completeBeforeDelete.error?.code !== "NOT_FOUND") {
    throw new Error(
      `complete após delete deveria ser NOT_FOUND: ${JSON.stringify(completeBeforeDelete)}`,
    );
  }

  console.log("   OK — soft delete oculto na listagem RLS");

  console.log("9) Listagem SELECT ativa (sem RPC list)...");
  const listRows = await restSelect(
    apiUrl,
    anonKey,
    session.access_token,
    `occurrence_attachments?select=id,upload_status,attachment_type&occurrence_id=eq.${occurrenceId}&order=created_at.desc`,
  );

  const activeCompleted = listRows.filter((row) => row.upload_status === "COMPLETED");
  const activeFailed = listRows.filter((row) => row.id === failAttachmentId);

  if (activeCompleted.length !== 0) {
    throw new Error(`Esperado 0 COMPLETED ativos após delete: ${JSON.stringify(listRows)}`);
  }

  if (activeFailed.length !== 1 || activeFailed[0].upload_status !== "FAILED") {
    throw new Error(`Esperado 1 FAILED visível: ${JSON.stringify(listRows)}`);
  }

  console.log(`   OK — ${listRows.length} anexo(s) visível(is) via SELECT RLS`);

  console.log("\nSmoke upload evidência (Sprint 2.2) concluído com sucesso.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
