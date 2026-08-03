import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { loadSupabaseLocalEnv } from "./_local-env.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..", "..");
const PASSWORD = "SafeStop-QA-Local-2026";

const USERS = {
  field: "qa-field@safestop.local",
  multi: "qa-multi@safestop.local",
  supervisor: "qa-supervisor@safestop.local",
  lideranca: "qa-lideranca@safestop.local",
  fiscal: "qa-fiscal@safestop.local",
  platform: "qa-platform@safestop.local",
};

const QA_ALPHA = "b0000000-0000-4000-8000-000000000001";
const QA_ALPHA_AREA = "f0000000-0000-4000-8000-000000000001";
const QA_BETA_CONTRACTOR = "b0000000-0000-4000-8000-000000000002";

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
const VALID_IMS = "BAA-26-0001";
const UPDATED_IMS = "BAA-26-0002";
const UPDATE_REASON =
  "Correção do código IMS informado erroneamente no registro inicial.";

const results = [];

function record(id, status, detail) {
  results.push({ id, status, detail });
  console.log(`${status === "PASS" ? "PASS" : "FAIL"} ${id}: ${detail}`);
}

function readRepo(rel) {
  return readFileSync(join(REPO_ROOT, rel), "utf8");
}

function runQuery(sql) {
  execSync(`pnpm exec supabase db query --local ${JSON.stringify(sql)}`, {
    cwd: REPO_ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
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
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`RPC ${fn} HTTP ${response.status}: ${text}`);
  }
  return response.json();
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
  if (!create.success) throw new Error(JSON.stringify(create));
  const id = create.data.id;
  await rpc(apiUrl, anonKey, actorToken, "start_occurrence_evaluation", {
    p_occurrence_id: id,
  });
  const io = await rpc(apiUrl, anonKey, actorToken, "record_occurrence_decision", {
    p_payload: {
      occurrence_id: id,
      decision_type: "INTERDICAO_OFICIAL",
      decision_reason: IO_REASON,
    },
  });
  if (!io.success) throw new Error(JSON.stringify(io));
  return id;
}

async function prepareAwaitingIms(
  apiUrl,
  anonKey,
  fieldToken,
  supervisorToken,
  liderancaToken,
  title,
) {
  const occurrenceId = await createIoOcc(
    apiUrl,
    anonKey,
    fieldToken,
    supervisorToken,
    title,
  );
  const start = await rpc(apiUrl, anonKey, supervisorToken, "start_mdho_assessment", {
    p_occurrence_id: occurrenceId,
  });
  if (!start.success) throw new Error(JSON.stringify(start));
  const assessmentId = start.data.assessment.id;
  await rpc(apiUrl, anonKey, supervisorToken, "save_mdho_draft", {
    p_payload: {
      assessment_id: assessmentId,
      selections: buildValidSelections(),
      complement: "Complemento técnico MDHO para QA IMS.",
    },
  });
  await rpc(apiUrl, anonKey, supervisorToken, "submit_mdho_assessment", {
    p_assessment_id: assessmentId,
  });
  await rpc(apiUrl, anonKey, liderancaToken, "approve_mdho_assessment", {
    p_assessment_id: assessmentId,
  });
  return { occurrenceId, assessmentId };
}

async function timeline(apiUrl, anonKey, token, occurrenceId) {
  return rpc(apiUrl, anonKey, token, "get_occurrence_timeline", {
    p_occurrence_id: occurrenceId,
    p_limit: 40,
  });
}

async function main() {
  const { apiUrl, anonKey } = loadSupabaseLocalEnv();
  console.log("=== QA Sprint 2.8 — IMS-01 a IMS-16 + regressão ===\n");

  const field = await signIn(apiUrl, anonKey, USERS.field);
  const multi = await signIn(apiUrl, anonKey, USERS.multi);
  const supervisor = await signIn(apiUrl, anonKey, USERS.supervisor);
  const lideranca = await signIn(apiUrl, anonKey, USERS.lideranca);
  const fiscal = await signIn(apiUrl, anonKey, USERS.fiscal);
  const platform = await signIn(apiUrl, anonKey, USERS.platform);

  const mainFlow = await prepareAwaitingIms(
    apiUrl,
    anonKey,
    field.access_token,
    supervisor.access_token,
    lideranca.access_token,
    "IMS main",
  );
  const mainOccurrenceId = mainFlow.occurrenceId;

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
  if (invalidFormat.success === false && invalidFormat.error?.code === "VALIDATION_ERROR") {
    record("IMS-02", "PASS", "formato inválido → VALIDATION_ERROR");
  } else {
    record("IMS-02", "FAIL", JSON.stringify(invalidFormat));
  }

  const vaCreate = await rpc(apiUrl, anonKey, field.access_token, "create_occurrence", {
    payload: {
      organization_id: QA_ALPHA,
      area_id: QA_ALPHA_AREA,
      contractor_organization_id: QA_BETA_CONTRACTOR,
      title: "IMS-03 VA",
      task_description: "VA IMS",
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
    p_payload: {
      occurrence_id: vaId,
      decision_type: "VER_E_AGIR",
      decision_reason: VA_REASON,
    },
  });
  const vaRegister = await rpc(
    apiUrl,
    anonKey,
    supervisor.access_token,
    "register_ims_reference",
    {
      p_payload: { occurrence_id: vaId, ims_reference_code: VALID_IMS },
    },
  );
  const imsTypes = readRepo("packages/types/src/ims-reference.ts");
  if (
    vaRegister.success === false &&
    vaRegister.error?.code === "FORBIDDEN" &&
    imsTypes.includes('decisionType !== "INTERDICAO_OFICIAL"')
  ) {
    record("IMS-03", "PASS", "register VA → FORBIDDEN + seção ausente (shouldShowImsReferenceSection)");
  } else {
    record("IMS-03", "FAIL", JSON.stringify(vaRegister));
  }

  const fieldRegister = await rpc(
    apiUrl,
    anonKey,
    field.access_token,
    "register_ims_reference",
    {
      p_payload: { occurrence_id: mainOccurrenceId, ims_reference_code: VALID_IMS },
    },
  );
  if (fieldRegister.success === false && fieldRegister.error?.code === "FORBIDDEN") {
    record("IMS-04", "PASS", "qa-field sem permissão → FORBIDDEN");
  } else {
    record("IMS-04", "FAIL", JSON.stringify(fieldRegister));
  }

  const fiscalRegister = await rpc(
    apiUrl,
    anonKey,
    fiscal.access_token,
    "register_ims_reference",
    {
      p_payload: { occurrence_id: mainOccurrenceId, ims_reference_code: VALID_IMS },
    },
  );
  if (fiscalRegister.success === false && fiscalRegister.error?.code === "FORBIDDEN") {
    record("IMS-12", "PASS", "fiscal read-only → FORBIDDEN");
  } else {
    record("IMS-12", "FAIL", JSON.stringify(fiscalRegister));
  }

  const register = await rpc(
    apiUrl,
    anonKey,
    supervisor.access_token,
    "register_ims_reference",
    {
      p_payload: { occurrence_id: mainOccurrenceId, ims_reference_code: VALID_IMS },
    },
  );
  if (register.success && register.data?.occurrence?.status === "EM_TRATATIVA") {
    record("IMS-01", "PASS", "supervisor register → EM_TRATATIVA");
  } else {
    record("IMS-01", "FAIL", JSON.stringify(register));
  }

  const secondRegister = await rpc(
    apiUrl,
    anonKey,
    supervisor.access_token,
    "register_ims_reference",
    {
      p_payload: { occurrence_id: mainOccurrenceId, ims_reference_code: "BAA-26-9999" },
    },
  );
  if (secondRegister.success === false && secondRegister.error?.code === "ALREADY_REGISTERED") {
    record("IMS-05", "PASS", "segundo register → ALREADY_REGISTERED");
  } else {
    record("IMS-05", "FAIL", JSON.stringify(secondRegister));
  }

  const idempotent = await rpc(
    apiUrl,
    anonKey,
    supervisor.access_token,
    "register_ims_reference",
    {
      p_payload: { occurrence_id: mainOccurrenceId, ims_reference_code: VALID_IMS },
    },
  );
  if (idempotent.success && idempotent.data?.idempotent === true) {
    record("IMS-15", "PASS", "retry register idempotente");
  } else {
    record("IMS-15", "FAIL", JSON.stringify(idempotent));
  }

  const shortReason = await rpc(apiUrl, anonKey, supervisor.access_token, "update_ims_reference", {
    p_payload: {
      occurrence_id: mainOccurrenceId,
      ims_reference_code: UPDATED_IMS,
      update_reason: "curto",
    },
  });
  if (shortReason.success === false && shortReason.error?.code === "VALIDATION_ERROR") {
    record("IMS-07", "PASS", "update_reason < 10 → VALIDATION_ERROR");
  } else {
    record("IMS-07", "FAIL", JSON.stringify(shortReason));
  }

  const update = await rpc(apiUrl, anonKey, supervisor.access_token, "update_ims_reference", {
    p_payload: {
      occurrence_id: mainOccurrenceId,
      ims_reference_code: UPDATED_IMS,
      update_reason: UPDATE_REASON,
    },
  });
  const tlAfterUpdate = await timeline(apiUrl, anonKey, supervisor.access_token, mainOccurrenceId);
  const updateItem = tlAfterUpdate.items?.find(
    (i) => i.title === "Referência IMS alterada" && i.metadata?.action === "update_ims",
  );
  if (
    update.success &&
    update.data?.occurrence?.ims_reference_code === UPDATED_IMS &&
    updateItem?.metadata?.previousCode &&
    updateItem?.metadata?.newCode
  ) {
    record("IMS-06", "PASS", "update + history metadata update_ims");
  } else {
    record("IMS-06", "FAIL", JSON.stringify({ update, updateItem }));
  }

  const tl = await timeline(apiUrl, anonKey, supervisor.access_token, mainOccurrenceId);
  const titles = tl.items?.map((i) => i.title) ?? [];
  if (
    titles.includes("Referência IMS registrada") &&
    titles.includes("Referência IMS alterada")
  ) {
    record("IMS-10", "PASS", "timeline registrada + alterada");
  } else {
    record("IMS-10", "FAIL", JSON.stringify(titles));
  }

  const searchResponse = await fetch(
    `${apiUrl}/rest/v1/occurrences?ims_reference_code=ilike.*${UPDATED_IMS}*&organization_id=eq.${QA_ALPHA}&select=id,ims_reference_code`,
    {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${supervisor.access_token}`,
      },
    },
  );
  const searchRows = await searchResponse.json();
  const found = searchRows.some((r) => r.id === mainOccurrenceId);
  if (searchResponse.ok && found) {
    record("IMS-09", "PASS", `pesquisa ilike encontra ${UPDATED_IMS} na org`);
  } else {
    record("IMS-09", "FAIL", JSON.stringify(searchRows));
  }

  const crossRegister = await rpc(apiUrl, anonKey, multi.access_token, "register_ims_reference", {
    p_payload: { occurrence_id: mainOccurrenceId, ims_reference_code: "BAA-26-8888" },
  });
  const crossUpdate = await rpc(apiUrl, anonKey, multi.access_token, "update_ims_reference", {
    p_payload: {
      occurrence_id: mainOccurrenceId,
      ims_reference_code: "BAA-26-8887",
      update_reason: UPDATE_REASON,
    },
  });
  if (
    crossRegister.success === false &&
    crossRegister.error?.code === "FORBIDDEN" &&
    crossUpdate.success === false &&
    crossUpdate.error?.code === "FORBIDDEN"
  ) {
    record("IMS-11", "PASS", "cross-tenant register/update → FORBIDDEN");
  } else {
    record("IMS-11", "FAIL", JSON.stringify({ crossRegister, crossUpdate }));
  }

  if (
    imsTypes.includes("if (input.context.isPlatformAdmin)") &&
    readRepo("apps/web/src/features/ims-reference/hooks/use-ims-reference-context.ts").includes(
      "isPlatformAdmin",
    )
  ) {
    record("IMS-13", "PASS", "Platform Admin sem mutations UI (!isPlatformAdmin)");
  } else {
    record("IMS-13", "FAIL", "guard Platform Admin ausente");
  }

  const registerForm = readRepo(
    "apps/mobile/src/features/ims-reference/components/ims-register-form.tsx",
  );
  const editDialog = readRepo("apps/mobile/src/features/ims-reference/components/ims-edit-dialog.tsx");
  if (
    registerForm.includes("!isOnline") &&
    registerForm.includes("offlineToast") &&
    editDialog.includes("!isOnline")
  ) {
    record("IMS-14", "PASS", "offline bloqueia register/update mobile");
  } else {
    record("IMS-14", "FAIL", "guard offline ausente");
  }

  const closedFlow = await prepareAwaitingIms(
    apiUrl,
    anonKey,
    field.access_token,
    supervisor.access_token,
    lideranca.access_token,
    "IMS-08 closed",
  );
  await rpc(apiUrl, anonKey, supervisor.access_token, "register_ims_reference", {
    p_payload: { occurrence_id: closedFlow.occurrenceId, ims_reference_code: "BAA-26-0100" },
  });
  runQuery(
    `update public.occurrences set status = 'ENCERRADA' where id = '${closedFlow.occurrenceId}';`,
  );
  const closedUpdate = await rpc(
    apiUrl,
    anonKey,
    supervisor.access_token,
    "update_ims_reference",
    {
      p_payload: {
        occurrence_id: closedFlow.occurrenceId,
        ims_reference_code: "BAA-26-0101",
        update_reason: "Tentativa inválida de correção após encerramento da ocorrência.",
      },
    },
  );
  if (closedUpdate.success === false && closedUpdate.error?.code === "STATUS_MISMATCH") {
    record("IMS-08", "PASS", "update pós-ENCERRADA → STATUS_MISMATCH");
  } else {
    record("IMS-08", "FAIL", JSON.stringify(closedUpdate));
  }

  console.log("\n=== Regressão HSE / MDHO / IO / VA / timeline (IMS-16) ===\n");

  const hseQueue = await rpc(
    apiUrl,
    anonKey,
    lideranca.access_token,
    "list_mdho_pending_approvals",
    { p_organization_id: QA_ALPHA, p_limit: 10 },
  );
  const regIo = await createIoOcc(
    apiUrl,
    anonKey,
    field.access_token,
    supervisor.access_token,
    "REG IO",
  );
  const regVa = await rpc(apiUrl, anonKey, field.access_token, "create_occurrence", {
    payload: {
      organization_id: QA_ALPHA,
      area_id: QA_ALPHA_AREA,
      contractor_organization_id: QA_BETA_CONTRACTOR,
      title: "REG VA",
      task_description: "REG VA",
      location_description: "Local",
      condition_description: "Condição",
      severity: "HIGH",
    },
  });
  await rpc(apiUrl, anonKey, supervisor.access_token, "start_occurrence_evaluation", {
    p_occurrence_id: regVa.data.id,
  });
  const vaDec = await rpc(apiUrl, anonKey, supervisor.access_token, "record_occurrence_decision", {
    p_payload: {
      occurrence_id: regVa.data.id,
      decision_type: "VER_E_AGIR",
      decision_reason: VA_REASON,
    },
  });
  const regTl = await timeline(apiUrl, anonKey, field.access_token, regIo);
  const mdhoStart = await rpc(apiUrl, anonKey, supervisor.access_token, "start_mdho_assessment", {
    p_occurrence_id: regIo,
  });

  if (
    hseQueue.success &&
    Array.isArray(hseQueue.items) &&
    regIo &&
    vaDec.success &&
    regTl.success &&
    mdhoStart.success
  ) {
    record("IMS-16", "PASS", "HSE fila + IO + VA + timeline + MDHO start intactos");
  } else {
    record("IMS-16", "FAIL", "regressão incompleta");
  }

  console.log("\n=== RESUMO IMS ===");
  const imsResults = results.filter((r) => r.id.startsWith("IMS-"));
  const pass = imsResults.filter((r) => r.status === "PASS").length;
  const fail = imsResults.filter((r) => r.status === "FAIL").length;
  console.log(`PASS: ${pass}/${imsResults.length} | FAIL: ${fail}/${imsResults.length}`);

  if (fail > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
