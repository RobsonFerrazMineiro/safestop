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
const QA_DUAL_HSE_EMAIL = "qa-dual-hse@safestop.local";

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

async function prepareSubmittedMdho(apiUrl, anonKey, fieldToken, submitterToken, suffix) {
  const occurrenceId = await createIoOccurrence(
    apiUrl,
    anonKey,
    fieldToken,
    submitterToken,
    suffix,
  );

  const startMdho = await rpc(apiUrl, anonKey, submitterToken, "start_mdho_assessment", {
    p_occurrence_id: occurrenceId,
  });
  if (!startMdho.success) {
    throw new Error(`start_mdho_assessment falhou: ${JSON.stringify(startMdho)}`);
  }

  const assessmentId = startMdho.data.assessment.id;

  const saveDraft = await rpc(apiUrl, anonKey, submitterToken, "save_mdho_draft", {
    p_payload: {
      assessment_id: assessmentId,
      selections: buildValidSelections(),
      complement: "Complemento técnico da avaliação MDHO para smoke QA.",
    },
  });
  if (!saveDraft.success) {
    throw new Error(`save_mdho_draft falhou: ${JSON.stringify(saveDraft)}`);
  }

  const submit = await rpc(apiUrl, anonKey, submitterToken, "submit_mdho_assessment", {
    p_assessment_id: assessmentId,
  });
  if (!submit.success || submit.data?.occurrence?.status !== "AGUARDANDO_APROVACAO_HSE") {
    throw new Error(`submit falhou: ${JSON.stringify(submit)}`);
  }

  return { occurrenceId, assessmentId };
}

async function main() {
  const password = loadPassword();
  const { apiUrl, anonKey } = loadSupabaseLocalEnv();

  console.log("=== Smoke MDHO + HSE Approval (Sprint 2.6 / 2.7) ===\n");

  const field = await signIn(apiUrl, anonKey, QA_FIELD_EMAIL, password);
  const supervisor = await signIn(apiUrl, anonKey, QA_SUPERVISOR_EMAIL, password);
  const lideranca = await signIn(apiUrl, anonKey, QA_LIDERANCA_EMAIL, password);
  const dualHse = await signIn(apiUrl, anonKey, QA_DUAL_HSE_EMAIL, password);

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

  const { occurrenceId: ioOccurrenceId, assessmentId } = await prepareSubmittedMdho(
    apiUrl,
    anonKey,
    field.access_token,
    supervisor.access_token,
    "HSE-main",
  );
  console.log(`Ocorrência IO (fila HSE): ${ioOccurrenceId}\n`);

  console.log("HSE-01 — qa-liderança list_mdho_pending_approvals...");
  const queue = await rpc(
    apiUrl,
    anonKey,
    lideranca.access_token,
    "list_mdho_pending_approvals",
    { p_organization_id: QA_ALPHA_ORG_ID, p_limit: 20 },
  );
  if (!queue.success) {
    throw new Error(`list falhou: ${JSON.stringify(queue)}`);
  }
  const queueItem = queue.items?.find((item) => item.assessmentId === assessmentId);
  if (!queueItem?.areaName || !queueItem?.criticality) {
    throw new Error(`Item fila incompleto: ${JSON.stringify(queueItem)}`);
  }
  console.log("   OK");

  console.log("HSE-06 — qa-supervisor list → FORBIDDEN...");
  const supervisorQueue = await rpc(
    apiUrl,
    anonKey,
    supervisor.access_token,
    "list_mdho_pending_approvals",
    { p_organization_id: QA_ALPHA_ORG_ID },
  );
  if (supervisorQueue.success !== false || supervisorQueue.error?.code !== "FORBIDDEN") {
    throw new Error(`Esperado FORBIDDEN, recebido ${JSON.stringify(supervisorQueue)}`);
  }
  console.log("   OK");

  console.log("HSE-07 — qa-dual-hse autoaprovação → SELF_APPROVAL_FORBIDDEN...");
  const dualFlow = await prepareSubmittedMdho(
    apiUrl,
    anonKey,
    field.access_token,
    dualHse.access_token,
    "HSE-self-approval",
  );
  const selfApprove = await rpc(
    apiUrl,
    anonKey,
    dualHse.access_token,
    "approve_mdho_assessment",
    { p_assessment_id: dualFlow.assessmentId },
  );
  if (
    selfApprove.success !== false ||
    selfApprove.error?.code !== "SELF_APPROVAL_FORBIDDEN"
  ) {
    throw new Error(`Esperado SELF_APPROVAL_FORBIDDEN, recebido ${JSON.stringify(selfApprove)}`);
  }
  console.log("   OK");

  console.log("HSE-03 — qa-liderança approve_mdho_assessment...");
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

  console.log("HSE-16 — retry approve idempotente...");
  const retryApprove = await rpc(
    apiUrl,
    anonKey,
    lideranca.access_token,
    "approve_mdho_assessment",
    { p_assessment_id: assessmentId },
  );
  if (!retryApprove.success || retryApprove.data?.idempotent !== true) {
    throw new Error(`Idempotência falhou: ${JSON.stringify(retryApprove)}`);
  }
  console.log("   OK");

  console.log("MDHO-12 — timeline títulos MDHO...");
  const timeline = await rpc(
    apiUrl,
    anonKey,
    lideranca.access_token,
    "get_occurrence_timeline",
    { p_occurrence_id: ioOccurrenceId, p_limit: 20 },
  );
  const titles = timeline.items?.map((item) => item.title) ?? [];
  if (
    !titles.includes("MDHO iniciado") ||
    !titles.includes("MDHO enviado") ||
    !titles.includes("MDHO aprovado")
  ) {
    throw new Error(`Timeline MDHO incompleta: ${JSON.stringify(titles)}`);
  }
  console.log("   OK");

  console.log("\nSmoke MDHO + HSE concluído com sucesso.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
