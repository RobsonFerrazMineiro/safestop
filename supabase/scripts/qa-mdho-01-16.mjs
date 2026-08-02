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
};

const QA_ALPHA = "b0000000-0000-4000-8000-000000000001";
const QA_ALPHA_AREA = "f0000000-0000-4000-8000-000000000001";
const QA_BETA_CONTRACTOR = "b0000000-0000-4000-8000-000000000002";

const MDHO_CAT_BEHAVIOR = "90000000-0000-4000-8000-000000000001";
const MDHO_CAT_DEVIATION = "90000000-0000-4000-8000-000000000002";
const MDHO_CAT_PRECONDITIONS = "90000000-0000-4000-8000-000000000003";
const MDHO_CAT_ORG = "90000000-0000-4000-8000-000000000004";
const MDHO_CAT_SUPERVISION = "90000000-0000-4000-8000-000000000005";

const IO_REASON =
  "Atividade apresenta risco grave e requer interdição formal até correção completa.";
const VA_REASON =
  "Condição insegura requer ação corretiva imediata conforme análise HSE.";
const RETURN_REASON =
  "Complementar detalhamento técnico nas categorias de comportamento e supervisão.";
const COMPLEMENT = "Complemento técnico da avaliação MDHO para QA Sprint 2.6.";

const MINIMAL_JPEG = Buffer.from(
  "/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBxAQEBUQEBAVFRUVFRUVFRUVFRUWFxUVFRUXFxUYHSggGBolGxUVITEhJSkrLi4uFx8zODMsNygtLisBCgoKDg0OGxAQGy0lHyUtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLf/AABEIAAEAAQMBIgACEQEDEQH/xAAXAAEBAQEAAAAAAAAAAAAAAAAAAQID/8QAFhEBAQEAAAAAAAAAAAAAAAAAAAER/9oADAMBAAIQAxAAAAG6p//EABQQAQAAAAAAAAAAAAAAAAAAAJD/2gAIAQEAAQUCcJ//xAAUEQEAAAAAAAAAAAAAAAAAAACQ/9oACAEDAQE/AXCf/8QAFBEBAAAAAAAAAAAAAAAAAAAAkP/aAAgBAgEBPwFwn//EABQQAQAAAAAAAAAAAAAAAAAAAJD/2gAIAQEABj8CcJ//xAAUEAEAAAAAAAAAAAAAAAAAAACQ/9oACAEBAAE/IXCf/9k=",
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

function buildValidSelections() {
  return [
    { category_id: MDHO_CAT_BEHAVIOR, option_id: "91000000-0000-4000-8000-000000000003" },
    { category_id: MDHO_CAT_DEVIATION, option_id: "91000000-0000-4000-8000-000000000013" },
    { category_id: MDHO_CAT_PRECONDITIONS, option_id: "91000000-0000-4000-8000-000000000023" },
    { category_id: MDHO_CAT_ORG, option_id: "91000000-0000-4000-8000-000000000035" },
    { category_id: MDHO_CAT_SUPERVISION, option_id: "91000000-0000-4000-8000-000000000041" },
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

async function restGet(apiUrl, anonKey, token, path) {
  const response = await fetch(`${apiUrl}/rest/v1/${path}`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error(`GET ${path} HTTP ${response.status}`);
  return response.json();
}

async function createPP(apiUrl, anonKey, token, title) {
  const result = await rpc(apiUrl, anonKey, token, "create_occurrence", {
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
  if (!result.success) throw new Error(JSON.stringify(result));
  return result.data.id;
}

async function createIoOcc(apiUrl, anonKey, fieldToken, supervisorToken, title) {
  const id = await createPP(apiUrl, anonKey, fieldToken, title);
  await rpc(apiUrl, anonKey, supervisorToken, "start_occurrence_evaluation", {
    p_occurrence_id: id,
  });
  const io = await rpc(apiUrl, anonKey, supervisorToken, "record_occurrence_decision", {
    p_payload: {
      occurrence_id: id,
      decision_type: "INTERDICAO_OFICIAL",
      decision_reason: IO_REASON,
    },
  });
  if (!io.success) throw new Error(JSON.stringify(io));
  return id;
}

async function createVaOcc(apiUrl, anonKey, fieldToken, supervisorToken, title) {
  const id = await createPP(apiUrl, anonKey, fieldToken, title);
  await rpc(apiUrl, anonKey, supervisorToken, "start_occurrence_evaluation", {
    p_occurrence_id: id,
  });
  const va = await rpc(apiUrl, anonKey, supervisorToken, "record_occurrence_decision", {
    p_payload: {
      occurrence_id: id,
      decision_type: "VER_E_AGIR",
      decision_reason: VA_REASON,
    },
  });
  if (!va.success) throw new Error(JSON.stringify(va));
  return id;
}

async function startMdho(apiUrl, anonKey, token, occurrenceId) {
  return rpc(apiUrl, anonKey, token, "start_mdho_assessment", {
    p_occurrence_id: occurrenceId,
  });
}

async function saveDraft(apiUrl, anonKey, token, assessmentId, selections = buildValidSelections()) {
  return rpc(apiUrl, anonKey, token, "save_mdho_draft", {
    p_payload: {
      assessment_id: assessmentId,
      selections,
      complement: COMPLEMENT,
    },
  });
}

async function submitMdho(apiUrl, anonKey, token, assessmentId) {
  return rpc(apiUrl, anonKey, token, "submit_mdho_assessment", {
    p_assessment_id: assessmentId,
  });
}

async function approveMdho(apiUrl, anonKey, token, assessmentId) {
  return rpc(apiUrl, anonKey, token, "approve_mdho_assessment", {
    p_assessment_id: assessmentId,
  });
}

async function returnMdho(apiUrl, anonKey, token, assessmentId, reason = RETURN_REASON) {
  return rpc(apiUrl, anonKey, token, "return_mdho_assessment", {
    p_payload: { assessment_id: assessmentId, return_reason: reason },
  });
}

async function timeline(apiUrl, anonKey, token, occurrenceId) {
  return rpc(apiUrl, anonKey, token, "get_occurrence_timeline", {
    p_occurrence_id: occurrenceId,
    p_limit: 30,
  });
}

async function uploadEvidence(apiUrl, anonKey, token, occurrenceId) {
  const prepare = await rpc(apiUrl, anonKey, token, "prepare_occurrence_attachment_upload", {
    payload: {
      occurrence_id: occurrenceId,
      attachment_type: "INITIAL_EVIDENCE",
      original_file_name: "mdho-reg.jpg",
      mime_type: "image/jpeg",
      file_size: MINIMAL_JPEG.byteLength,
    },
  });
  if (!prepare.success) return prepare;
  const encoded = prepare.data.storage_path
    .split("/")
    .map((s) => encodeURIComponent(s))
    .join("/");
  await fetch(`${apiUrl}/storage/v1/object/occurrence-evidence/${encoded}`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${token}`,
      "Content-Type": "image/jpeg",
      "x-upsert": "false",
    },
    body: MINIMAL_JPEG,
  });
  return rpc(apiUrl, anonKey, token, "complete_occurrence_attachment_upload", {
    target_attachment_id: prepare.data.attachment_id,
  });
}

async function main() {
  const { apiUrl, anonKey } = loadSupabaseLocalEnv();
  console.log("=== QA Sprint 2.6 — MDHO-01 a MDHO-16 + regressão ===\n");

  const field = await signIn(apiUrl, anonKey, USERS.field);
  const multi = await signIn(apiUrl, anonKey, USERS.multi);
  const supervisor = await signIn(apiUrl, anonKey, USERS.supervisor);
  const lideranca = await signIn(apiUrl, anonKey, USERS.lideranca);
  const fiscal = await signIn(apiUrl, anonKey, USERS.fiscal);
  const gestor = await signIn(apiUrl, anonKey, USERS.gestor);

  const vaOcc = await createVaOcc(
    apiUrl,
    anonKey,
    field.access_token,
    supervisor.access_token,
    "MDHO-02 VA",
  );
  const mdho02 = await startMdho(apiUrl, anonKey, supervisor.access_token, vaOcc);
  if (mdho02.success === false && mdho02.error?.code === "FORBIDDEN") {
    record("MDHO-02", "PASS", "start em Ver e Agir → FORBIDDEN");
  } else {
    record("MDHO-02", "FAIL", JSON.stringify(mdho02));
  }

  const ppOcc = await createPP(apiUrl, anonKey, field.access_token, "MDHO-03 PP");
  const mdho03 = await startMdho(apiUrl, anonKey, supervisor.access_token, ppOcc);
  if (
    mdho03.success === false &&
    (mdho03.error?.code === "STATUS_MISMATCH" || mdho03.error?.code === "FORBIDDEN")
  ) {
    record("MDHO-03", "PASS", `start antes IO → ${mdho03.error?.code} (sem INTERDICAO_OFICIAL)`);
  } else {
    record("MDHO-03", "FAIL", JSON.stringify(mdho03));
  }

  const fieldStart = await startMdho(apiUrl, anonKey, field.access_token, ppOcc);
  if (fieldStart.success === false && fieldStart.error?.code === "FORBIDDEN") {
    record("MDHO-neg-field", "PASS", "qa-field start MDHO → FORBIDDEN");
  } else {
    record("MDHO-neg-field", "FAIL", JSON.stringify(fieldStart));
  }

  const returnOcc = await createIoOcc(
    apiUrl,
    anonKey,
    field.access_token,
    supervisor.access_token,
    "MDHO E2E return",
  );
  const startReturn = await startMdho(apiUrl, anonKey, supervisor.access_token, returnOcc);
  const returnAssessmentId = startReturn.data?.assessment?.id;

  if (startReturn.success && startReturn.data?.occurrence?.status === "MDHO_EM_PREENCHIMENTO") {
    record("MDHO-01", "PASS", "supervisor start MDHO em IO confirmada");
  } else {
    record("MDHO-01", "FAIL", JSON.stringify(startReturn));
  }

  const mdho14 = await startMdho(apiUrl, anonKey, supervisor.access_token, returnOcc);
  if (mdho14.success === false && mdho14.error?.code === "ALREADY_EXISTS") {
    record("MDHO-14", "PASS", "duplo start → ALREADY_EXISTS");
  } else {
    record("MDHO-14", "FAIL", JSON.stringify(mdho14));
  }

  const crossOcc = await createIoOcc(
    apiUrl,
    anonKey,
    field.access_token,
    supervisor.access_token,
    "MDHO-13 cross",
  );
  const mdho13 = await startMdho(apiUrl, anonKey, multi.access_token, crossOcc);
  if (mdho13.success === false && mdho13.error?.code === "FORBIDDEN") {
    record("MDHO-13", "PASS", "qa-multi cross-tenant → FORBIDDEN");
  } else {
    record("MDHO-13", "FAIL", JSON.stringify(mdho13));
  }

  const draft = await saveDraft(apiUrl, anonKey, supervisor.access_token, returnAssessmentId);
  const selections = await restGet(
    apiUrl,
    anonKey,
    supervisor.access_token,
    `mdho_selections?select=category_id&assessment_id=eq.${returnAssessmentId}`,
  );
  if (draft.success && selections.length === 5) {
    record("MDHO-04", "PASS", `save draft persiste ${selections.length} seleções`);
  } else {
    record("MDHO-04", "FAIL", JSON.stringify({ draft, selections }));
  }

  const incompleteStart = await createIoOcc(
    apiUrl,
    anonKey,
    field.access_token,
    supervisor.access_token,
    "MDHO-05 incomplete",
  );
  const incompleteMdho = await startMdho(apiUrl, anonKey, supervisor.access_token, incompleteStart);
  const mdho05 = await submitMdho(
    apiUrl,
    anonKey,
    supervisor.access_token,
    incompleteMdho.data.assessment.id,
  );
  if (mdho05.success === false && mdho05.error?.code === "VALIDATION_ERROR") {
    record("MDHO-05", "PASS", "submit incompleto → VALIDATION_ERROR");
  } else {
    record("MDHO-05", "FAIL", JSON.stringify(mdho05));
  }

  const submit = await submitMdho(apiUrl, anonKey, supervisor.access_token, returnAssessmentId);
  if (submit.success && submit.data?.occurrence?.status === "AGUARDANDO_APROVACAO_HSE") {
    record("MDHO-06", "PASS", "submit → AGUARDANDO_APROVACAO_HSE");
  } else {
    record("MDHO-06", "FAIL", JSON.stringify(submit));
  }

  const mdho08 = await returnMdho(apiUrl, anonKey, lideranca.access_token, returnAssessmentId);
  const returnedRow = await restGet(
    apiUrl,
    anonKey,
    lideranca.access_token,
    `mdho_assessments?select=status&id=eq.${returnAssessmentId}`,
  );
  if (mdho08.success && returnedRow[0]?.status === "RETURNED") {
    record("MDHO-08", "PASS", "liderança devolve → RETURNED");
  } else {
    record("MDHO-08", "FAIL", JSON.stringify({ mdho08, returnedRow }));
  }

  const resave = await saveDraft(
    apiUrl,
    anonKey,
    supervisor.access_token,
    returnAssessmentId,
    buildValidSelections(),
  );
  const resubmit = await submitMdho(apiUrl, anonKey, supervisor.access_token, returnAssessmentId);
  const approve = await approveMdho(apiUrl, anonKey, lideranca.access_token, returnAssessmentId);
  if (resave.success && resubmit.success && approve.success && approve.data?.occurrence?.status === "AGUARDANDO_REGISTRO_IMS") {
    record("MDHO-09", "PASS", "return → edit → resubmit → approve E2E");
    record("MDHO-07", "PASS", "liderança approve → AGUARDANDO_REGISTRO_IMS");
  } else {
    record("MDHO-09", "FAIL", JSON.stringify({ resave, resubmit, approve }));
    record("MDHO-07", "FAIL", JSON.stringify(approve));
  }

  const tl = await timeline(apiUrl, anonKey, lideranca.access_token, returnOcc);
  const titles = tl.items?.map((i) => i.title) ?? [];
  const required = ["MDHO iniciado", "MDHO enviado", "MDHO devolvido", "MDHO aprovado"];
  const hasAll = required.every((t) => titles.includes(t));
  if (tl.success && hasAll) {
    record("MDHO-12", "PASS", `timeline 4 eventos MDHO (${required.join(", ")})`);
  } else {
    record("MDHO-12", "FAIL", JSON.stringify(titles));
  }

  const liderancaSubmitOcc = await createIoOcc(
    apiUrl,
    anonKey,
    field.access_token,
    supervisor.access_token,
    "MDHO-10 lideranca",
  );
  const liderancaSubmitStart = await startMdho(
    apiUrl,
    anonKey,
    supervisor.access_token,
    liderancaSubmitOcc,
  );
  await saveDraft(
    apiUrl,
    anonKey,
    supervisor.access_token,
    liderancaSubmitStart.data.assessment.id,
  );
  const liderancaSubmit = await submitMdho(
    apiUrl,
    anonKey,
    lideranca.access_token,
    liderancaSubmitStart.data.assessment.id,
  );
  const mdhoSection = readRepo("apps/mobile/src/features/mdho/components/mdho-section.tsx");
  const mdhoPerms = readRepo("apps/mobile/src/features/mdho/utils/mdho-permissions.ts");
  if (
    liderancaSubmit.success === false &&
    liderancaSubmit.error?.code === "FORBIDDEN" &&
    mdhoSection.includes('can("mdho.submit")') &&
    mdhoPerms.includes("canSubmitMdho")
  ) {
    record("MDHO-10", "PASS", "liderança sem mdho.submit → FORBIDDEN + guard UI");
  } else {
    record("MDHO-10", "FAIL", JSON.stringify(liderancaSubmit));
  }

  const fiscalOcc = await createIoOcc(
    apiUrl,
    anonKey,
    field.access_token,
    supervisor.access_token,
    "MDHO-11 fiscal",
  );
  const fiscalStart = await startMdho(apiUrl, anonKey, fiscal.access_token, fiscalOcc);
  const fiscalRead = await timeline(apiUrl, anonKey, fiscal.access_token, fiscalOcc);
  if (
    fiscalStart.success === false &&
    fiscalStart.error?.code === "FORBIDDEN" &&
    fiscalRead.success
  ) {
    record("MDHO-11", "PASS", "qa-fiscal read-only (lê timeline; mutations FORBIDDEN)");
  } else {
    record("MDHO-11", "FAIL", JSON.stringify({ fiscalStart, fiscalRead }));
  }

  const startCard = readRepo("apps/mobile/src/features/mdho/components/mdho-start-card.tsx");
  const draftBar = readRepo("apps/mobile/src/features/mdho/components/mdho-draft-bar.tsx");
  if (startCard.includes("!isOnline") && draftBar.includes("!isOnline")) {
    record("MDHO-15", "PASS", "offline bloqueia mutations MDHO (isOnline guard)");
  } else {
    record("MDHO-15", "FAIL", "guard offline ausente");
  }

  console.log("\n=== Regressão IO / VA / TL / SW / EV ===\n");

  const ioRegOcc = await createPP(apiUrl, anonKey, field.access_token, "REG IO");
  await rpc(apiUrl, anonKey, supervisor.access_token, "start_occurrence_evaluation", {
    p_occurrence_id: ioRegOcc,
  });
  const io01 = await rpc(apiUrl, anonKey, supervisor.access_token, "record_occurrence_decision", {
    p_payload: {
      occurrence_id: ioRegOcc,
      decision_type: "INTERDICAO_OFICIAL",
      decision_reason: IO_REASON,
    },
  });
  if (io01.success && io01.data?.occurrence?.status === "INTERDICAO_CONFIRMADA") {
    record("REG-IO", "PASS", "IO confirmada");
  } else {
    record("REG-IO", "FAIL", JSON.stringify(io01));
  }

  const vaReg = await createVaOcc(
    apiUrl,
    anonKey,
    field.access_token,
    supervisor.access_token,
    "REG VA",
  );
  const vaRow = await restGet(
    apiUrl,
    anonKey,
    supervisor.access_token,
    `occurrences?select=status,decision_type&id=eq.${vaReg}`,
  );
  if (vaRow[0]?.status === "VER_E_AGIR" && vaRow[0]?.decision_type === "VER_E_AGIR") {
    record("REG-VA", "PASS", "VA start+decide OK");
  } else {
    record("REG-VA", "FAIL", JSON.stringify(vaRow));
  }

  const sw01 = await rpc(apiUrl, anonKey, field.access_token, "create_occurrence", {
    payload: {
      organization_id: QA_ALPHA,
      area_id: QA_ALPHA_AREA,
      contractor_organization_id: QA_BETA_CONTRACTOR,
      title: "REG SW-01",
      task_description: "REG SW-01",
      location_description: "Local",
      condition_description: "Condição",
      severity: "HIGH",
    },
  });
  if (sw01.success && sw01.data?.status === "PARALISACAO_PREVENTIVA") {
    record("REG-SW-01", "PASS", sw01.data.public_code);
  } else {
    record("REG-SW-01", "FAIL", JSON.stringify(sw01));
  }

  const evOcc = await createPP(apiUrl, anonKey, field.access_token, "REG EV-01");
  const ev01 = await uploadEvidence(apiUrl, anonKey, field.access_token, evOcc);
  if (ev01.success) {
    record("REG-EV-01", "PASS", "upload JPEG COMPLETED");
  } else {
    record("REG-EV-01", "FAIL", JSON.stringify(ev01));
  }

  const tlOcc = await createPP(apiUrl, anonKey, field.access_token, "REG TL");
  const tl01 = await timeline(apiUrl, anonKey, field.access_token, tlOcc);
  const tl02c = await rpc(apiUrl, anonKey, field.access_token, "create_occurrence_comment", {
    p_occurrence_id: tlOcc,
    p_content: "Reg TL-02",
  });
  const tl02 = await timeline(apiUrl, anonKey, field.access_token, tlOcc);
  const tl03u = await rpc(apiUrl, anonKey, field.access_token, "update_occurrence_comment", {
    p_comment_id: tl02c.comment.id,
    p_content: "Reg TL-03 editado",
  });
  const tl04b = await rpc(apiUrl, anonKey, gestor.access_token, "update_occurrence_comment", {
    p_comment_id: tl02c.comment.id,
    p_content: "alheio",
  });
  const tl05d = await rpc(apiUrl, anonKey, field.access_token, "delete_occurrence_comment", {
    p_comment_id: tl02c.comment.id,
  });
  const tl05 = await timeline(apiUrl, anonKey, field.access_token, tlOcc);
  const tlPass =
    tl01.success &&
    tl02.items?.[0]?.kind === "COMMENT_ADDED" &&
    tl03u.success &&
    tl04b.success === false &&
    tl05d.success &&
    tl05.items?.some((i) => i.kind === "COMMENT_REMOVED");
  if (tlPass) {
    record("REG-TL", "PASS", "TL-01..05 OK");
  } else {
    record("REG-TL", "FAIL", "timeline regressão");
  }

  const regFail = results.filter((r) => r.id.startsWith("REG-") && r.status === "FAIL").length;
  if (regFail === 0) {
    record("MDHO-16", "PASS", "regressão IO/VA/TL/SW/EV intacta");
  } else {
    record("MDHO-16", "FAIL", `${regFail} regressão(ões) falharam`);
  }

  console.log("\n=== RESUMO MDHO ===");
  const mdhoResults = results.filter((r) => r.id.startsWith("MDHO-"));
  const pass = mdhoResults.filter((r) => r.status === "PASS").length;
  const fail = mdhoResults.filter((r) => r.status === "FAIL").length;
  console.log(`PASS: ${pass}/${mdhoResults.length} | FAIL: ${fail}/${mdhoResults.length}`);

  if (fail > 0 || regFail > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
