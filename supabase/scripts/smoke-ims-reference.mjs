import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { loadSupabaseLocalEnv } from "./_local-env.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..", "..");
const PASSWORD = "SafeStop-QA-Local-2026";

const QA_ALPHA_ORG_ID = "b0000000-0000-4000-8000-000000000001";
const QA_ALPHA_AREA_ID = "f0000000-0000-4000-8000-000000000001";
const QA_ALPHA_CONTRACTOR_ID = "b0000000-0000-4000-8000-000000000002";

const QA_FIELD_EMAIL = "qa-field@safestop.local";
const QA_FISCAL_EMAIL = "qa-fiscal@safestop.local";
const QA_MULTI_EMAIL = "qa-multi@safestop.local";
const QA_SUPERVISOR_EMAIL = "qa-supervisor@safestop.local";
const QA_LIDERANCA_EMAIL = "qa-lideranca@safestop.local";

const MDHO_CAT_BEHAVIOR = "90000000-0000-4000-8000-000000000001";
const MDHO_CAT_DEVIATION = "90000000-0000-4000-8000-000000000002";
const MDHO_CAT_PRECONDITIONS = "90000000-0000-4000-8000-000000000003";
const MDHO_CAT_ORG = "90000000-0000-4000-8000-000000000004";
const MDHO_CAT_SUPERVISION = "90000000-0000-4000-8000-000000000005";

const VALID_IMS_CODE = "BAA-26-0001";
const UPDATED_IMS_CODE = "BAA-26-0002";

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

function runQuery(sql) {
  execSync(`pnpm exec supabase db query --local ${JSON.stringify(sql)}`, {
    cwd: REPO_ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
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
    title: `QA IMS smoke ${suffix}`,
    task_description: "Ocorrência para smoke IMS Sprint 2.8",
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

async function createIoOccurrence(apiUrl, anonKey, fieldToken, actorToken, suffix) {
  const createResult = await rpc(apiUrl, anonKey, fieldToken, "create_occurrence", {
    payload: buildPpPayload(suffix),
  });
  if (!createResult.success) {
    throw new Error(`create_occurrence falhou: ${JSON.stringify(createResult)}`);
  }

  const occurrenceId = createResult.data.id;

  await rpc(apiUrl, anonKey, actorToken, "start_occurrence_evaluation", {
    p_occurrence_id: occurrenceId,
  });

  const ioDecision = await rpc(apiUrl, anonKey, actorToken, "record_occurrence_decision", {
    p_payload: {
      occurrence_id: occurrenceId,
      decision_type: "INTERDICAO_OFICIAL",
      decision_reason:
        "Atividade apresenta risco grave e requer interdição formal até correção completa.",
    },
  });
  if (!ioDecision.success) {
    throw new Error(`IO falhou: ${JSON.stringify(ioDecision)}`);
  }

  return occurrenceId;
}

async function prepareAwaitingIms(
  apiUrl,
  anonKey,
  fieldToken,
  supervisorToken,
  liderancaToken,
  suffix,
) {
  const occurrenceId = await createIoOccurrence(
    apiUrl,
    anonKey,
    fieldToken,
    supervisorToken,
    suffix,
  );

  const startMdho = await rpc(apiUrl, anonKey, supervisorToken, "start_mdho_assessment", {
    p_occurrence_id: occurrenceId,
  });
  const assessmentId = startMdho.data.assessment.id;

  await rpc(apiUrl, anonKey, supervisorToken, "save_mdho_draft", {
    p_payload: {
      assessment_id: assessmentId,
      selections: buildValidSelections(),
      complement: "Complemento técnico MDHO para smoke IMS.",
    },
  });

  await rpc(apiUrl, anonKey, supervisorToken, "submit_mdho_assessment", {
    p_assessment_id: assessmentId,
  });

  await rpc(apiUrl, anonKey, liderancaToken, "approve_mdho_assessment", {
    p_assessment_id: assessmentId,
  });

  return occurrenceId;
}

async function createVaAwaitingImsAttempt(apiUrl, anonKey, fieldToken, supervisorToken) {
  const createResult = await rpc(apiUrl, anonKey, fieldToken, "create_occurrence", {
    payload: buildPpPayload("VA-IMS"),
  });
  const occurrenceId = createResult.data.id;

  await rpc(apiUrl, anonKey, supervisorToken, "start_occurrence_evaluation", {
    p_occurrence_id: occurrenceId,
  });

  await rpc(apiUrl, anonKey, supervisorToken, "record_occurrence_decision", {
    p_payload: {
      occurrence_id: occurrenceId,
      decision_type: "VER_E_AGIR",
      decision_reason: "Condição insegura requer ação corretiva imediata conforme análise HSE.",
    },
  });

  return occurrenceId;
}

async function main() {
  const password = loadPassword();
  const { apiUrl, anonKey } = loadSupabaseLocalEnv();

  console.log("=== Smoke Referência IMS (Sprint 2.8) ===\n");

  const field = await signIn(apiUrl, anonKey, QA_FIELD_EMAIL, password);
  const fiscal = await signIn(apiUrl, anonKey, QA_FISCAL_EMAIL, password);
  const multi = await signIn(apiUrl, anonKey, QA_MULTI_EMAIL, password);
  const supervisor = await signIn(apiUrl, anonKey, QA_SUPERVISOR_EMAIL, password);
  const lideranca = await signIn(apiUrl, anonKey, QA_LIDERANCA_EMAIL, password);

  const mainOccurrenceId = await prepareAwaitingIms(
    apiUrl,
    anonKey,
    field.access_token,
    supervisor.access_token,
    lideranca.access_token,
    "main",
  );
  console.log(`Ocorrência AGUARDANDO_REGISTRO_IMS: ${mainOccurrenceId}\n`);

  console.log("IMS-02 — formato inválido → VALIDATION_ERROR...");
  const invalidFormat = await rpc(
    apiUrl,
    anonKey,
    supervisor.access_token,
    "register_ims_reference",
    {
      p_payload: {
        occurrence_id: mainOccurrenceId,
        ims_reference_code: "INVALID-CODE",
      },
    },
  );
  if (invalidFormat.success !== false || invalidFormat.error?.code !== "VALIDATION_ERROR") {
    throw new Error(`Esperado VALIDATION_ERROR, recebido ${JSON.stringify(invalidFormat)}`);
  }
  console.log("   OK");

  console.log("IMS-04/IMS-12 — qa-fiscal register → FORBIDDEN...");
  const fiscalRegister = await rpc(
    apiUrl,
    anonKey,
    fiscal.access_token,
    "register_ims_reference",
    {
      p_payload: {
        occurrence_id: mainOccurrenceId,
        ims_reference_code: VALID_IMS_CODE,
      },
    },
  );
  if (fiscalRegister.success !== false || fiscalRegister.error?.code !== "FORBIDDEN") {
    throw new Error(`Esperado FORBIDDEN, recebido ${JSON.stringify(fiscalRegister)}`);
  }
  console.log("   OK");

  console.log("IMS-01 — qa-supervisor register → EM_TRATATIVA...");
  const register = await rpc(
    apiUrl,
    anonKey,
    supervisor.access_token,
    "register_ims_reference",
    {
      p_payload: {
        occurrence_id: mainOccurrenceId,
        ims_reference_code: VALID_IMS_CODE,
      },
    },
  );
  if (!register.success || register.data?.occurrence?.status !== "EM_TRATATIVA") {
    throw new Error(`Register falhou: ${JSON.stringify(register)}`);
  }
  console.log("   OK");

  console.log("IMS-05 — segundo register → ALREADY_REGISTERED...");
  const secondRegister = await rpc(
    apiUrl,
    anonKey,
    supervisor.access_token,
    "register_ims_reference",
    {
      p_payload: {
        occurrence_id: mainOccurrenceId,
        ims_reference_code: "BAA-26-9999",
      },
    },
  );
  if (secondRegister.success !== false || secondRegister.error?.code !== "ALREADY_REGISTERED") {
    throw new Error(`Esperado ALREADY_REGISTERED, recebido ${JSON.stringify(secondRegister)}`);
  }
  console.log("   OK");

  console.log("IMS-15 — retry register idempotente...");
  const idempotent = await rpc(
    apiUrl,
    anonKey,
    supervisor.access_token,
    "register_ims_reference",
    {
      p_payload: {
        occurrence_id: mainOccurrenceId,
        ims_reference_code: VALID_IMS_CODE,
      },
    },
  );
  if (!idempotent.success || idempotent.data?.idempotent !== true) {
    throw new Error(`Idempotência falhou: ${JSON.stringify(idempotent)}`);
  }
  console.log("   OK");

  console.log("IMS-07 — update_reason curto → VALIDATION_ERROR...");
  const shortReason = await rpc(apiUrl, anonKey, supervisor.access_token, "update_ims_reference", {
    p_payload: {
      occurrence_id: mainOccurrenceId,
      ims_reference_code: UPDATED_IMS_CODE,
      update_reason: "curto",
    },
  });
  if (shortReason.success !== false || shortReason.error?.code !== "VALIDATION_ERROR") {
    throw new Error(`Esperado VALIDATION_ERROR, recebido ${JSON.stringify(shortReason)}`);
  }
  console.log("   OK");

  console.log("IMS-06 — update com motivo válido...");
  const update = await rpc(apiUrl, anonKey, supervisor.access_token, "update_ims_reference", {
    p_payload: {
      occurrence_id: mainOccurrenceId,
      ims_reference_code: UPDATED_IMS_CODE,
      update_reason: "Correção do código IMS informado erroneamente no registro inicial.",
    },
  });
  if (!update.success || update.data?.occurrence?.ims_reference_code !== UPDATED_IMS_CODE) {
    throw new Error(`Update falhou: ${JSON.stringify(update)}`);
  }
  console.log("   OK");

  console.log("IMS-10 — timeline títulos IMS...");
  const timeline = await rpc(
    apiUrl,
    anonKey,
    supervisor.access_token,
    "get_occurrence_timeline",
    { p_occurrence_id: mainOccurrenceId, p_limit: 30 },
  );
  const titles = timeline.items?.map((item) => item.title) ?? [];
  if (
    !titles.includes("Referência IMS registrada") ||
    !titles.includes("Referência IMS alterada")
  ) {
    throw new Error(`Timeline IMS incompleta: ${JSON.stringify(titles)}`);
  }
  console.log("   OK");

  console.log("IMS-09 — pesquisa REST por código IMS...");
  const searchResponse = await fetch(
    `${apiUrl}/rest/v1/occurrences?id=eq.${mainOccurrenceId}&select=id,ims_reference_code`,
    {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${supervisor.access_token}`,
      },
    },
  );
  const searchRows = await searchResponse.json();
  if (!searchResponse.ok || searchRows[0]?.ims_reference_code !== UPDATED_IMS_CODE) {
    throw new Error(`Pesquisa IMS falhou: ${JSON.stringify(searchRows)}`);
  }
  console.log("   OK");

  console.log("IMS-03 — register em Ver e Agir → FORBIDDEN...");
  const vaOccurrenceId = await createVaAwaitingImsAttempt(
    apiUrl,
    anonKey,
    field.access_token,
    supervisor.access_token,
  );
  const vaRegister = await rpc(
    apiUrl,
    anonKey,
    supervisor.access_token,
    "register_ims_reference",
    {
      p_payload: {
        occurrence_id: vaOccurrenceId,
        ims_reference_code: VALID_IMS_CODE,
      },
    },
  );
  if (vaRegister.success !== false || vaRegister.error?.code !== "FORBIDDEN") {
    throw new Error(`Esperado FORBIDDEN VA, recebido ${JSON.stringify(vaRegister)}`);
  }
  console.log("   OK");

  console.log("IMS-11 — cross-tenant qa-multi → FORBIDDEN...");
  const crossTenant = await rpc(
    apiUrl,
    anonKey,
    multi.access_token,
    "register_ims_reference",
    {
      p_payload: {
        occurrence_id: mainOccurrenceId,
        ims_reference_code: "BAA-26-8888",
      },
    },
  );
  if (crossTenant.success !== false || crossTenant.error?.code !== "FORBIDDEN") {
    throw new Error(`Esperado FORBIDDEN cross-tenant, recebido ${JSON.stringify(crossTenant)}`);
  }
  console.log("   OK");

  console.log("IMS-08 — update pós-ENCERRADA → STATUS_MISMATCH...");
  const closedOccurrenceId = await prepareAwaitingIms(
    apiUrl,
    anonKey,
    field.access_token,
    supervisor.access_token,
    lideranca.access_token,
    "closed",
  );
  await rpc(apiUrl, anonKey, supervisor.access_token, "register_ims_reference", {
    p_payload: {
      occurrence_id: closedOccurrenceId,
      ims_reference_code: "BAA-26-0100",
    },
  });
  runQuery(
    `update public.occurrences set status = 'ENCERRADA' where id = '${closedOccurrenceId}';`,
  );
  const closedUpdate = await rpc(
    apiUrl,
    anonKey,
    supervisor.access_token,
    "update_ims_reference",
    {
      p_payload: {
        occurrence_id: closedOccurrenceId,
        ims_reference_code: "BAA-26-0101",
        update_reason: "Tentativa inválida de correção após encerramento da ocorrência.",
      },
    },
  );
  if (closedUpdate.success !== false || closedUpdate.error?.code !== "STATUS_MISMATCH") {
    throw new Error(`Esperado STATUS_MISMATCH, recebido ${JSON.stringify(closedUpdate)}`);
  }
  console.log("   OK");

  console.log("\nSmoke Referência IMS concluído com sucesso.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
