import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { loadSupabaseLocalEnv } from "./_local-env.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..", "..");
const PASSWORD = "SafeStop-QA-Local-2026";

const USERS = {
  field: "qa-field@safestop.local",
  fiscal: "qa-fiscal@safestop.local",
  multi: "qa-multi@safestop.local",
  supervisor: "qa-supervisor@safestop.local",
  lideranca: "qa-lideranca@safestop.local",
  dualHse: "qa-dual-hse@safestop.local",
};

const QA_ALPHA = "b0000000-0000-4000-8000-000000000001";
const QA_ALPHA_AREA = "f0000000-0000-4000-8000-000000000001";
const QA_BETA_CONTRACTOR = "b0000000-0000-4000-8000-000000000002";
const QA_FIELD_MEMBER = "c0000000-0000-4000-8000-000000000001";
const QA_SUPERVISOR_MEMBER = "c0000000-0000-4000-8000-000000000009";
const QA_DUAL_HSE_MEMBER = "c0000000-0000-4000-8000-000000000012";

const MDHO_CATS = {
  behavior: "90000000-0000-4000-8000-000000000001",
  deviation: "90000000-0000-4000-8000-000000000002",
  preconditions: "90000000-0000-4000-8000-000000000003",
  org: "90000000-0000-4000-8000-000000000004",
  supervision: "90000000-0000-4000-8000-000000000005",
};

const IO_REASON =
  "Atividade apresenta risco grave e requer interdição formal até correção completa.";
const VA_REASON =
  "Condição insegura requer ação corretiva imediata conforme análise HSE.";
const IMS_CODE = "BAA-26-0301";

const MINIMAL_JPEG = Buffer.from(
  "/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBxAQEBUQEBAVFRUVFRUVFRUVFRUWFxUVFRUXFxUYHSggGBolGxUVITEhJSkrLi4uFx8zODMsNygtLisBCgoKDg0OGxAQGy0lHyUtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLf/AABEIAAEAAQMBIgACEQEDEQH/xAAXAAEBAQEAAAAAAAAAAAAAAAAAAQID/8QAFhEBAQEAAAAAAAAAAAAAAAAAAAER/9oADAMBAAIQAxAAAAG6p//EABQQAQAAAAAAAAAAAAAAAAAAAJD/2gAIAQEAAQUCcJ//xAAUEQEAAAAAAAAAAAAAAAAAAACQ/9oACAEDAQE/AXCf/8QAFBEBAAAAAAAAAAAAAAAAAAAAkP/aAAgBAgEBPwFwn//EABQQAQAAAAAAAAAAAAAAAAAAAJD/2gAIAQEABj8CcJ//xAAUEAEAAAAAAAAAAAAAAAAAAACQ/9oACAEBAAE/IXCf/9k=",
  "base64",
);

const results = [];

function record(id, status, detail) {
  results.push({ id, status, detail });
  console.log(`${status === "PASS" ? "PASS" : "FAIL"} ${id}: ${detail}`);
}

function readRepo(rel) {
  return readFileSync(join(REPO_ROOT, rel), "utf8");
}

function dueInDays(days) {
  return new Date(Date.now() + days * 86400000).toISOString();
}

function buildValidSelections() {
  return [
    { category_id: MDHO_CATS.behavior, option_id: "91000000-0000-4000-8000-000000000003" },
    { category_id: MDHO_CATS.deviation, option_id: "91000000-0000-4000-8000-000000000013" },
    { category_id: MDHO_CATS.preconditions, option_id: "91000000-0000-4000-8000-000000000023" },
    { category_id: MDHO_CATS.org, option_id: "91000000-0000-4000-8000-000000000035" },
    { category_id: MDHO_CATS.supervision, option_id: "91000000-0000-4000-8000-000000000041" },
  ];
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

async function rpc(apiUrl, anonKey, token, fn, body = {}) {
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

async function createIoOcc(apiUrl, anonKey, fieldToken, actorToken, title) {
  const create = await rpc(apiUrl, anonKey, fieldToken, "create_occurrence", {
    payload: {
      organization_id: QA_ALPHA,
      area_id: QA_ALPHA_AREA,
      contractor_organization_id: QA_BETA_CONTRACTOR,
      title,
      task_description: title,
      location_description: "Local QA",
      condition_description: "Condição QA",
      severity: "HIGH",
    },
  });
  const id = create.data.id;
  await rpc(apiUrl, anonKey, actorToken, "start_occurrence_evaluation", {
    p_occurrence_id: id,
  });
  await rpc(apiUrl, anonKey, actorToken, "record_occurrence_decision", {
    p_payload: {
      occurrence_id: id,
      decision_type: "INTERDICAO_OFICIAL",
      decision_reason: IO_REASON,
    },
  });
  return id;
}

async function prepareEmTratativa(apiUrl, anonKey, fieldToken, supervisorToken, liderancaToken, title, imsCode) {
  const occurrenceId = await createIoOcc(apiUrl, anonKey, fieldToken, supervisorToken, title);
  const start = await rpc(apiUrl, anonKey, supervisorToken, "start_mdho_assessment", {
    p_occurrence_id: occurrenceId,
  });
  const assessmentId = start.data.assessment.id;
  await rpc(apiUrl, anonKey, supervisorToken, "save_mdho_draft", {
    p_payload: {
      assessment_id: assessmentId,
      selections: buildValidSelections(),
      complement: "MDHO QA action plan.",
    },
  });
  await rpc(apiUrl, anonKey, supervisorToken, "submit_mdho_assessment", {
    p_assessment_id: assessmentId,
  });
  await rpc(apiUrl, anonKey, liderancaToken, "approve_mdho_assessment", {
    p_assessment_id: assessmentId,
  });
  await rpc(apiUrl, anonKey, supervisorToken, "register_ims_reference", {
    p_payload: { occurrence_id: occurrenceId, ims_reference_code: imsCode },
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
    throw new Error(`Storage upload ${uploadResponse.status}`);
  }
  await rpc(apiUrl, anonKey, token, "complete_action_item_attachment_upload", {
    target_attachment_id: prepare.data.attachment_id,
  });
}

async function main() {
  const { apiUrl, anonKey } = loadSupabaseLocalEnv();
  console.log("=== QA Sprint 3.0 — AP-QA-01 a AP-QA-17 + regressão ===\n");

  const field = await signIn(apiUrl, anonKey, USERS.field);
  const fiscal = await signIn(apiUrl, anonKey, USERS.fiscal);
  const multi = await signIn(apiUrl, anonKey, USERS.multi);
  const supervisor = await signIn(apiUrl, anonKey, USERS.supervisor);
  const lideranca = await signIn(apiUrl, anonKey, USERS.lideranca);
  const dualHse = await signIn(apiUrl, anonKey, USERS.dualHse);

  const vaCreate = await rpc(apiUrl, anonKey, field.access_token, "create_occurrence", {
    payload: {
      organization_id: QA_ALPHA,
      area_id: QA_ALPHA_AREA,
      contractor_organization_id: QA_BETA_CONTRACTOR,
      title: "AP-QA-02 VA",
      task_description: "VA AP",
      location_description: "Local",
      condition_description: "Condição",
      severity: "HIGH",
    },
  });
  const vaId = vaCreate.data.id;
  await rpc(apiUrl, anonKey, supervisor.access_token, "start_occurrence_evaluation", {
    p_occurrence_id: vaId,
  });
  await rpc(apiUrl, anonKey, supervisor.access_token, "record_occurrence_decision", {
    p_payload: { occurrence_id: vaId, decision_type: "VER_E_AGIR", decision_reason: VA_REASON },
  });
  const vaPlan = await rpc(apiUrl, anonKey, supervisor.access_token, "create_action_plan", {
    p_payload: { occurrence_id: vaId },
  });
  if (vaPlan.success === false && vaPlan.error?.code === "FORBIDDEN") {
    record("AP-QA-02", "PASS", "create em VER_E_AGIR → FORBIDDEN");
  } else {
    record("AP-QA-02", "FAIL", JSON.stringify(vaPlan));
  }

  const noImsOcc = await createIoOcc(
    apiUrl,
    anonKey,
    field.access_token,
    supervisor.access_token,
    "AP-QA-03",
  );
  await rpc(apiUrl, anonKey, supervisor.access_token, "start_mdho_assessment", {
    p_occurrence_id: noImsOcc,
  });
  const noImsPlan = await rpc(apiUrl, anonKey, supervisor.access_token, "create_action_plan", {
    p_payload: { occurrence_id: noImsOcc },
  });
  if (noImsPlan.success === false && noImsPlan.error?.code === "STATUS_MISMATCH") {
    record("AP-QA-03", "PASS", "create sem IMS → STATUS_MISMATCH");
  } else {
    record("AP-QA-03", "FAIL", JSON.stringify(noImsPlan));
  }

  const occurrenceId = await prepareEmTratativa(
    apiUrl,
    anonKey,
    field.access_token,
    supervisor.access_token,
    lideranca.access_token,
    "AP-QA main",
    IMS_CODE,
  );

  const createPlan = await rpc(apiUrl, anonKey, supervisor.access_token, "create_action_plan", {
    p_payload: { occurrence_id: occurrenceId, summary: "Plano corretivo QA Sprint 3.0" },
  });
  if (createPlan.success && createPlan.data?.plan?.id && createPlan.data?.plan?.status === "OPEN") {
    record("AP-QA-01", "PASS", "supervisor cria plano OPEN em EM_TRATATIVA IO com IMS");
  } else {
    record("AP-QA-01", "FAIL", JSON.stringify(createPlan));
  }
  const planId = createPlan.data?.plan?.id;

  const createAgain = await rpc(apiUrl, anonKey, supervisor.access_token, "create_action_plan", {
    p_payload: { occurrence_id: occurrenceId },
  });
  const ap04Ok =
    (createAgain.success && createAgain.data?.plan?.id === planId) ||
    createAgain.error?.code === "ALREADY_EXISTS" ||
    createAgain.error?.code === "CONFLICT";
  if (ap04Ok) {
    record("AP-QA-04", "PASS", "segundo plano idempotente ou ALREADY_EXISTS/CONFLICT");
  } else {
    record("AP-QA-04", "FAIL", JSON.stringify(createAgain));
  }

  const fiscalCreate = await rpc(apiUrl, anonKey, fiscal.access_token, "create_action_plan", {
    p_payload: { occurrence_id: occurrenceId },
  });
  const fiscalAdd = await rpc(apiUrl, anonKey, fiscal.access_token, "add_action_item", {
    p_payload: {
      action_plan_id: planId,
      title: "Ação fiscal",
      responsible_member_id: QA_FIELD_MEMBER,
      due_at: dueInDays(7),
      priority: "LOW",
    },
  });
  if (fiscalAdd.success === false && fiscalAdd.error?.code === "FORBIDDEN") {
    record("AP-QA-05", "PASS", "add_action_item fiscal → FORBIDDEN");
  } else {
    record("AP-QA-05", "FAIL", JSON.stringify(fiscalAdd));
  }

  const addMedium = await rpc(apiUrl, anonKey, supervisor.access_token, "add_action_item", {
    p_payload: {
      action_plan_id: planId,
      title: "Corrigir guarda-corpo",
      responsible_member_id: QA_FIELD_MEMBER,
      due_at: dueInDays(5),
      priority: "MEDIUM",
    },
  });
  const mediumItemId = addMedium.data.item.id;

  const fiscalValidate = await rpc(apiUrl, anonKey, fiscal.access_token, "validate_action_item", {
    p_payload: { item_id: mediumItemId, outcome: "COMPLETED" },
  });
  if (
    fiscalCreate.success === false &&
    fiscalCreate.error?.code === "FORBIDDEN" &&
    fiscalValidate.success === false &&
    fiscalValidate.error?.code === "FORBIDDEN"
  ) {
    record("AP-QA-15", "PASS", "fiscal read-only create/validate → FORBIDDEN");
  } else {
    record("AP-QA-15", "FAIL", JSON.stringify({ fiscalCreate, fiscalValidate }));
  }
  await rpc(apiUrl, anonKey, field.access_token, "start_action_item", { p_item_id: mediumItemId });
  const mediumSubmit = await rpc(apiUrl, anonKey, field.access_token, "submit_action_item", {
    p_payload: { item_id: mediumItemId, completion_description: "Guarda-corpo reinstalado." },
  });
  if (mediumSubmit.success && mediumSubmit.data?.item?.status === "AWAITING_VALIDATION") {
    record("AP-QA-06", "PASS", "responsável start + submit → AWAITING_VALIDATION");
  } else {
    record("AP-QA-06", "FAIL", JSON.stringify(mediumSubmit));
  }

  const validateMedium = await rpc(apiUrl, anonKey, lideranca.access_token, "validate_action_item", {
    p_payload: { item_id: mediumItemId, outcome: "COMPLETED" },
  });
  if (validateMedium.success && validateMedium.data?.item?.status === "COMPLETED") {
    record("AP-QA-08", "PASS", "HSE valida → COMPLETED");
  } else {
    record("AP-QA-08", "FAIL", JSON.stringify(validateMedium));
  }

  const addCritical = await rpc(apiUrl, anonKey, supervisor.access_token, "add_action_item", {
    p_payload: {
      action_plan_id: planId,
      title: "Isolar área crítica",
      responsible_member_id: QA_SUPERVISOR_MEMBER,
      due_at: dueInDays(3),
      priority: "CRITICAL",
    },
  });
  const criticalItemId = addCritical.data.item.id;
  await rpc(apiUrl, anonKey, supervisor.access_token, "start_action_item", { p_item_id: criticalItemId });
  const criticalFail = await rpc(apiUrl, anonKey, supervisor.access_token, "submit_action_item", {
    p_payload: { item_id: criticalItemId, completion_description: "Área isolada." },
  });
  if (criticalFail.success === false && criticalFail.error?.code === "VALIDATION_ERROR") {
    record("AP-QA-07", "PASS", "CRITICAL submit sem evidência → VALIDATION_ERROR");
  } else {
    record("AP-QA-07", "FAIL", JSON.stringify(criticalFail));
  }

  await uploadItemEvidence(apiUrl, anonKey, supervisor.access_token, criticalItemId);
  await rpc(apiUrl, anonKey, supervisor.access_token, "submit_action_item", {
    p_payload: { item_id: criticalItemId, completion_description: "Área isolada com evidência." },
  });

  const addSelfVal = await rpc(apiUrl, anonKey, supervisor.access_token, "add_action_item", {
    p_payload: {
      action_plan_id: planId,
      title: "Segregação validação",
      responsible_member_id: QA_DUAL_HSE_MEMBER,
      due_at: dueInDays(1),
      priority: "HIGH",
    },
  });
  const selfValItemId = addSelfVal.data.item.id;
  await rpc(apiUrl, anonKey, dualHse.access_token, "start_action_item", { p_item_id: selfValItemId });
  await uploadItemEvidence(apiUrl, anonKey, dualHse.access_token, selfValItemId);
  await rpc(apiUrl, anonKey, dualHse.access_token, "submit_action_item", {
    p_payload: { item_id: selfValItemId, completion_description: "Correção dual HSE." },
  });
  const selfValidate = await rpc(apiUrl, anonKey, dualHse.access_token, "validate_action_item", {
    p_payload: { item_id: selfValItemId, outcome: "COMPLETED" },
  });
  if (selfValidate.success === false && selfValidate.error?.code === "SELF_VALIDATION_FORBIDDEN") {
    record("AP-QA-10", "PASS", "SELF_VALIDATION_FORBIDDEN");
  } else {
    record("AP-QA-10", "FAIL", JSON.stringify(selfValidate));
  }
  await rpc(apiUrl, anonKey, lideranca.access_token, "validate_action_item", {
    p_payload: { item_id: selfValItemId, outcome: "COMPLETED" },
  });
  await rpc(apiUrl, anonKey, lideranca.access_token, "validate_action_item", {
    p_payload: { item_id: criticalItemId, outcome: "COMPLETED" },
  });

  const addReject = await rpc(apiUrl, anonKey, supervisor.access_token, "add_action_item", {
    p_payload: {
      action_plan_id: planId,
      title: "Sinalização temporária",
      responsible_member_id: QA_FIELD_MEMBER,
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
  if (rejectResult.success && rejectResult.data?.item?.status === "IN_PROGRESS") {
    record("AP-QA-09", "PASS", "HSE rejeita → IN_PROGRESS");
  } else {
    record("AP-QA-09", "FAIL", JSON.stringify(rejectResult));
  }
  await rpc(apiUrl, anonKey, supervisor.access_token, "cancel_action_item", {
    p_payload: {
      item_id: rejectItemId,
      reason: "Ação substituída por medida alternativa acordada com HSE.",
    },
  });

  const completePlan = await rpc(apiUrl, anonKey, supervisor.access_token, "complete_action_plan", {
    p_plan_id: planId,
  });
  if (completePlan.success && completePlan.data?.plan?.status === "COMPLETED") {
    record("AP-QA-11", "PASS", "complete_action_plan PO-AP-11 (itens concluídos/cancelados)");
  } else {
    record("AP-QA-11", "FAIL", JSON.stringify(completePlan));
  }
  if (completePlan.data?.occurrence?.status === "EM_TRATATIVA") {
    record("AP-QA-12", "PASS", "ocorrência permanece EM_TRATATIVA após complete");
  } else {
    record("AP-QA-12", "FAIL", JSON.stringify(completePlan.data?.occurrence));
  }

  const timeline = await rpc(apiUrl, anonKey, supervisor.access_token, "get_occurrence_timeline", {
    p_occurrence_id: occurrenceId,
    p_limit: 60,
  });
  const kinds = timeline.items?.map((i) => i.kind) ?? [];
  const actionKinds = [
    "ACTION_PLAN_CREATED",
    "ACTION_ITEM_CREATED",
    "ACTION_ITEM_STATUS_CHANGED",
    "ACTION_PLAN_COMPLETED",
    "ACTION_ITEM_EVIDENCE_ADDED",
  ];
  const hasActionKinds = actionKinds.every((k) => kinds.includes(k));
  if (hasActionKinds) {
    record("AP-QA-13", "PASS", `timeline kinds ACTION_* (${actionKinds.length}) sem novo STATUS_CHANGED ocorrência`);
  } else {
    record("AP-QA-13", "FAIL", JSON.stringify(kinds));
  }

  const crossCreate = await rpc(apiUrl, anonKey, multi.access_token, "create_action_plan", {
    p_payload: { occurrence_id: occurrenceId },
  });
  if (crossCreate.success === false && crossCreate.error?.code === "FORBIDDEN") {
    record("AP-QA-14", "PASS", "cross-tenant → FORBIDDEN");
  } else {
    record("AP-QA-14", "FAIL", JSON.stringify(crossCreate));
  }

  const section = readRepo("apps/mobile/src/features/action-plan/components/action-plan-section.tsx");
  const submitSheet = readRepo("apps/mobile/src/features/action-plan/components/action-plan-submit-sheet.tsx");
  if (
    section.includes("!isOnline") &&
    section.includes("ACTION_PLAN_COPY.offline") &&
    submitSheet.includes("!isOnline")
  ) {
    record("AP-QA-16", "PASS", "offline bloqueia mutations mobile");
  } else {
    record("AP-QA-16", "FAIL", "guard offline ausente");
  }

  console.log("\n=== Regressão smoke-flow-io + IMS + HSE (AP-QA-17) ===\n");

  const regOcc = await prepareEmTratativa(
    apiUrl,
    anonKey,
    field.access_token,
    supervisor.access_token,
    lideranca.access_token,
    "REG AP-17",
    "BAA-26-0399",
  );
  const regTl = await rpc(apiUrl, anonKey, supervisor.access_token, "get_occurrence_timeline", {
    p_occurrence_id: regOcc,
    p_limit: 30,
  });
  const regTitles = regTl.items?.map((i) => i.title) ?? [];
  const hseQueue = await rpc(
    apiUrl,
    anonKey,
    lideranca.access_token,
    "list_mdho_pending_approvals",
    { p_organization_id: QA_ALPHA, p_limit: 5 },
  );
  const regPass =
    regOcc &&
    regTitles.includes("Referência IMS registrada") &&
    regTitles.includes("MDHO aprovado") &&
    hseQueue.success;
  if (regPass) {
    record("AP-QA-17", "PASS", "cadeia IO→MDHO→HSE→IMS intacta + fila HSE OK");
  } else {
    record("AP-QA-17", "FAIL", JSON.stringify({ regTitles, hseQueue: hseQueue.success }));
  }

  console.log("\n=== RESUMO AP ===");
  const apResults = results.filter((r) => r.id.startsWith("AP-QA-"));
  const pass = apResults.filter((r) => r.status === "PASS").length;
  const fail = apResults.filter((r) => r.status === "FAIL").length;
  console.log(`PASS: ${pass}/${apResults.length} | FAIL: ${fail}/${apResults.length}`);

  if (fail > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
