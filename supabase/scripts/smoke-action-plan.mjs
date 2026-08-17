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
const QA_MULTI_EMAIL = "qa-multi@safestop.local";
const QA_SUPERVISOR_EMAIL = "qa-supervisor@safestop.local";
const QA_LIDERANCA_EMAIL = "qa-lideranca@safestop.local";
const QA_DUAL_HSE_EMAIL = "qa-dual-hse@safestop.local";

const QA_FIELD_MEMBER_ID = "c0000000-0000-4000-8000-000000000001";
const QA_SUPERVISOR_MEMBER_ID = "c0000000-0000-4000-8000-000000000009";
const QA_DUAL_HSE_MEMBER_ID = "c0000000-0000-4000-8000-000000000012";

const MDHO_CAT_BEHAVIOR = "90000000-0000-4000-8000-000000000001";
const MDHO_CAT_DEVIATION = "90000000-0000-4000-8000-000000000002";
const MDHO_CAT_PRECONDITIONS = "90000000-0000-4000-8000-000000000003";
const MDHO_CAT_ORG = "90000000-0000-4000-8000-000000000004";
const MDHO_CAT_SUPERVISION = "90000000-0000-4000-8000-000000000005";

const IMS_CODES = {
  MAIN: "BAA-26-0201",
  "NO-IMS": null,
};
const MINIMAL_JPEG = Buffer.from(
  "/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBxAQEBUQEBAVFRUVFRUVFRUVFRUWFxUVFRUXFxUYHSggGBolGxUVITEhJSkrLi4uFx8zODMsNygtLisBCgoKDg0OGxAQGy0lHyUtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLf/AABEIAAEAAQMBIgACEQEDEQH/xAAXAAEBAQEAAAAAAAAAAAAAAAAAAQID/8QAFhEBAQEAAAAAAAAAAAAAAAAAAAER/9oADAMBAAIQAxAAAAG6p//EABQQAQAAAAAAAAAAAAAAAAAAAJD/2gAIAQEAAQUCcJ//xAAUEQEAAAAAAAAAAAAAAAAAAACQ/9oACAEDAQE/AXCf/8QAFBEBAAAAAAAAAAAAAAAAAAAAkP/aAAgBAgEBPwFwn//EABQQAQAAAAAAAAAAAAAAAAAAAJD/2gAIAQEABj8CcJ//xAAUEAEAAAAAAAAAAAAAAAAAAACQ/9oACAEBAAE/IXCf/9k=",
  "base64",
);

function loadPassword() {
  try {
    const raw = readFileSync(join(__dirname, "..", "qa-credentials.local"), "utf8");
    const match = raw.match(/^QA_TEST_USER_PASSWORD=(.+)$/m);
    if (match?.[1]) return match[1].trim();
  } catch {
    // fallback
  }
  return PASSWORD;
}

async function signIn(apiUrl, anonKey, email, password) {
  const response = await fetch(`${apiUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: anonKey, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) throw new Error(`Login falhou para ${email}`);
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
  const data = await response.json();
  if (!response.ok) {
    throw new Error(`RPC ${fn} HTTP ${response.status}: ${JSON.stringify(data)}`);
  }
  return data;
}

function buildPpPayload(suffix) {
  return {
    organization_id: QA_ALPHA_ORG_ID,
    area_id: QA_ALPHA_AREA_ID,
    contractor_organization_id: QA_ALPHA_CONTRACTOR_ID,
    title: `QA action plan ${suffix}`,
    task_description: "Smoke Plano de Ação Sprint 3.0",
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

function assertOk(label, condition, detail) {
  if (!condition) throw new Error(`${label} falhou: ${detail}`);
  console.log(`   OK — ${label}`);
}

function dueInDays(days) {
  return new Date(Date.now() + days * 86400000).toISOString();
}

async function createIoOccurrence(apiUrl, anonKey, fieldToken, supervisorToken, suffix) {
  const createResult = await rpc(apiUrl, anonKey, fieldToken, "create_occurrence", {
    payload: buildPpPayload(suffix),
  });
  const occurrenceId = createResult.data.id;
  await rpc(apiUrl, anonKey, supervisorToken, "start_occurrence_evaluation", {
    p_occurrence_id: occurrenceId,
  });
  await rpc(apiUrl, anonKey, supervisorToken, "record_occurrence_decision", {
    p_payload: {
      occurrence_id: occurrenceId,
      decision_type: "INTERDICAO_OFICIAL",
      decision_reason:
        "Atividade apresenta risco grave e requer interdição formal até correção completa.",
    },
  });
  return occurrenceId;
}

async function prepareEmTratativa(apiUrl, anonKey, fieldToken, supervisorToken, liderancaToken, suffix) {
  const occurrenceId = await createIoOccurrence(apiUrl, anonKey, fieldToken, supervisorToken, suffix);
  const startMdho = await rpc(apiUrl, anonKey, supervisorToken, "start_mdho_assessment", {
    p_occurrence_id: occurrenceId,
  });
  const assessmentId = startMdho.data.assessment.id;
  await rpc(apiUrl, anonKey, supervisorToken, "save_mdho_draft", {
    p_payload: {
      assessment_id: assessmentId,
      selections: buildValidSelections(),
      complement: "MDHO smoke action plan.",
    },
  });
  await rpc(apiUrl, anonKey, supervisorToken, "submit_mdho_assessment", {
    p_assessment_id: assessmentId,
  });
  await rpc(apiUrl, anonKey, liderancaToken, "approve_mdho_assessment", {
    p_assessment_id: assessmentId,
  });
  await rpc(apiUrl, anonKey, supervisorToken, "register_ims_reference", {
    p_payload: { occurrence_id: occurrenceId, ims_reference_code: IMS_CODES[suffix] ?? `BAA-26-${String(Math.floor(Math.random() * 9000) + 1000)}` },
  });
  return occurrenceId;
}

async function uploadItemEvidence(apiUrl, anonKey, token, itemId) {
  const prepare = await rpc(apiUrl, anonKey, token, "prepare_action_item_attachment_upload", {
    payload: {
      action_item_id: itemId,
      original_file_name: "evidencia-acao.jpg",
      mime_type: "image/jpeg",
      file_size: MINIMAL_JPEG.byteLength,
    },
  });
  const { bucket, storage_path: storagePath } = prepare.data;
  const encodedPath = storagePath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  const uploadResponse = await fetch(`${apiUrl}/storage/v1/object/${bucket}/${encodedPath}`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${token}`,
      "Content-Type": "image/jpeg",
      "x-upsert": "false",
    },
    body: MINIMAL_JPEG,
  });
  if (!uploadResponse.ok) {
    const text = await uploadResponse.text();
    throw new Error(`Storage upload falhou (${uploadResponse.status}): ${text}`);
  }
  await rpc(apiUrl, anonKey, token, "complete_action_item_attachment_upload", {
    target_attachment_id: prepare.data.attachment_id,
  });
}

async function main() {
  const password = loadPassword();
  const { apiUrl, anonKey } = loadSupabaseLocalEnv();

  console.log("=== Smoke Plano de Ação (Sprint 3.0) ===\n");

  const field = await signIn(apiUrl, anonKey, QA_FIELD_EMAIL, password);
  const fiscal = await signIn(apiUrl, anonKey, QA_FISCAL_EMAIL, password);
  const multi = await signIn(apiUrl, anonKey, QA_MULTI_EMAIL, password);
  const supervisor = await signIn(apiUrl, anonKey, QA_SUPERVISOR_EMAIL, password);
  const lideranca = await signIn(apiUrl, anonKey, QA_LIDERANCA_EMAIL, password);
  const dualHse = await signIn(apiUrl, anonKey, QA_DUAL_HSE_EMAIL, password);

  console.log("AP-QA-02 — create em VER_E_AGIR → FORBIDDEN...");
  const vaOcc = await rpc(apiUrl, anonKey, field.access_token, "create_occurrence", {
    payload: buildPpPayload("VA-AP"),
  });
  await rpc(apiUrl, anonKey, supervisor.access_token, "start_occurrence_evaluation", {
    p_occurrence_id: vaOcc.data.id,
  });
  await rpc(apiUrl, anonKey, supervisor.access_token, "record_occurrence_decision", {
    p_payload: {
      occurrence_id: vaOcc.data.id,
      decision_type: "VER_E_AGIR",
      decision_reason: "Condição insegura requer ação corretiva imediata conforme análise HSE.",
    },
  });
  const vaCreate = await rpc(apiUrl, anonKey, supervisor.access_token, "create_action_plan", {
    p_payload: { occurrence_id: vaOcc.data.id },
  });
  assertOk("VA create FORBIDDEN", !vaCreate.success && vaCreate.error?.code === "FORBIDDEN", JSON.stringify(vaCreate));

  console.log("AP-QA-03 — create sem IMS → STATUS_MISMATCH...");
  const noImsOcc = await createIoOccurrence(apiUrl, anonKey, field.access_token, supervisor.access_token, "NO-IMS");
  await rpc(apiUrl, anonKey, supervisor.access_token, "start_mdho_assessment", {
    p_occurrence_id: noImsOcc,
  });
  const noImsCreate = await rpc(apiUrl, anonKey, supervisor.access_token, "create_action_plan", {
    p_payload: { occurrence_id: noImsOcc },
  });
  assertOk(
    "sem IMS STATUS_MISMATCH",
    !noImsCreate.success && noImsCreate.error?.code === "STATUS_MISMATCH",
    JSON.stringify(noImsCreate),
  );

  console.log("AP-QA-01 — supervisor cria plano EM_TRATATIVA IO com IMS...");
  const occurrenceId = await prepareEmTratativa(
    apiUrl,
    anonKey,
    field.access_token,
    supervisor.access_token,
    lideranca.access_token,
    "MAIN",
  );
  const createPlan = await rpc(apiUrl, anonKey, supervisor.access_token, "create_action_plan", {
    p_payload: { occurrence_id: occurrenceId, summary: "Plano corretivo integrado smoke 3.0" },
  });
  assertOk("create_action_plan", createPlan.success, JSON.stringify(createPlan));
  const planId = createPlan.data.plan.id;

  console.log("AP-QA-04 — segundo create idempotente...");
  const createAgain = await rpc(apiUrl, anonKey, supervisor.access_token, "create_action_plan", {
    p_payload: { occurrence_id: occurrenceId },
  });
  assertOk(
    "idempotente mesmo plan_id",
    createAgain.success && createAgain.data.plan.id === planId,
    JSON.stringify(createAgain),
  );

  console.log("AP-QA-05 — fiscal add_action_item → FORBIDDEN...");
  const fiscalAdd = await rpc(apiUrl, anonKey, fiscal.access_token, "add_action_item", {
    p_payload: {
      action_plan_id: planId,
      title: "Ação fiscal",
      responsible_member_id: QA_FIELD_MEMBER_ID,
      due_at: dueInDays(7),
      priority: "LOW",
    },
  });
  assertOk("fiscal add FORBIDDEN", !fiscalAdd.success && fiscalAdd.error?.code === "FORBIDDEN", JSON.stringify(fiscalAdd));

  console.log("AP-QA-06 — responsável start + submit (MEDIUM)...");
  const addMedium = await rpc(apiUrl, anonKey, supervisor.access_token, "add_action_item", {
    p_payload: {
      action_plan_id: planId,
      title: "Corrigir guarda-corpo",
      responsible_member_id: QA_FIELD_MEMBER_ID,
      due_at: dueInDays(5),
      priority: "MEDIUM",
    },
  });
  const mediumItemId = addMedium.data.item.id;
  await rpc(apiUrl, anonKey, field.access_token, "start_action_item", { p_item_id: mediumItemId });
  const mediumSubmit = await rpc(apiUrl, anonKey, field.access_token, "submit_action_item", {
    p_payload: { item_id: mediumItemId, completion_description: "Guarda-corpo reinstalado conforme NR." },
  });
  assertOk("submit AWAITING_VALIDATION", mediumSubmit.success && mediumSubmit.data.item.status === "AWAITING_VALIDATION", JSON.stringify(mediumSubmit));

  console.log("AP-QA-08 — HSE valida → COMPLETED...");
  const validateMedium = await rpc(apiUrl, anonKey, lideranca.access_token, "validate_action_item", {
    p_payload: { item_id: mediumItemId, outcome: "COMPLETED" },
  });
  assertOk("validate COMPLETED", validateMedium.success && validateMedium.data.item.status === "COMPLETED", JSON.stringify(validateMedium));

  console.log("AP-QA-07 — CRITICAL submit sem evidência → VALIDATION_ERROR...");
  const addCritical = await rpc(apiUrl, anonKey, supervisor.access_token, "add_action_item", {
    p_payload: {
      action_plan_id: planId,
      title: "Isolar área crítica",
      responsible_member_id: QA_SUPERVISOR_MEMBER_ID,
      due_at: dueInDays(3),
      priority: "CRITICAL",
    },
  });
  const criticalItemId = addCritical.data.item.id;
  await rpc(apiUrl, anonKey, supervisor.access_token, "start_action_item", { p_item_id: criticalItemId });
  const criticalSubmitFail = await rpc(apiUrl, anonKey, supervisor.access_token, "submit_action_item", {
    p_payload: { item_id: criticalItemId, completion_description: "Área isolada." },
  });
  assertOk(
    "CRITICAL sem evidência",
    !criticalSubmitFail.success && criticalSubmitFail.error?.code === "VALIDATION_ERROR",
    JSON.stringify(criticalSubmitFail),
  );

  await uploadItemEvidence(apiUrl, anonKey, supervisor.access_token, criticalItemId);
  const criticalSubmit = await rpc(apiUrl, anonKey, supervisor.access_token, "submit_action_item", {
    p_payload: { item_id: criticalItemId, completion_description: "Área isolada com evidência." },
  });
  assertOk("CRITICAL com evidência submit", criticalSubmit.success, JSON.stringify(criticalSubmit));

  console.log("AP-QA-10 — self-validation → SELF_VALIDATION_FORBIDDEN...");
  const addSelfVal = await rpc(apiUrl, anonKey, supervisor.access_token, "add_action_item", {
    p_payload: {
      action_plan_id: planId,
      title: "Teste segregação validação",
      responsible_member_id: QA_DUAL_HSE_MEMBER_ID,
      due_at: dueInDays(1),
      priority: "HIGH",
    },
  });
  const selfValItemId = addSelfVal.data.item.id;
  await rpc(apiUrl, anonKey, dualHse.access_token, "start_action_item", { p_item_id: selfValItemId });
  await uploadItemEvidence(apiUrl, anonKey, dualHse.access_token, selfValItemId);
  await rpc(apiUrl, anonKey, dualHse.access_token, "submit_action_item", {
    p_payload: { item_id: selfValItemId, completion_description: "Correção executada pelo dual HSE." },
  });
  const selfValidate = await rpc(apiUrl, anonKey, dualHse.access_token, "validate_action_item", {
    p_payload: { item_id: selfValItemId, outcome: "COMPLETED" },
  });
  assertOk(
    "SELF_VALIDATION_FORBIDDEN",
    !selfValidate.success && selfValidate.error?.code === "SELF_VALIDATION_FORBIDDEN",
    JSON.stringify(selfValidate),
  );

  await rpc(apiUrl, anonKey, lideranca.access_token, "validate_action_item", {
    p_payload: { item_id: selfValItemId, outcome: "COMPLETED" },
  });

  await rpc(apiUrl, anonKey, lideranca.access_token, "validate_action_item", {
    p_payload: { item_id: criticalItemId, outcome: "COMPLETED" },
  });

  console.log("AP-QA-09 — HSE rejeita → IN_PROGRESS...");
  const addReject = await rpc(apiUrl, anonKey, supervisor.access_token, "add_action_item", {
    p_payload: {
      action_plan_id: planId,
      title: "Sinalização temporária",
      responsible_member_id: QA_FIELD_MEMBER_ID,
      due_at: dueInDays(2),
      priority: "LOW",
    },
  });
  const rejectItemId = addReject.data.item.id;
  await rpc(apiUrl, anonKey, field.access_token, "start_action_item", { p_item_id: rejectItemId });
  await rpc(apiUrl, anonKey, field.access_token, "submit_action_item", {
    p_payload: { item_id: rejectItemId, completion_description: "Sinalização instalada." },
  });
  const rejectResult = await rpc(apiUrl, anonKey, lideranca.access_token, "validate_action_item", {
    p_payload: {
      item_id: rejectItemId,
      outcome: "REJECTED",
      note: "Evidência insuficiente — refazer sinalização conforme procedimento.",
    },
  });
  assertOk("reject IN_PROGRESS", rejectResult.success && rejectResult.data.item.status === "IN_PROGRESS", JSON.stringify(rejectResult));
  await rpc(apiUrl, anonKey, supervisor.access_token, "cancel_action_item", {
    p_payload: {
      item_id: rejectItemId,
      reason: "Ação substituída por medida alternativa acordada com HSE.",
    },
  });

  console.log("AP-QA-11/12 — complete_action_plan; ocorrência permanece EM_TRATATIVA...");
  const completePlan = await rpc(apiUrl, anonKey, supervisor.access_token, "complete_action_plan", {
    p_plan_id: planId,
  });
  assertOk("plano COMPLETED", completePlan.success && completePlan.data.plan.status === "COMPLETED", JSON.stringify(completePlan));
  assertOk(
    "ocorrência EM_TRATATIVA",
    completePlan.data.occurrence.status === "EM_TRATATIVA",
    JSON.stringify(completePlan.data),
  );

  console.log("AP-QA-13 — timeline kinds ACTION_*...");
  const timeline = await rpc(apiUrl, anonKey, supervisor.access_token, "get_occurrence_timeline", {
    p_occurrence_id: occurrenceId,
    p_limit: 50,
  });
  const kinds = new Set(timeline.items?.map((item) => item.kind) ?? []);
  for (const expected of [
    "ACTION_PLAN_CREATED",
    "ACTION_ITEM_CREATED",
    "ACTION_ITEM_STATUS_CHANGED",
    "ACTION_PLAN_COMPLETED",
    "ACTION_ITEM_EVIDENCE_ADDED",
  ]) {
    assertOk(`timeline kind ${expected}`, kinds.has(expected), JSON.stringify([...kinds]));
  }

  console.log("AP-QA-14 — cross-tenant create → FORBIDDEN...");
  const crossCreate = await rpc(apiUrl, anonKey, multi.access_token, "create_action_plan", {
    p_payload: { occurrence_id: occurrenceId },
  });
  assertOk("cross-tenant FORBIDDEN", !crossCreate.success && crossCreate.error?.code === "FORBIDDEN", JSON.stringify(crossCreate));

  console.log("\nSmoke Plano de Ação concluído com sucesso.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
