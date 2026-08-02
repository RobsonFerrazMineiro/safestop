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
const QA_LIDERANCA_EMAIL = "qa-lideranca@safestop.local";

const MDHO_CAT_BEHAVIOR = "90000000-0000-4000-8000-000000000001";
const MDHO_CAT_DEVIATION = "90000000-0000-4000-8000-000000000002";
const MDHO_CAT_PRECONDITIONS = "90000000-0000-4000-8000-000000000003";
const MDHO_CAT_ORG = "90000000-0000-4000-8000-000000000004";
const MDHO_CAT_SUPERVISION = "90000000-0000-4000-8000-000000000005";

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
    title: `QA MDHO smoke ${suffix}`,
    task_description: "Ocorrência para smoke MDHO Sprint 2.6",
    location_description: "Local QA",
    condition_description: "Condição insegura QA",
    severity: "HIGH",
  };
}

function buildValidSelections() {
  return [
    {
      category_id: MDHO_CAT_BEHAVIOR,
      option_id: "91000000-0000-4000-8000-000000000003",
    },
    {
      category_id: MDHO_CAT_DEVIATION,
      option_id: "91000000-0000-4000-8000-000000000013",
    },
    {
      category_id: MDHO_CAT_PRECONDITIONS,
      option_id: "91000000-0000-4000-8000-000000000023",
    },
    {
      category_id: MDHO_CAT_ORG,
      option_id: "91000000-0000-4000-8000-000000000035",
    },
    {
      category_id: MDHO_CAT_SUPERVISION,
      option_id: "91000000-0000-4000-8000-000000000041",
    },
  ];
}

async function createIoOccurrence(apiUrl, anonKey, fieldToken, supervisorToken, suffix) {
  const createResult = await rpc(apiUrl, anonKey, fieldToken, "create_occurrence", {
    payload: buildPpPayload(suffix),
  });
  if (!createResult.success) {
    throw new Error(`create_occurrence falhou: ${JSON.stringify(createResult)}`);
  }

  const occurrenceId = createResult.data.id;

  const startEval = await rpc(
    apiUrl,
    anonKey,
    supervisorToken,
    "start_occurrence_evaluation",
    { p_occurrence_id: occurrenceId },
  );
  if (!startEval.success) {
    throw new Error(`start_occurrence_evaluation falhou: ${JSON.stringify(startEval)}`);
  }

  const ioDecision = await rpc(
    apiUrl,
    anonKey,
    supervisorToken,
    "record_occurrence_decision",
    {
      p_payload: {
        occurrence_id: occurrenceId,
        decision_type: "INTERDICAO_OFICIAL",
        decision_reason:
          "Atividade apresenta risco grave e requer interdição formal até correção completa.",
      },
    },
  );
  if (!ioDecision.success || ioDecision.data?.occurrence?.status !== "INTERDICAO_CONFIRMADA") {
    throw new Error(`IO falhou: ${JSON.stringify(ioDecision)}`);
  }

  return occurrenceId;
}

async function createVaOccurrence(apiUrl, anonKey, fieldToken, supervisorToken) {
  const createResult = await rpc(apiUrl, anonKey, fieldToken, "create_occurrence", {
    payload: buildPpPayload("VA-branch"),
  });
  if (!createResult.success) {
    throw new Error(`create_occurrence falhou: ${JSON.stringify(createResult)}`);
  }

  const occurrenceId = createResult.data.id;

  await rpc(apiUrl, anonKey, supervisorToken, "start_occurrence_evaluation", {
    p_occurrence_id: occurrenceId,
  });

  const vaDecision = await rpc(
    apiUrl,
    anonKey,
    supervisorToken,
    "record_occurrence_decision",
    {
      p_payload: {
        occurrence_id: occurrenceId,
        decision_type: "VER_E_AGIR",
        decision_reason: "Condição insegura requer ação corretiva imediata conforme análise HSE.",
      },
    },
  );
  if (!vaDecision.success || vaDecision.data?.occurrence?.status !== "VER_E_AGIR") {
    throw new Error(`VA falhou: ${JSON.stringify(vaDecision)}`);
  }

  return occurrenceId;
}

async function main() {
  const password = loadPassword();
  const { apiUrl, anonKey } = loadSupabaseLocalEnv();

  console.log("=== Smoke MDHO (Sprint 2.6) ===\n");

  const field = await signIn(apiUrl, anonKey, QA_FIELD_EMAIL, password);
  const supervisor = await signIn(apiUrl, anonKey, QA_SUPERVISOR_EMAIL, password);
  const lideranca = await signIn(apiUrl, anonKey, QA_LIDERANCA_EMAIL, password);

  console.log("MDHO-02 — start em Ver e Agir → FORBIDDEN...");
  const vaOccurrenceId = await createVaOccurrence(
    apiUrl,
    anonKey,
    field.access_token,
    supervisor.access_token,
  );
  const vaStart = await rpc(
    apiUrl,
    anonKey,
    supervisor.access_token,
    "start_mdho_assessment",
    { p_occurrence_id: vaOccurrenceId },
  );
  if (vaStart.success !== false || vaStart.error?.code !== "FORBIDDEN") {
    throw new Error(`Esperado FORBIDDEN, recebido ${JSON.stringify(vaStart)}`);
  }
  console.log("   OK");

  const ioOccurrenceId = await createIoOccurrence(
    apiUrl,
    anonKey,
    field.access_token,
    supervisor.access_token,
    "MDHO",
  );
  console.log(`Ocorrência IO: ${ioOccurrenceId}\n`);

  console.log("MDHO-01 — qa-supervisor start_mdho_assessment...");
  const startMdho = await rpc(
    apiUrl,
    anonKey,
    supervisor.access_token,
    "start_mdho_assessment",
    { p_occurrence_id: ioOccurrenceId },
  );
  if (!startMdho.success || startMdho.data?.occurrence?.status !== "MDHO_EM_PREENCHIMENTO") {
    throw new Error(`Start MDHO falhou: ${JSON.stringify(startMdho)}`);
  }
  const assessmentId = startMdho.data.assessment.id;
  console.log("   OK");

  console.log("MDHO-04 — save_mdho_draft...");
  const saveDraft = await rpc(apiUrl, anonKey, supervisor.access_token, "save_mdho_draft", {
    p_payload: {
      assessment_id: assessmentId,
      selections: buildValidSelections(),
      complement: "Complemento técnico da avaliação MDHO para smoke QA.",
    },
  });
  if (!saveDraft.success) {
    throw new Error(`save_mdho_draft falhou: ${JSON.stringify(saveDraft)}`);
  }
  console.log("   OK");

  console.log("MDHO-06 — submit_mdho_assessment...");
  const submit = await rpc(
    apiUrl,
    anonKey,
    supervisor.access_token,
    "submit_mdho_assessment",
    { p_assessment_id: assessmentId },
  );
  if (!submit.success || submit.data?.occurrence?.status !== "AGUARDANDO_APROVACAO_HSE") {
    throw new Error(`submit falhou: ${JSON.stringify(submit)}`);
  }
  console.log("   OK");

  console.log("MDHO-12 — timeline títulos MDHO...");
  const timeline = await rpc(
    apiUrl,
    anonKey,
    supervisor.access_token,
    "get_occurrence_timeline",
    { p_occurrence_id: ioOccurrenceId, p_limit: 20 },
  );
  const titles = timeline.items?.map((item) => item.title) ?? [];
  if (!titles.includes("MDHO iniciado") || !titles.includes("MDHO enviado")) {
    throw new Error(`Timeline MDHO incompleta: ${JSON.stringify(titles)}`);
  }
  console.log("   OK");

  console.log("MDHO-07 — qa-lideranca approve_mdho_assessment...");
  const approve = await rpc(
    apiUrl,
    anonKey,
    lideranca.access_token,
    "approve_mdho_assessment",
    { p_assessment_id: assessmentId },
  );
  if (!approve.success || approve.data?.occurrence?.status !== "AGUARDANDO_REGISTRO_IMS") {
    throw new Error(`approve falhou: ${JSON.stringify(approve)}`);
  }
  console.log("   OK");

  const timelineApproved = await rpc(
    apiUrl,
    anonKey,
    lideranca.access_token,
    "get_occurrence_timeline",
    { p_occurrence_id: ioOccurrenceId, p_limit: 20 },
  );
  const approvedTitle = timelineApproved.items?.find((item) => item.title === "MDHO aprovado");
  if (!approvedTitle?.metadata?.assessmentId) {
    throw new Error(`Timeline MDHO aprovado ausente: ${JSON.stringify(approvedTitle)}`);
  }
  console.log("   OK (timeline MDHO aprovado)");

  console.log("\nSmoke MDHO concluído com sucesso.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
