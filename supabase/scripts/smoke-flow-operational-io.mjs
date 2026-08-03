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

const IMS_CODE = "BAA-26-0100";

const EXPECTED_TIMELINE_TITLES = [
  "Paralisação Preventiva registrada",
  "Avaliação iniciada",
  "Interdição Oficial confirmada",
  "MDHO iniciado",
  "MDHO enviado",
  "MDHO aprovado",
  "Referência IMS registrada",
];

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
    title: "QA smoke fluxo operacional IO",
    task_description: "Cadeia integrada PP → IMS Sprint 2.9",
    location_description: "Local QA",
    condition_description: "Condição insegura QA",
    severity: "HIGH",
  };
}

function buildValidSelections() {
  return [
    { category_id: MDHO_CAT_BEHAVIOR, option_id: "91000000-0000-4000-8000-000000000003" },
    { category_id: MDHO_CAT_DEVIATION, option_id: "91000000-0000-4000-8000-000000000013" },
    { category_id: MDHO_CAT_PRECONDITIONS, option_id: "91000000-0000-4000-8000-000000000023" },
    { category_id: MDHO_CAT_ORG, option_id: "91000000-0000-4000-8000-000000000035" },
    { category_id: MDHO_CAT_SUPERVISION, option_id: "91000000-0000-4000-8000-000000000041" },
  ];
}

function assertStep(label, condition, detail) {
  if (!condition) {
    throw new Error(`${label} falhou: ${detail}`);
  }
  console.log(`   OK — ${label}`);
}

async function main() {
  const password = loadPassword();
  const { apiUrl, anonKey } = loadSupabaseLocalEnv();

  console.log("=== Smoke fluxo operacional IO (Sprint 2.9) ===\n");
  console.log("Cadeia: PP → eval → IO → MDHO → approve HSE → register IMS\n");

  const field = await signIn(apiUrl, anonKey, QA_FIELD_EMAIL, password);
  const supervisor = await signIn(apiUrl, anonKey, QA_SUPERVISOR_EMAIL, password);
  const lideranca = await signIn(apiUrl, anonKey, QA_LIDERANCA_EMAIL, password);

  console.log("1/8 — create_occurrence (PP)...");
  const createResult = await rpc(apiUrl, anonKey, field.access_token, "create_occurrence", {
    payload: buildPpPayload(),
  });
  assertStep("PP registrada", createResult.success, JSON.stringify(createResult));
  const occurrenceId = createResult.data.id;
  console.log(`   occurrence_id: ${occurrenceId}\n`);

  console.log("2/8 — start_occurrence_evaluation...");
  const startEval = await rpc(
    apiUrl,
    anonKey,
    supervisor.access_token,
    "start_occurrence_evaluation",
    { p_occurrence_id: occurrenceId },
  );
  assertStep(
    "EM_AVALIACAO",
    startEval.success && startEval.data?.current_status === "EM_AVALIACAO",
    JSON.stringify(startEval),
  );

  console.log("3/8 — record_occurrence_decision (INTERDICAO_OFICIAL)...");
  const ioDecision = await rpc(
    apiUrl,
    anonKey,
    supervisor.access_token,
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
  assertStep(
    "INTERDICAO_CONFIRMADA",
    ioDecision.success && ioDecision.data?.occurrence?.status === "INTERDICAO_CONFIRMADA",
    JSON.stringify(ioDecision),
  );

  console.log("4/8 — start_mdho_assessment...");
  const startMdho = await rpc(
    apiUrl,
    anonKey,
    supervisor.access_token,
    "start_mdho_assessment",
    { p_occurrence_id: occurrenceId },
  );
  assertStep(
    "MDHO_EM_PREENCHIMENTO",
    startMdho.success && startMdho.data?.occurrence?.status === "MDHO_EM_PREENCHIMENTO",
    JSON.stringify(startMdho),
  );
  const assessmentId = startMdho.data.assessment.id;

  console.log("5/8 — save_mdho_draft + submit_mdho_assessment...");
  const saveDraft = await rpc(apiUrl, anonKey, supervisor.access_token, "save_mdho_draft", {
    p_payload: {
      assessment_id: assessmentId,
      selections: buildValidSelections(),
      complement: "Complemento técnico MDHO — smoke fluxo operacional IO.",
    },
  });
  assertStep("save_mdho_draft", saveDraft.success, JSON.stringify(saveDraft));

  const submitMdho = await rpc(
    apiUrl,
    anonKey,
    supervisor.access_token,
    "submit_mdho_assessment",
    { p_assessment_id: assessmentId },
  );
  assertStep(
    "AGUARDANDO_APROVACAO_HSE",
    submitMdho.success && submitMdho.data?.occurrence?.status === "AGUARDANDO_APROVACAO_HSE",
    JSON.stringify(submitMdho),
  );

  console.log("6/8 — approve_mdho_assessment (HSE)...");
  const approveMdho = await rpc(
    apiUrl,
    anonKey,
    lideranca.access_token,
    "approve_mdho_assessment",
    { p_assessment_id: assessmentId },
  );
  assertStep(
    "AGUARDANDO_REGISTRO_IMS",
    approveMdho.success && approveMdho.data?.occurrence?.status === "AGUARDANDO_REGISTRO_IMS",
    JSON.stringify(approveMdho),
  );

  console.log("7/8 — register_ims_reference...");
  const registerIms = await rpc(
    apiUrl,
    anonKey,
    supervisor.access_token,
    "register_ims_reference",
    {
      p_payload: {
        occurrence_id: occurrenceId,
        ims_reference_code: IMS_CODE,
      },
    },
  );
  assertStep(
    "EM_TRATATIVA",
    registerIms.success && registerIms.data?.occurrence?.status === "EM_TRATATIVA",
    JSON.stringify(registerIms),
  );
  assertStep(
    "ims_reference_code",
    registerIms.data?.occurrence?.ims_reference_code === IMS_CODE,
    JSON.stringify(registerIms.data),
  );

  console.log("8/8 — get_occurrence_timeline (títulos da cadeia)...");
  const timeline = await rpc(
    apiUrl,
    anonKey,
    supervisor.access_token,
    "get_occurrence_timeline",
    { p_occurrence_id: occurrenceId, p_limit: 40 },
  );
  const titles = timeline.items?.map((item) => item.title) ?? [];
  for (const expectedTitle of EXPECTED_TIMELINE_TITLES) {
    assertStep(`timeline "${expectedTitle}"`, titles.includes(expectedTitle), JSON.stringify(titles));
  }

  console.log("\nSmoke fluxo operacional IO concluído com sucesso.");
  console.log(`Status final: EM_TRATATIVA | IMS: ${IMS_CODE}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
