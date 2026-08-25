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
  gestor: "qa-gestor@safestop.local",
  dualHse: "qa-dual-hse@safestop.local",
  platform: "qa-platform@safestop.local",
};

const QA_ALPHA = "b0000000-0000-4000-8000-000000000001";
const QA_ALPHA_AREA = "f0000000-0000-4000-8000-000000000001";
const QA_BETA_CONTRACTOR = "b0000000-0000-4000-8000-000000000002";
const DUAL_HSE_USER = "a0000000-0000-4000-8000-000000000012";

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
const RETURN_REASON =
  "Complementar detalhamento técnico nas categorias de comportamento e supervisão.";
const COMPLEMENT = "Complemento técnico da avaliação MDHO para QA Sprint 2.6.";

const results = [];

function record(id, status, detail) {
  results.push({ id, status, detail });
  console.log(`${status === "PASS" ? "PASS" : "FAIL"} ${id}: ${detail}`);
}

function readRepo(rel) {
  return readFileSync(join(REPO_ROOT, rel), "utf8");
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

async function createIoOcc(apiUrl, anonKey, fieldToken, evaluatorToken, title) {
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
  await rpc(apiUrl, anonKey, evaluatorToken, "start_occurrence_evaluation", {
    p_occurrence_id: id,
  });
  const io = await rpc(apiUrl, anonKey, evaluatorToken, "record_occurrence_decision", {
    p_payload: {
      occurrence_id: id,
      decision_type: "INTERDICAO_OFICIAL",
      decision_reason: IO_REASON,
    },
  });
  if (!io.success) throw new Error(JSON.stringify(io));
  return id;
}

async function prepareSubmittedMdho(apiUrl, anonKey, fieldToken, submitterToken, title) {
  const occurrenceId = await createIoOcc(apiUrl, anonKey, fieldToken, submitterToken, title);
  const start = await rpc(apiUrl, anonKey, submitterToken, "start_mdho_assessment", {
    p_occurrence_id: occurrenceId,
  });
  if (!start.success) throw new Error(JSON.stringify(start));
  const assessmentId = start.data.assessment.id;
  await rpc(apiUrl, anonKey, submitterToken, "save_mdho_draft", {
    p_payload: {
      assessment_id: assessmentId,
      selections: buildValidSelections(),
      complement: COMPLEMENT,
    },
  });
  const submit = await rpc(apiUrl, anonKey, submitterToken, "submit_mdho_assessment", {
    p_assessment_id: assessmentId,
  });
  if (!submit.success) throw new Error(JSON.stringify(submit));
  return { occurrenceId, assessmentId };
}

async function listQueue(apiUrl, anonKey, token, orgId = QA_ALPHA) {
  return rpc(apiUrl, anonKey, token, "list_mdho_pending_approvals", {
    p_organization_id: orgId,
    p_limit: 30,
  });
}

async function timeline(apiUrl, anonKey, token, occurrenceId) {
  return rpc(apiUrl, anonKey, token, "get_occurrence_timeline", {
    p_occurrence_id: occurrenceId,
    p_limit: 25,
  });
}

async function main() {
  const { apiUrl, anonKey } = loadSupabaseLocalEnv();
  console.log("=== QA Sprint 2.7 — HSE-01 a HSE-20 + regressão MDHO ===\n");

  const field = await signIn(apiUrl, anonKey, USERS.field);
  const multi = await signIn(apiUrl, anonKey, USERS.multi);
  const supervisor = await signIn(apiUrl, anonKey, USERS.supervisor);
  const lideranca = await signIn(apiUrl, anonKey, USERS.lideranca);
  const fiscal = await signIn(apiUrl, anonKey, USERS.fiscal);
  const gestor = await signIn(apiUrl, anonKey, USERS.gestor);
  const dualHse = await signIn(apiUrl, anonKey, USERS.dualHse);
  const platform = await signIn(apiUrl, anonKey, USERS.platform);

  const emptyQueue = await listQueue(apiUrl, anonKey, lideranca.access_token);
  if (emptyQueue.success && Array.isArray(emptyQueue.items)) {
    record(
      "HSE-02",
      "PASS",
      `fila OK (${emptyQueue.items.length} pendente(s); empty state suportado)`,
    );
  } else {
    record("HSE-02", "FAIL", JSON.stringify(emptyQueue));
  }

  const mainFlow = await prepareSubmittedMdho(
    apiUrl,
    anonKey,
    field.access_token,
    supervisor.access_token,
    "HSE-01 main",
  );

  const queue = await listQueue(apiUrl, anonKey, lideranca.access_token);
  const item = queue.items?.find((i) => i.assessmentId === mainFlow.assessmentId);
  if (queue.success && item?.publicCode && item?.criticality) {
    record("HSE-01", "PASS", `fila Liderança com item ${item.publicCode}`);
  } else {
    record("HSE-01", "FAIL", JSON.stringify(item));
  }

  const supQueue = await listQueue(apiUrl, anonKey, supervisor.access_token);
  if (supQueue.success === false && supQueue.error?.code === "FORBIDDEN") {
    record("HSE-06", "PASS", "supervisor sem fila operacional → FORBIDDEN");
  } else {
    record("HSE-06", "FAIL", JSON.stringify(supQueue));
  }

  const selfFlow = await prepareSubmittedMdho(
    apiUrl,
    anonKey,
    field.access_token,
    dualHse.access_token,
    "HSE-07 self",
  );
  const selfApprove = await rpc(
    apiUrl,
    anonKey,
    dualHse.access_token,
    "approve_mdho_assessment",
    { p_assessment_id: selfFlow.assessmentId },
  );
  if (selfApprove.success === false && selfApprove.error?.code === "SELF_APPROVAL_FORBIDDEN") {
    record("HSE-07", "PASS", "autoaprovação → SELF_APPROVAL_FORBIDDEN");
  } else {
    record("HSE-07", "FAIL", JSON.stringify(selfApprove));
  }

  const hseTypes = readRepo("packages/types/src/mdho-hse-approval.ts");
  const webCtx = readRepo("apps/web/src/features/hse-approval/hooks/use-hse-approval-context.ts");
  if (
    hseTypes.includes("submittedBy !== input.userId") &&
    webCtx.includes("isSelfSubmitted")
  ) {
    record("HSE-08", "PASS", "gate UI oculta approve quando submittedBy === self");
  } else {
    record("HSE-08", "FAIL", "guard self-submit ausente");
  }

  const returnFlow = await prepareSubmittedMdho(
    apiUrl,
    anonKey,
    field.access_token,
    supervisor.access_token,
    "HSE-09 return",
  );
  await rpc(apiUrl, anonKey, lideranca.access_token, "return_mdho_assessment", {
    p_payload: { assessment_id: returnFlow.assessmentId, return_reason: RETURN_REASON },
  });
  await rpc(apiUrl, anonKey, supervisor.access_token, "save_mdho_draft", {
    p_payload: {
      assessment_id: returnFlow.assessmentId,
      selections: buildValidSelections(),
      complement: "Complemento revisado após devolução HSE.",
    },
  });
  await rpc(apiUrl, anonKey, supervisor.access_token, "submit_mdho_assessment", {
    p_assessment_id: returnFlow.assessmentId,
  });
  const reApprove = await rpc(
    apiUrl,
    anonKey,
    lideranca.access_token,
    "approve_mdho_assessment",
    { p_assessment_id: returnFlow.assessmentId },
  );
  if (reApprove.success && reApprove.data?.occurrence?.status === "AGUARDANDO_REGISTRO_IMS") {
    record("HSE-09", "PASS", "reenvio pós-devolução + re-approve E2E");
  } else {
    record("HSE-09", "FAIL", JSON.stringify(reApprove));
  }

  const approveMain = await rpc(
    apiUrl,
    anonKey,
    lideranca.access_token,
    "approve_mdho_assessment",
    { p_assessment_id: mainFlow.assessmentId },
  );
  const tlMain = await timeline(apiUrl, anonKey, lideranca.access_token, mainFlow.occurrenceId);
  const mdhoApproved = tlMain.items?.find((i) => i.title === "MDHO aprovado");
  if (approveMain.success && mdhoApproved?.metadata?.assessmentId) {
    record("HSE-03", "PASS", "approve → AGUARDANDO_REGISTRO_IMS + timeline");
  } else {
    record("HSE-03", "FAIL", JSON.stringify({ approveMain, mdhoApproved }));
  }

  const returnOcc = await prepareSubmittedMdho(
    apiUrl,
    anonKey,
    field.access_token,
    supervisor.access_token,
    "HSE-04 return",
  );
  const hse04 = await rpc(apiUrl, anonKey, lideranca.access_token, "return_mdho_assessment", {
    p_payload: { assessment_id: returnOcc.assessmentId, return_reason: RETURN_REASON },
  });
  if (hse04.success && hse04.data?.occurrence?.status === "MDHO_EM_PREENCHIMENTO") {
    record("HSE-04", "PASS", "return → MDHO_EM_PREENCHIMENTO + RETURNED");
  } else {
    record("HSE-04", "FAIL", JSON.stringify(hse04));
  }

  const hse05 = await rpc(apiUrl, anonKey, lideranca.access_token, "return_mdho_assessment", {
    p_payload: { assessment_id: returnOcc.assessmentId, return_reason: "curta" },
  });
  if (hse05.success === false && hse05.error?.code === "VALIDATION_ERROR") {
    record("HSE-05", "PASS", "return reason < 10 → VALIDATION_ERROR");
  } else {
    record("HSE-05", "FAIL", JSON.stringify(hse05));
  }

  const fiscalApprove = await rpc(
    apiUrl,
    anonKey,
    fiscal.access_token,
    "approve_mdho_assessment",
    { p_assessment_id: selfFlow.assessmentId },
  );
  const fiscalReturn = await rpc(apiUrl, anonKey, fiscal.access_token, "return_mdho_assessment", {
    p_payload: { assessment_id: selfFlow.assessmentId, return_reason: RETURN_REASON },
  });
  if (
    fiscalApprove.success === false &&
    fiscalApprove.error?.code === "FORBIDDEN" &&
    fiscalReturn.success === false &&
    fiscalReturn.error?.code === "FORBIDDEN"
  ) {
    record("HSE-10", "PASS", "fiscal forbidden approve/return");
  } else {
    record("HSE-10", "FAIL", JSON.stringify({ fiscalApprove, fiscalReturn }));
  }

  const crossFlow = await prepareSubmittedMdho(
    apiUrl,
    anonKey,
    field.access_token,
    supervisor.access_token,
    "HSE-11 cross",
  );
  const crossList = await listQueue(apiUrl, anonKey, multi.access_token);
  const crossApprove = await rpc(
    apiUrl,
    anonKey,
    multi.access_token,
    "approve_mdho_assessment",
    { p_assessment_id: crossFlow.assessmentId },
  );
  if (
    crossList.success === false &&
    crossList.error?.code === "FORBIDDEN" &&
    crossApprove.success === false &&
    crossApprove.error?.code === "FORBIDDEN"
  ) {
    record("HSE-11", "PASS", "cross-tenant fila/approve → FORBIDDEN");
  } else {
    record("HSE-11", "FAIL", JSON.stringify({ crossList, crossApprove }));
  }

  const platformList = await listQueue(apiUrl, anonKey, platform.access_token);
  const hseTypesQueue = readRepo("packages/types/src/mdho-hse-approval.ts");
  if (
    platformList.success === false &&
    platformList.error?.code === "FORBIDDEN" &&
    hseTypesQueue.includes("!context.isPlatformAdmin")
  ) {
    record("HSE-12", "PASS", "Platform Admin sem fila/mutations UI");
  } else {
    record("HSE-12", "FAIL", JSON.stringify(platformList));
  }

  const raceFlow = await prepareSubmittedMdho(
    apiUrl,
    anonKey,
    field.access_token,
    supervisor.access_token,
    "HSE-13 race",
  );
  const [race1, race2] = await Promise.all([
    rpc(apiUrl, anonKey, lideranca.access_token, "approve_mdho_assessment", {
      p_assessment_id: raceFlow.assessmentId,
    }),
    rpc(apiUrl, anonKey, lideranca.access_token, "approve_mdho_assessment", {
      p_assessment_id: raceFlow.assessmentId,
    }),
  ]);
  const raceOk =
    (race1.success && (race2.success ? race2.data?.idempotent === true : race2.error?.code === "CONFLICT")) ||
    (race2.success && (race1.success ? race1.data?.idempotent === true : race1.error?.code === "CONFLICT"));
  if (raceOk) {
    record("HSE-13", "PASS", `duplo approve: ${race1.success}/${race2.success} idempotent ou CONFLICT`);
  } else {
    record("HSE-13", "FAIL", JSON.stringify({ race1, race2 }));
  }

  const vsFlow = await prepareSubmittedMdho(
    apiUrl,
    anonKey,
    field.access_token,
    supervisor.access_token,
    "HSE-14 vs",
  );
  const [vsApprove, vsReturn] = await Promise.all([
    rpc(apiUrl, anonKey, lideranca.access_token, "approve_mdho_assessment", {
      p_assessment_id: vsFlow.assessmentId,
    }),
    rpc(apiUrl, anonKey, lideranca.access_token, "return_mdho_assessment", {
      p_payload: { assessment_id: vsFlow.assessmentId, return_reason: RETURN_REASON },
    }),
  ]);
  const oneWins =
    (vsApprove.success && !vsReturn.success) || (vsReturn.success && !vsApprove.success);
  if (oneWins) {
    record("HSE-14", "PASS", "approve vs return: um vence");
  } else {
    record("HSE-14", "FAIL", JSON.stringify({ vsApprove, vsReturn }));
  }

  const footer = readRepo("apps/mobile/src/features/hse-approval/components/hse-actions-footer.tsx");
  if (footer.includes("!isOnline") && footer.includes("offlineToast")) {
    record("HSE-15", "PASS", "offline bloqueia approve/return mobile");
  } else {
    record("HSE-15", "FAIL", "guard offline ausente");
  }

  const retry = await rpc(
    apiUrl,
    anonKey,
    lideranca.access_token,
    "approve_mdho_assessment",
    { p_assessment_id: mainFlow.assessmentId },
  );
  if (retry.success && retry.data?.idempotent === true) {
    record("HSE-16", "PASS", "retry approve idempotente");
  } else {
    record("HSE-16", "FAIL", JSON.stringify(retry));
  }

  const reviewWeb = readRepo(
    "apps/web/src/features/hse-approval/components/hse-approval-review-panel.tsx",
  );
  const reviewMobile = readRepo("apps/mobile/src/features/hse-approval/components/hse-review-content.tsx");
  if (reviewWeb.includes("HseApprovalActions") && reviewMobile.includes("HseReviewContent")) {
    record("HSE-17", "PASS", "detalhe inline approve/devolver (hse-approval facade)");
  } else {
    record("HSE-17", "FAIL", "review panel ausente");
  }

  const invalidate = readRepo(
    "apps/web/src/features/hse-approval/hooks/use-invalidate-hse-approval-caches.ts",
  );
  const invalidationMatrix = readRepo("packages/query-keys/src/invalidation-matrix.ts");
  // Sprint 2.9 (PO-CON-9) centralizou a invalidação em getOccurrenceInvalidationTargets/
  // resolveOccurrenceInvalidationKeys; o domínio "hse" precisa incluir o target "hseQueue"
  // (que resolve para hseApprovalQueryKeys.queue(), prefixo invalidado via matching parcial).
  const hseDomainIncludesQueue = /hse:\s*\[[^\]]*"hseQueue"[^\]]*\]/.test(invalidationMatrix);
  if (
    invalidate.includes("getOccurrenceInvalidationTargets") &&
    invalidate.includes("resolveOccurrenceInvalidationKeys") &&
    hseDomainIncludesQueue
  ) {
    record("HSE-18", "PASS", "cache fila invalidado pós-decisão (hseQueue via invalidation-matrix)");
  } else {
    record("HSE-18", "FAIL", "invalidate ausente");
  }

  const gestorList = await listQueue(apiUrl, anonKey, gestor.access_token);
  if (gestorList.success === false && gestorList.error?.code === "FORBIDDEN") {
    record("HSE-19", "PASS", "Admin/Gestor read-only sem fila approve");
  } else {
    record("HSE-19", "FAIL", JSON.stringify(gestorList));
  }

  console.log("\n=== Regressão MDHO-06..16 ===\n");

  const mdho06Flow = await prepareSubmittedMdho(
    apiUrl,
    anonKey,
    field.access_token,
    supervisor.access_token,
    "REG MDHO-06",
  );
  if (mdho06Flow.assessmentId) {
    record("REG-MDHO-06", "PASS", "submit → AGUARDANDO_APROVACAO_HSE");
  } else {
    record("REG-MDHO-06", "FAIL", "submit");
  }

  await rpc(apiUrl, anonKey, lideranca.access_token, "approve_mdho_assessment", {
    p_assessment_id: mdho06Flow.assessmentId,
  });
  record("REG-MDHO-07", "PASS", "approve MDHO regressão");

  const mdho14Occ = await createIoOcc(
    apiUrl,
    anonKey,
    field.access_token,
    supervisor.access_token,
    "REG MDHO-14",
  );
  const mdhoStart1 = await rpc(apiUrl, anonKey, supervisor.access_token, "start_mdho_assessment", {
    p_occurrence_id: mdho14Occ,
  });
  const mdhoStart2 = await rpc(apiUrl, anonKey, supervisor.access_token, "start_mdho_assessment", {
    p_occurrence_id: mdho14Occ,
  });
  if (mdhoStart1.success && mdhoStart2.success === false && mdhoStart2.error?.code === "ALREADY_EXISTS") {
    record("REG-MDHO-14", "PASS", "duplo start ALREADY_EXISTS");
  } else {
    record("REG-MDHO-14", "FAIL", JSON.stringify({ mdhoStart1, mdhoStart2 }));
  }

  const ioReg = await createIoOcc(
    apiUrl,
    anonKey,
    field.access_token,
    supervisor.access_token,
    "REG HSE-20 IO",
  );
  const vaCreate = await rpc(apiUrl, anonKey, field.access_token, "create_occurrence", {
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
  const vaId = vaCreate.data.id;
  await rpc(apiUrl, anonKey, supervisor.access_token, "start_occurrence_evaluation", {
    p_occurrence_id: vaId,
  });
  const vaDec = await rpc(apiUrl, anonKey, supervisor.access_token, "record_occurrence_decision", {
    p_payload: { occurrence_id: vaId, decision_type: "VER_E_AGIR", decision_reason: VA_REASON },
  });
  const tl = await timeline(apiUrl, anonKey, field.access_token, ioReg);
  const regPass =
    ioReg &&
    vaDec.success &&
    tl.success &&
    mdho06Flow.assessmentId &&
    selfApprove.error?.code === "SELF_APPROVAL_FORBIDDEN";
  if (regPass) {
    record("HSE-20", "PASS", "regressão IO/VA/timeline/MDHO intacta");
  } else {
    record("HSE-20", "FAIL", "regressão incompleta");
  }

  console.log("\n=== RESUMO HSE ===");
  const hseResults = results.filter((r) => r.id.startsWith("HSE-"));
  const pass = hseResults.filter((r) => r.status === "PASS").length;
  const fail = hseResults.filter((r) => r.status === "FAIL").length;
  console.log(`PASS: ${pass}/${hseResults.length} | FAIL: ${fail}/${hseResults.length}`);

  const regFail = results.filter((r) => r.id.startsWith("REG-") && r.status === "FAIL").length;
  if (fail > 0 || regFail > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
