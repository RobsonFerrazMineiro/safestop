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
const QA_FISCAL_EMAIL = "qa-fiscal@safestop.local";
const QA_SUPERVISOR_EMAIL = "qa-supervisor@safestop.local";

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

function buildPpPayload(suffix) {
  return {
    organization_id: QA_ALPHA_ORG_ID,
    area_id: QA_ALPHA_AREA_ID,
    contractor_organization_id: QA_ALPHA_CONTRACTOR_ID,
    title: `QA Interdição Oficial smoke ${suffix}`,
    task_description: "Ocorrência para smoke IO Sprint 2.5",
    location_description: "Local QA",
    condition_description: "Condição insegura QA",
    severity: "HIGH",
  };
}

async function createAndStartEvaluation(apiUrl, anonKey, fieldToken, supervisorToken, suffix) {
  const createResult = await rpc(apiUrl, anonKey, fieldToken, "create_occurrence", {
    payload: buildPpPayload(suffix),
  });
  if (!createResult.success) {
    throw new Error(`create_occurrence falhou: ${JSON.stringify(createResult)}`);
  }

  const occurrenceId = createResult.data.id;
  const startResult = await rpc(
    apiUrl,
    anonKey,
    supervisorToken,
    "start_occurrence_evaluation",
    { p_occurrence_id: occurrenceId },
  );
  if (!startResult.success || startResult.data?.current_status !== "EM_AVALIACAO") {
    throw new Error(`start_occurrence_evaluation falhou: ${JSON.stringify(startResult)}`);
  }

  return occurrenceId;
}

async function main() {
  const password = loadPassword();
  const { apiUrl, anonKey } = loadSupabaseLocalEnv();

  console.log("=== Smoke Interdição Oficial (Sprint 2.5) ===\n");

  const field = await signIn(apiUrl, anonKey, QA_FIELD_EMAIL, password);
  const fiscal = await signIn(apiUrl, anonKey, QA_FISCAL_EMAIL, password);
  const supervisor = await signIn(apiUrl, anonKey, QA_SUPERVISOR_EMAIL, password);

  const ioOccurrenceId = await createAndStartEvaluation(
    apiUrl,
    anonKey,
    field.access_token,
    supervisor.access_token,
    "IO",
  );
  console.log(`Ocorrência IO: ${ioOccurrenceId}\n`);

  console.log("IO-02 — qa-fiscal INTERDICAO_OFICIAL → FORBIDDEN...");
  const fiscalIo = await rpc(apiUrl, anonKey, fiscal.access_token, "record_occurrence_decision", {
    p_payload: {
      occurrence_id: ioOccurrenceId,
      decision_type: "INTERDICAO_OFICIAL",
      decision_reason: "Fiscal não possui permissão confirm_interdiction para esta operação.",
    },
  });
  if (fiscalIo.success !== false || fiscalIo.error?.code !== "FORBIDDEN") {
    throw new Error(`Esperado FORBIDDEN, recebido ${JSON.stringify(fiscalIo)}`);
  }
  console.log("   OK");

  console.log("IO-01 — qa-supervisor INTERDICAO_OFICIAL → INTERDICAO_CONFIRMADA...");
  const ioResult = await rpc(
    apiUrl,
    anonKey,
    supervisor.access_token,
    "record_occurrence_decision",
    {
      p_payload: {
        occurrence_id: ioOccurrenceId,
        decision_type: "INTERDICAO_OFICIAL",
        decision_reason:
          "Atividade apresenta risco grave e requer interdição formal até correção completa.",
      },
    },
  );
  if (!ioResult.success || ioResult.data?.occurrence?.status !== "INTERDICAO_CONFIRMADA") {
    throw new Error(`IO falhou: ${JSON.stringify(ioResult)}`);
  }
  if (ioResult.data?.occurrence?.decision_type !== "INTERDICAO_OFICIAL") {
    throw new Error("decision_type incorreto na resposta");
  }
  console.log("   OK");

  console.log("IO-07 — timeline título Interdição Oficial confirmada...");
  const timelineIo = await rpc(apiUrl, anonKey, supervisor.access_token, "get_occurrence_timeline", {
    p_occurrence_id: ioOccurrenceId,
    p_limit: 10,
  });
  const ioTitle = timelineIo.items?.find((item) => item.title === "Interdição Oficial confirmada");
  if (!ioTitle?.metadata?.decisionType || !ioTitle?.metadata?.decidedByName) {
    throw new Error(`Metadata IO ausente: ${JSON.stringify(ioTitle)}`);
  }
  console.log("   OK");

  console.log("IO-05 — double decision → ALREADY_DECIDED...");
  const retryIo = await rpc(
    apiUrl,
    anonKey,
    supervisor.access_token,
    "record_occurrence_decision",
    {
      p_payload: {
        occurrence_id: ioOccurrenceId,
        decision_type: "INTERDICAO_OFICIAL",
        decision_reason: "Segunda tentativa deve falhar com ALREADY_DECIDED na mesma ocorrência.",
      },
    },
  );
  if (retryIo.success !== false || retryIo.error?.code !== "ALREADY_DECIDED") {
    throw new Error(`Esperado ALREADY_DECIDED, recebido ${JSON.stringify(retryIo)}`);
  }
  console.log("   OK");

  console.log("VA-03 regressão — Ver e Agir ainda funciona...");
  const vaOccurrenceId = await createAndStartEvaluation(
    apiUrl,
    anonKey,
    field.access_token,
    supervisor.access_token,
    "VA-regression",
  );
  const vaResult = await rpc(
    apiUrl,
    anonKey,
    supervisor.access_token,
    "record_occurrence_decision",
    {
      p_payload: {
        occurrence_id: vaOccurrenceId,
        decision_type: "VER_E_AGIR",
        decision_reason: "Condição insegura requer ação corretiva imediata conforme análise HSE.",
      },
    },
  );
  if (!vaResult.success || vaResult.data?.occurrence?.status !== "VER_E_AGIR") {
    throw new Error(`Regressão VA falhou: ${JSON.stringify(vaResult)}`);
  }
  console.log("   OK");

  console.log("\nSmoke Interdição Oficial concluído com sucesso.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
