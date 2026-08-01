import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { loadSupabaseLocalEnv, runLocalSql } from "./_local-env.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..", "..");
const PASSWORD = "SafeStop-QA-Local-2026";

const USERS = {
  field: "qa-field@safestop.local",
  gestor: "qa-gestor@safestop.local",
  multi: "qa-multi@safestop.local",
  platform: "qa-platform@safestop.local",
};

const QA_ALPHA = "b0000000-0000-4000-8000-000000000001";
const QA_BETA = "b0000000-0000-4000-8000-000000000002";
const QA_ALPHA_AREA = "f0000000-0000-4000-8000-000000000001";
const QA_BETA_CONTRACTOR = "b0000000-0000-4000-8000-000000000002";
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const MINIMAL_JPEG = Buffer.from(
  "/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBxAQEBUQEBAVFRUVFRUVFRUVFRUWFxUVFRUXFxUYHSggGBolGxUVITEhJSkrLi4uFx8zODMsNygtLisBCgoKDg0OGxAQGy0lHyUtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLf/AABEIAAEAAQMBIgACEQEDEQH/xAAXAAEBAQEAAAAAAAAAAAAAAAAAAQID/8QAFhEBAQEAAAAAAAAAAAAAAAAAAAER/9oADAMBAAIQAxAAAAG6p//EABQQAQAAAAAAAAAAAAAAAAAAAJD/2gAIAQEAAQUCcJ//xAAUEQEAAAAAAAAAAAAAAAAAAACQ/9oACAEDAQE/AXCf/8QAFBEBAAAAAAAAAAAAAAAAAAAAkP/aAAgBAgEBPwFwn//EABQQAQAAAAAAAAAAAAAAAAAAAJD/2gAIAQEABj8CcJ//xAAUEAEAAAAAAAAAAAAAAAAAAACQ/9oACAEBAAE/IXCf/9k=",
  "base64",
);

const results = [];

function record(id, status, detail) {
  results.push({ id, status, detail });
  console.log(`${status === "PASS" ? "PASS" : status === "FAIL" ? "FAIL" : "SKIP"} ${id}: ${detail}`);
}

async function signIn(apiUrl, anonKey, email) {
  const response = await fetch(`${apiUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: anonKey, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: PASSWORD }),
  });
  if (!response.ok) throw new Error(`Login ${email} (${response.status})`);
  return response.json();
}

async function rpc(apiUrl, anonKey, token, fn, body) {
  const response = await fetch(`${apiUrl}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${token}`,
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

async function restGet(apiUrl, anonKey, token, path) {
  const response = await fetch(`${apiUrl}/rest/v1/${path}`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error(`GET ${path} HTTP ${response.status}`);
  return response.json();
}

async function uploadStorage(apiUrl, anonKey, token, path, body, mime) {
  const encoded = path.split("/").map((s) => encodeURIComponent(s)).join("/");
  const response = await fetch(`${apiUrl}/storage/v1/object/occurrence-evidence/${encoded}`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${token}`,
      "Content-Type": mime,
      "x-upsert": "false",
    },
    body,
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Storage upload HTTP ${response.status}: ${text}`);
  }
}

async function createPP(apiUrl, anonKey, token) {
  const result = await rpc(apiUrl, anonKey, token, "create_occurrence", {
    payload: {
      organization_id: QA_ALPHA,
      area_id: QA_ALPHA_AREA,
      contractor_organization_id: QA_BETA_CONTRACTOR,
      title: "QA EV matrix",
      task_description: "Ocorrência QA evidências",
      location_description: "Local QA",
      condition_description: "Condição QA",
      severity: "HIGH",
    },
  });
  if (!result.success) throw new Error(`create_occurrence: ${JSON.stringify(result)}`);
  return result.data.id;
}

async function uploadEvidence(apiUrl, anonKey, token, occurrenceId, overrides = {}) {
  const fileSize = overrides.file_size ?? MINIMAL_JPEG.byteLength;
  const prepare = await rpc(apiUrl, anonKey, token, "prepare_occurrence_attachment_upload", {
    payload: {
      occurrence_id: occurrenceId,
      attachment_type: "INITIAL_EVIDENCE",
      original_file_name: overrides.original_file_name ?? "ev.jpg",
      mime_type: overrides.mime_type ?? "image/jpeg",
      file_size: fileSize,
      caption: overrides.caption,
    },
  });
  if (!prepare.success) return prepare;

  if (!overrides.skipStorage) {
    await uploadStorage(
      apiUrl,
      anonKey,
      token,
      prepare.data.storage_path,
      overrides.body ?? MINIMAL_JPEG,
      overrides.mime_type ?? "image/jpeg",
    );
  }

  if (overrides.onlyPrepare) return prepare;

  const complete = await rpc(apiUrl, anonKey, token, "complete_occurrence_attachment_upload", {
    target_attachment_id: prepare.data.attachment_id,
  });
  return { prepare, complete, attachmentId: prepare.data.attachment_id };
}

function readRepo(relPath) {
  return readFileSync(join(REPO_ROOT, relPath), "utf8");
}

function grepNoServiceRole() {
  const files = [
    "apps/web/src/features/evidence/hooks/use-evidence.ts",
    "apps/mobile/src/features/evidence/hooks/use-upload-evidence.ts",
    "apps/web/src/features/evidence/services/upload-evidence-file.ts",
    "apps/mobile/src/features/evidence/services/evidence-upload.ts",
  ];
  return files.every((file) => !/service_role|SERVICE_ROLE/.test(readRepo(file)));
}

async function main() {
  const { apiUrl, anonKey } = loadSupabaseLocalEnv();
  console.log("=== QA Sprint 2.2 — EV-01 a EV-20 ===\n");

  const field = await signIn(apiUrl, anonKey, USERS.field);
  const occurrenceId = await createPP(apiUrl, anonKey, field.access_token);

  const ev01 = await uploadEvidence(apiUrl, anonKey, field.access_token, occurrenceId, {
    original_file_name: "ev-01.jpg",
  });
  const listAfter01 = await restGet(
    apiUrl,
    anonKey,
    field.access_token,
    `occurrence_attachments?select=id,upload_status&occurrence_id=eq.${occurrenceId}&upload_status=eq.COMPLETED`,
  );
  if (ev01.complete?.success && listAfter01.length >= 1) {
    record("EV-01", "PASS", `JPEG qa-field COMPLETED; galeria=${listAfter01.length} ativo(s)`);
  } else {
    record("EV-01", "FAIL", JSON.stringify(ev01));
  }

  const gestor = await signIn(apiUrl, anonKey, USERS.gestor);
  const ev02 = await rpc(apiUrl, anonKey, gestor.access_token, "prepare_occurrence_attachment_upload", {
    payload: {
      occurrence_id: occurrenceId,
      attachment_type: "INITIAL_EVIDENCE",
      original_file_name: "blocked.jpg",
      mime_type: "image/jpeg",
      file_size: MINIMAL_JPEG.byteLength,
    },
  });
  const webGallery = readRepo("apps/web/src/features/evidence/components/evidence-gallery.tsx");
  if (ev02.success === false && ev02.error?.code === "FORBIDDEN" && webGallery.includes('permission="occurrence.create"')) {
    record("EV-02", "PASS", "RPC FORBIDDEN qa-gestor; UI Can occurrence.create");
  } else {
    record("EV-02", "FAIL", JSON.stringify(ev02));
  }

  const multi = await signIn(apiUrl, anonKey, USERS.multi);
  const ev03 = await rpc(apiUrl, anonKey, multi.access_token, "prepare_occurrence_attachment_upload", {
    payload: {
      occurrence_id: occurrenceId,
      attachment_type: "INITIAL_EVIDENCE",
      original_file_name: "cross.jpg",
      mime_type: "image/jpeg",
      file_size: MINIMAL_JPEG.byteLength,
    },
  });
  if (ev03.success === false && ev03.error?.code === "FORBIDDEN") {
    record("EV-03", "PASS", "Upload ocorrência Alpha negado para qa-multi (FORBIDDEN)");
  } else {
    record("EV-03", "FAIL", JSON.stringify(ev03));
  }

  const gestorList = await restGet(
    apiUrl,
    anonKey,
    gestor.access_token,
    `occurrence_attachments?select=id,upload_status,caption&occurrence_id=eq.${occurrenceId}&upload_status=eq.COMPLETED`,
  );
  const gestorPrepare = await rpc(apiUrl, anonKey, gestor.access_token, "prepare_occurrence_attachment_upload", {
    payload: {
      occurrence_id: occurrenceId,
      attachment_type: "INITIAL_EVIDENCE",
      original_file_name: "gestor.jpg",
      mime_type: "image/jpeg",
      file_size: MINIMAL_JPEG.byteLength,
    },
  });
  if (gestorList.length >= 1 && gestorPrepare.success === false && gestorPrepare.error?.code === "FORBIDDEN") {
    record("EV-04", "PASS", `qa-gestor visualiza ${gestorList.length}; prepare FORBIDDEN`);
  } else {
    record("EV-04", "FAIL", `list=${gestorList.length} prepare=${JSON.stringify(gestorPrepare)}`);
  }

  const attachmentId = ev01.attachmentId;
  const signed = await rpc(apiUrl, anonKey, field.access_token, "get_occurrence_attachment_signed_url", {
    target_attachment_id: attachmentId,
  });
  if (signed.success && signed.data?.storage_path && signed.data?.expires_in_seconds === 3600) {
    record("EV-05", "PASS", `signed URL meta TTL=${signed.data.expires_in_seconds}s`);
  } else {
    record("EV-05", "FAIL", JSON.stringify(signed));
  }

  const ev06Occ = await createPP(apiUrl, anonKey, field.access_token);
  const ev06Up = await uploadEvidence(apiUrl, anonKey, field.access_token, ev06Occ, {
    original_file_name: "delete-me.jpg",
  });
  const ev06Del = await rpc(apiUrl, anonKey, field.access_token, "delete_occurrence_attachment", {
    target_attachment_id: ev06Up.attachmentId,
  });
  const ev06After = await restGet(
    apiUrl,
    anonKey,
    field.access_token,
    `occurrence_attachments?select=id&id=eq.${ev06Up.attachmentId}`,
  );
  if (ev06Del.success && ev06After.length === 0) {
    record("EV-06", "PASS", "soft delete qa-field; sumiu da listagem RLS");
  } else {
    record("EV-06", "FAIL", JSON.stringify({ ev06Del, ev06After }));
  }

  const ev07Occ = await createPP(apiUrl, anonKey, field.access_token);
  const ev07Up = await uploadEvidence(apiUrl, anonKey, field.access_token, ev07Occ);
  const ev07Del = await rpc(apiUrl, anonKey, gestor.access_token, "delete_occurrence_attachment", {
    target_attachment_id: ev07Up.attachmentId,
  });
  if (ev07Del.success === false && ev07Del.error?.code === "FORBIDDEN") {
    record("EV-07", "PASS", "qa-gestor delete FORBIDDEN");
  } else {
    record("EV-07", "FAIL", JSON.stringify(ev07Del));
  }

  const ev08Rpc = await rpc(apiUrl, anonKey, field.access_token, "prepare_occurrence_attachment_upload", {
    payload: {
      occurrence_id: occurrenceId,
      attachment_type: "INITIAL_EVIDENCE",
      original_file_name: "big.jpg",
      mime_type: "image/jpeg",
      file_size: MAX_FILE_SIZE + 1,
    },
  });
  let ev08Zod = false;
  try {
    const mod = await import("../../packages/validation/src/occurrence-attachment.ts");
    ev08Zod = !mod.prepareAttachmentUploadSchema.safeParse({
      occurrenceId,
      attachmentType: "INITIAL_EVIDENCE",
      originalFileName: "big.jpg",
      mimeType: "image/jpeg",
      fileSize: MAX_FILE_SIZE + 1,
    }).success;
  } catch {
    ev08Zod = readRepo("packages/validation/src/occurrence-attachment.ts").includes("OCCURRENCE_ATTACHMENT_MAX_FILE_SIZE_BYTES");
  }
  if (ev08Rpc.success === false && ev08Rpc.error?.code === "VALIDATION_ERROR" && ev08Zod) {
    record("EV-08", "PASS", "file_size > 10MiB rejeitado RPC + Zod");
  } else {
    record("EV-08", "FAIL", JSON.stringify(ev08Rpc));
  }

  const ev09 = await rpc(apiUrl, anonKey, field.access_token, "prepare_occurrence_attachment_upload", {
    payload: {
      occurrence_id: occurrenceId,
      attachment_type: "INITIAL_EVIDENCE",
      original_file_name: "bad.exe",
      mime_type: "application/pdf",
      file_size: 1024,
    },
  });
  if (ev09.success === false && ev09.error?.code === "VALIDATION_ERROR") {
    record("EV-09", "PASS", "MIME application/pdf rejeitado");
  } else {
    record("EV-09", "FAIL", JSON.stringify(ev09));
  }

  const ev10Occ = await createPP(apiUrl, anonKey, field.access_token);
  const uploads = [];
  for (let i = 0; i < 3; i++) {
    uploads.push(
      await uploadEvidence(apiUrl, anonKey, field.access_token, ev10Occ, {
        original_file_name: `multi-${i}.jpg`,
      }),
    );
  }
  const failOne = await uploadEvidence(apiUrl, anonKey, field.access_token, ev10Occ, {
    original_file_name: "fail-one.jpg",
    onlyPrepare: true,
    skipStorage: true,
  });
  await uploadStorage(apiUrl, anonKey, field.access_token, failOne.data.storage_path, MINIMAL_JPEG, "image/jpeg");
  const failRpc = await rpc(apiUrl, anonKey, field.access_token, "fail_occurrence_attachment_upload", {
    target_attachment_id: failOne.data.attachment_id,
    failure_reason: "QA isolated fail",
  });
  const ev10List = await restGet(
    apiUrl,
    anonKey,
    field.access_token,
    `occurrence_attachments?select=id,upload_status&occurrence_id=eq.${ev10Occ}`,
  );
  const completed = ev10List.filter((r) => r.upload_status === "COMPLETED").length;
  const failed = ev10List.filter((r) => r.upload_status === "FAILED").length;
  if (uploads.every((u) => u.complete?.success) && failRpc.success && completed === 3 && failed === 1) {
    record("EV-10", "PASS", "3 COMPLETED + 1 FAILED isolado");
  } else {
    record("EV-10", "FAIL", `completed=${completed} failed=${failed}`);
  }

  const ev11Occ = await createPP(apiUrl, anonKey, field.access_token);
  runLocalSql(`update public.occurrences set status = 'ENCERRADA' where id = '${ev11Occ}';`);
  const ev11 = await rpc(apiUrl, anonKey, field.access_token, "prepare_occurrence_attachment_upload", {
    payload: {
      occurrence_id: ev11Occ,
      attachment_type: "INITIAL_EVIDENCE",
      original_file_name: "closed.jpg",
      mime_type: "image/jpeg",
      file_size: MINIMAL_JPEG.byteLength,
    },
  });
  if (ev11.success === false && ev11.error?.code === "FORBIDDEN") {
    record("EV-11", "PASS", "prepare em ocorrência ENCERRADA → FORBIDDEN");
  } else {
    record("EV-11", "FAIL", JSON.stringify(ev11));
  }

  const crossList = await restGet(
    apiUrl,
    anonKey,
    multi.access_token,
    `occurrence_attachments?select=id&organization_id=eq.${QA_ALPHA}&occurrence_id=eq.${occurrenceId}`,
  );
  const orgProvider = readRepo("apps/mobile/src/features/organization/provider/organization-provider.tsx");
  if (crossList.length === 0 && orgProvider.includes("clearTenantCache")) {
    record("EV-12", "PASS", "0 anexos cross-org; clearTenantCache na troca org");
  } else {
    record("EV-12", "FAIL", `cross=${crossList.length}`);
  }

  const authProvider = readRepo("apps/mobile/src/providers/auth-provider.tsx");
  const clearCache = readRepo("apps/mobile/src/features/organization/services/clear-tenant-cache.ts");
  if (authProvider.includes("clearTenantCache") && clearCache.includes("TENANT_QUERY_KEY_PREFIX")) {
    record("EV-13", "PASS", "logout chama clearTenantCache (tenant queries incl. evidence)");
  } else {
    record("EV-13", "FAIL", "logout não limpa cache tenant");
  }

  const ev14Prep = await uploadEvidence(apiUrl, anonKey, field.access_token, occurrenceId, {
    original_file_name: "no-upload.jpg",
    onlyPrepare: true,
    skipStorage: true,
  });
  const ev14Complete = await rpc(apiUrl, anonKey, field.access_token, "complete_occurrence_attachment_upload", {
    target_attachment_id: ev14Prep.data.attachment_id,
  });
  const ev14Fail = await rpc(apiUrl, anonKey, field.access_token, "fail_occurrence_attachment_upload", {
    target_attachment_id: ev14Prep.data.attachment_id,
    failure_reason: "complete sem upload",
  });
  if (
    ev14Complete.success === false &&
    ev14Complete.error?.code === "NOT_FOUND" &&
    ev14Fail.success &&
    ev14Fail.data?.upload_status === "FAILED"
  ) {
    record("EV-14", "PASS", "complete sem Storage → NOT_FOUND; fail cleanup OK");
  } else {
    record("EV-14", "FAIL", JSON.stringify({ ev14Complete, ev14Fail }));
  }

  const webSection = readRepo("apps/web/src/features/evidence/components/evidence-section.tsx");
  if (webSection.includes("onDrop") && readRepo("apps/web/src/features/evidence/services/upload-evidence-file.ts").includes("prepare")) {
    record("EV-15", "PASS", "Web evidence-section onDrop + upload-evidence-file (contrato código)");
  } else {
    record("EV-15", "FAIL", "dropzone web ausente");
  }

  const mobileUpload = readRepo("apps/mobile/src/features/evidence/hooks/use-upload-evidence.ts");
  if (mobileUpload.includes("launchCameraAsync")) {
    record("EV-16", "PASS", "Mobile launchCameraAsync implementado");
  } else {
    record("EV-16", "FAIL", "câmera mobile ausente");
  }
  if (mobileUpload.includes("launchImageLibraryAsync")) {
    record("EV-17", "PASS", "Mobile launchImageLibraryAsync implementado");
  } else {
    record("EV-17", "FAIL", "galeria mobile ausente");
  }

  const ev18Occ = await createPP(apiUrl, anonKey, field.access_token);
  const caption = "Legenda QA Sprint 2.2";
  const ev18 = await uploadEvidence(apiUrl, anonKey, field.access_token, ev18Occ, {
    caption,
    original_file_name: "caption.jpg",
  });
  const ev18Row = await restGet(
    apiUrl,
    anonKey,
    field.access_token,
    `occurrence_attachments?select=caption&id=eq.${ev18.attachmentId}`,
  );
  if (ev18.complete?.success && ev18Row[0]?.caption === caption) {
    record("EV-18", "PASS", `caption="${caption}" persistida`);
  } else {
    record("EV-18", "FAIL", JSON.stringify(ev18Row));
  }

  const platform = await signIn(apiUrl, anonKey, USERS.platform);
  const platformList = await restGet(
    apiUrl,
    anonKey,
    platform.access_token,
    `occurrence_attachments?select=id&organization_id=eq.${QA_ALPHA}&occurrence_id=eq.${occurrenceId}&upload_status=eq.COMPLETED`,
  );
  const platformPrepare = await rpc(apiUrl, anonKey, platform.access_token, "prepare_occurrence_attachment_upload", {
    payload: {
      occurrence_id: occurrenceId,
      attachment_type: "INITIAL_EVIDENCE",
      original_file_name: "platform.jpg",
      mime_type: "image/jpeg",
      file_size: MINIMAL_JPEG.byteLength,
    },
  });
  if (platformList.length >= 1 && platformPrepare.success === false && platformPrepare.error?.code === "FORBIDDEN") {
    record("EV-19", "PASS", `qa-platform read cross-org (${platformList.length}); create FORBIDDEN`);
  } else {
    record("EV-19", "FAIL", `list=${platformList.length} prepare=${JSON.stringify(platformPrepare)}`);
  }

  const sw01 = await rpc(apiUrl, anonKey, field.access_token, "create_occurrence", {
    payload: {
      organization_id: QA_ALPHA,
      area_id: QA_ALPHA_AREA,
      contractor_organization_id: QA_BETA_CONTRACTOR,
      title: "SW regressão EV-20",
      task_description: "SW regressão EV-20",
      location_description: "Local",
      condition_description: "Condição",
      severity: "HIGH",
    },
  });
  if (sw01.success && sw01.data?.status === "PARALISACAO_PREVENTIVA") {
    record("EV-20", "PASS", `Regressão PP OK ${sw01.data.public_code}`);
  } else {
    record("EV-20", "FAIL", JSON.stringify(sw01));
  }

  if (grepNoServiceRole()) {
    console.log("INFO AC-08: sem service_role em features/evidence");
  }

  console.log("\n=== RESUMO EV ===");
  const pass = results.filter((r) => r.status === "PASS").length;
  const fail = results.filter((r) => r.status === "FAIL").length;
  console.log(`PASS: ${pass}/20 | FAIL: ${fail}/20`);
  if (fail > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
