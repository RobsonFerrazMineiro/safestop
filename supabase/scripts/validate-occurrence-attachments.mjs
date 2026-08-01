import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { loadSupabaseLocalEnv } from "./_local-env.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PASSWORD = "SafeStop-QA-Local-2026";

const QA_ALPHA_ORG_ID = "b0000000-0000-4000-8000-000000000001";
const QA_BETA_ORG_ID = "b0000000-0000-4000-8000-000000000002";
const QA_ALPHA_AREA_ID = "f0000000-0000-4000-8000-000000000001";
const QA_ALPHA_CONTRACTOR_ID = "b0000000-0000-4000-8000-000000000002";
const QA_FIELD_EMAIL = "qa-field@safestop.local";
const QA_MULTI_EMAIL = "qa-multi@safestop.local";

function loadPassword() {
  try {
    const raw = readFileSync(join(__dirname, "..", "qa-credentials.local"), "utf8");
    const match = raw.match(/^QA_TEST_USER_PASSWORD=(.+)$/m);
    if (match?.[1]) {
      return match[1].trim();
    }
  } catch {
    // fallback seed
  }
  return PASSWORD;
}

async function signIn(apiUrl, anonKey, email, password) {
  const response = await fetch(`${apiUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: anonKey, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) {
    throw new Error(`Login falhou (${response.status})`);
  }
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

async function rest(apiUrl, anonKey, token, path, options = {}) {
  const response = await fetch(`${apiUrl}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Prefer: options.prefer ?? "return=minimal",
      ...(options.headers ?? {}),
    },
  });
  return response;
}

async function main() {
  const password = loadPassword();
  const { apiUrl, anonKey } = loadSupabaseLocalEnv();

  console.log("=== Validação occurrence_attachments (Sprint 2.2) ===\n");

  const field = await signIn(apiUrl, anonKey, QA_FIELD_EMAIL, password);

  const createResult = await rpc(apiUrl, anonKey, field.access_token, "create_occurrence", {
    payload: {
      organization_id: QA_ALPHA_ORG_ID,
      area_id: QA_ALPHA_AREA_ID,
      contractor_organization_id: QA_ALPHA_CONTRACTOR_ID,
      title: "QA attachment validation",
      task_description: "Ocorrência para teste de evidências",
      location_description: "Local QA",
      condition_description: "Condição QA",
      severity: "HIGH",
    },
  });

  if (!createResult.success) {
    throw new Error(`create_occurrence falhou: ${JSON.stringify(createResult)}`);
  }

  const occurrenceId = createResult.data.id;
  console.log(`Ocorrência QA: ${occurrenceId}\n`);

  console.log("1) INSERT direto negado (RLS)...");
  const directInsert = await rest(
    apiUrl,
    anonKey,
    field.access_token,
    "occurrence_attachments",
    {
      method: "POST",
      body: JSON.stringify({
        organization_id: QA_ALPHA_ORG_ID,
        occurrence_id: occurrenceId,
        uploaded_by: field.user.id,
        attachment_type: "INITIAL_EVIDENCE",
        storage_bucket: "occurrence-evidence",
        storage_path: `${QA_ALPHA_ORG_ID}/${occurrenceId}/00000000-0000-4000-8000-000000000099/fake.jpg`,
        original_file_name: "fake.jpg",
        mime_type: "image/jpeg",
        file_size: 1024,
        upload_status: "PENDING",
      }),
    },
  );

  if (directInsert.status === 401 || directInsert.status === 403) {
    console.log(`   OK — HTTP ${directInsert.status}`);
  } else {
    const body = await directInsert.text();
    throw new Error(`Esperado 401/403 no INSERT direto, recebido ${directInsert.status}: ${body}`);
  }

  console.log("2) prepare_occurrence_attachment_upload → PENDING...");
  const prepareResult = await rpc(
    apiUrl,
    anonKey,
    field.access_token,
    "prepare_occurrence_attachment_upload",
    {
      payload: {
        occurrence_id: occurrenceId,
        attachment_type: "INITIAL_EVIDENCE",
        original_file_name: "evidencia-qa.jpg",
        mime_type: "image/jpeg",
        file_size: 2048,
        caption: "Fixture QA Sprint 2.2",
      },
    },
  );

  if (!prepareResult.success || prepareResult.data?.upload_status !== "PENDING") {
    throw new Error(`prepare falhou: ${JSON.stringify(prepareResult)}`);
  }

  const attachmentId = prepareResult.data.attachment_id;
  console.log(`   OK — attachment_id=${attachmentId} status=PENDING`);
  console.log(`   path=${prepareResult.data.storage_path}`);

  console.log("3) SELECT qa-field (mesma org)...");
  const ownSelect = await rest(
    apiUrl,
    anonKey,
    field.access_token,
    `occurrence_attachments?select=id,upload_status,attachment_type&id=eq.${attachmentId}`,
    { method: "GET", prefer: "return=representation" },
  );

  if (!ownSelect.ok) {
    throw new Error(`SELECT próprio falhou: ${await ownSelect.text()}`);
  }

  const ownRows = await ownSelect.json();
  if (ownRows.length !== 1 || ownRows[0].upload_status !== "PENDING") {
    throw new Error(`SELECT próprio inválido: ${JSON.stringify(ownRows)}`);
  }
  console.log("   OK — 1 linha PENDING visível");

  console.log("4) SELECT cross-org (qa-multi / Beta)...");
  const multi = await signIn(apiUrl, anonKey, QA_MULTI_EMAIL, password);
  const crossSelect = await rest(
    apiUrl,
    anonKey,
    multi.access_token,
    `occurrence_attachments?select=id&organization_id=eq.${QA_ALPHA_ORG_ID}&occurrence_id=eq.${occurrenceId}`,
    { method: "GET", prefer: "return=representation" },
  );

  if (!crossSelect.ok) {
    throw new Error(`SELECT cross-org falhou: ${await crossSelect.text()}`);
  }

  const crossRows = await crossSelect.json();
  if (crossRows.length !== 0) {
    throw new Error(`Cross-org leak: ${JSON.stringify(crossRows)}`);
  }
  console.log("   OK — 0 linhas (RLS + can_access_occurrence)");

  console.log("\nOK — occurrence_attachments validado (INSERT negado, prepare PENDING, cross-org 0).");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
