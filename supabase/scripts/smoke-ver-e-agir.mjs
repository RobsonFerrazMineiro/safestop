import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { loadSupabaseLocalEnv } from "./_local-env.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PASSWORD = "SafeStop-QA-Local-2026";

const QA_ALPHA_ORG_ID = "b0000000-0000-4000-8000-000000000001";
const QA_ALPHA_AREA_ID = "f0000000-0000-4000-8000-000000000001";
const QA_ALPHA_CONTRACTOR_ID = "b0000000-0000-4000-8000-000000000002";
const QA_FIELD_EMAIL = "qa-field@safestop.local";
const QA_SUPERVISOR_EMAIL = "qa-supervisor@safestop.local";
const QA_SUPERVISOR_USER_ID = "a0000000-0000-4000-8000-000000000009";

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
    throw new Error(`Login falhou para ${email} (${response.status})`);
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

function buildPpPayload() {
  return {
    organization_id: QA_ALPHA_ORG_ID,
    area_id: QA_ALPHA_AREA_ID,
    contractor_organization_id: QA_ALPHA_CONTRACTOR_ID,
    title: "QA Ver e Agir smoke",
    task_description: "Ocorrência para smoke VA Sprint 2.4",
    location_description: "Local QA",
    condition_description: "Condição insegura QA",
    severity: "HIGH",
  };
}

async function main() {
  const password = loadPassword();
  const { apiUrl, anonKey } = loadSupabaseLocalEnv();

  console.log("=== Smoke Ver e Agir (Sprint 2.4) ===\n");

  const field = await signIn(apiUrl, anonKey, QA_FIELD_EMAIL, password);
  const supervisor = await signIn(apiUrl, anonKey, QA_SUPERVISOR_EMAIL, password);

  const createResult = await rpc(apiUrl, anonKey, field.access_token, "create_occurrence", {
    payload: buildPpPayload(),
  });

  if (!createResult.success) {
    throw new Error(`create_occurrence falhou: ${JSON.stringify(createResult)}`);
  }

  const occurrenceId = createResult.data.id;
  console.log(`Ocorrência PP: ${occurrenceId}\n`);

  console.log("VA-07 — qa-field start → FORBIDDEN...");
  const fieldStart = await rpc(apiUrl, anonKey, field.access_token, "start_occurrence_evaluation", {
    p_occurrence_id: occurrenceId,
  });
  if (fieldStart.success !== false || fieldStart.error?.code !== "FORBIDDEN") {
    throw new Error(`Esperado FORBIDDEN, recebido ${JSON.stringify(fieldStart)}`);
  }
  console.log("   OK");

  console.log("VA-01 — qa-supervisor start → EM_AVALIACAO...");
  const startResult = await rpc(
    apiUrl,
    anonKey,
    supervisor.access_token,
    "start_occurrence_evaluation",
    { p_occurrence_id: occurrenceId },
  );
  if (!startResult.success || startResult.data?.current_status !== "EM_AVALIACAO") {
    throw new Error(`Start falhou: ${JSON.stringify(startResult)}`);
  }
  if (startResult.data.assigned_evaluator_id !== QA_SUPERVISOR_USER_ID) {
    throw new Error("assigned_evaluator_id incorreto");
  }
  console.log("   OK");

  console.log("VA-02 — timeline título Avaliação iniciada...");
  const timelineAfterStart = await rpc(
    apiUrl,
    anonKey,
    supervisor.access_token,
    "get_occurrence_timeline",
    { p_occurrence_id: occurrenceId, p_limit: 10 },
  );
  const evalTitle = timelineAfterStart.items?.find(
    (item) => item.title === "Avaliação iniciada",
  );
  if (!evalTitle) {
    throw new Error(`Título não encontrado: ${JSON.stringify(timelineAfterStart.items)}`);
  }
  console.log("   OK");

  console.log("VA-03/VA-04 — record decision → VER_E_AGIR...");
  const decisionResult = await rpc(
    apiUrl,
    anonKey,
    supervisor.access_token,
    "record_occurrence_decision",
    {
      p_payload: {
        occurrence_id: occurrenceId,
        decision_type: "VER_E_AGIR",
        decision_reason: "Condição insegura requer ação corretiva imediata conforme análise HSE.",
      },
    },
  );
  if (!decisionResult.success || decisionResult.data?.occurrence?.status !== "VER_E_AGIR") {
    throw new Error(`Decisão falhou: ${JSON.stringify(decisionResult)}`);
  }
  console.log("   OK");

  console.log("VA-02 — timeline título Decisão: Ver e Agir...");
  const timelineAfterDecision = await rpc(
    apiUrl,
    anonKey,
    supervisor.access_token,
    "get_occurrence_timeline",
    { p_occurrence_id: occurrenceId, p_limit: 10 },
  );
  const decisionTitle = timelineAfterDecision.items?.find(
    (item) => item.title === "Decisão: Ver e Agir",
  );
  if (!decisionTitle?.metadata?.decisionType) {
    throw new Error(`Metadata decisão ausente: ${JSON.stringify(decisionTitle)}`);
  }
  console.log("   OK");

  console.log("VA-14 — double decision → ALREADY_DECIDED...");
  const retryDecision = await rpc(
    apiUrl,
    anonKey,
    supervisor.access_token,
    "record_occurrence_decision",
    {
      p_payload: {
        occurrence_id: occurrenceId,
        decision_type: "VER_E_AGIR",
        decision_reason: "Segunda tentativa deve falhar com ALREADY_DECIDED na mesma ocorrência.",
      },
    },
  );
  if (retryDecision.success !== false || retryDecision.error?.code !== "ALREADY_DECIDED") {
    throw new Error(`Esperado ALREADY_DECIDED, recebido ${JSON.stringify(retryDecision)}`);
  }
  console.log("   OK");

  console.log("\nSmoke Ver e Agir concluído com sucesso.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
