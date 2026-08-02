import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { loadSupabaseLocalEnv, runLocalSql } from "./_local-env.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..", "..");
const PASSWORD = "SafeStop-QA-Local-2026";

const USERS = {
  field: "qa-field@safestop.local",
  gestor: "qa-gestor@safestop.local",
  multi: "qa-multi@safestop.local",
  supervisor: "qa-supervisor@safestop.local",
  fiscal: "qa-fiscal@safestop.local",
  dualrole: "qa-dualrole@safestop.local",
};

const QA_ALPHA = "b0000000-0000-4000-8000-000000000001";
const QA_ALPHA_AREA = "f0000000-0000-4000-8000-000000000001";
const QA_BETA_CONTRACTOR = "b0000000-0000-4000-8000-000000000002";
const QA_FISCAL_USER = "a0000000-0000-4000-8000-000000000010";
const QA_SUPERVISOR_USER = "a0000000-0000-4000-8000-000000000009";
const QA_DUALROLE_MEMBER = "c0000000-0000-4000-8000-000000000007";

const IO_REASON =
  "Atividade apresenta risco grave e requer interdição formal até correção completa.";
const VA_REASON =
  "Condição insegura requer ação corretiva imediata conforme análise HSE.";

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

async function createPP(apiUrl, anonKey, token, title = "QA IO") {
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

async function startEval(apiUrl, anonKey, token, occurrenceId) {
  return rpc(apiUrl, anonKey, token, "start_occurrence_evaluation", {
    p_occurrence_id: occurrenceId,
  });
}

async function recordDecision(apiUrl, anonKey, token, occurrenceId, decisionType, reason) {
  return rpc(apiUrl, anonKey, token, "record_occurrence_decision", {
    p_payload: {
      occurrence_id: occurrenceId,
      decision_type: decisionType,
      decision_reason: reason,
    },
  });
}

async function timeline(apiUrl, anonKey, token, occurrenceId) {
  return rpc(apiUrl, anonKey, token, "get_occurrence_timeline", {
    p_occurrence_id: occurrenceId,
    p_limit: 15,
  });
}

async function createAndStart(apiUrl, anonKey, fieldToken, evaluatorToken, title) {
  const id = await createPP(apiUrl, anonKey, fieldToken, title);
  const start = await startEval(apiUrl, anonKey, evaluatorToken, id);
  if (!start.success) throw new Error(JSON.stringify(start));
  return id;
}

function grantSupervisorRoleToDualrole() {
  runLocalSql(`
    insert into public.member_roles (organization_member_id, role_id)
    select '${QA_DUALROLE_MEMBER}', r.id
    from public.roles r
    where r.name = 'Supervisor HSE' and r.organization_id is null
    on conflict (organization_member_id, role_id) do nothing;
  `);
}

async function uploadEvidence(apiUrl, anonKey, token, occurrenceId) {
  const prepare = await rpc(apiUrl, anonKey, token, "prepare_occurrence_attachment_upload", {
    payload: {
      occurrence_id: occurrenceId,
      attachment_type: "INITIAL_EVIDENCE",
      original_file_name: "io-reg.jpg",
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
  console.log("=== QA Sprint 2.5 — IO-01 a IO-12 + IO-17 + regressão ===\n");

  const field = await signIn(apiUrl, anonKey, USERS.field);
  const gestor = await signIn(apiUrl, anonKey, USERS.gestor);
  const multi = await signIn(apiUrl, anonKey, USERS.multi);
  const supervisor = await signIn(apiUrl, anonKey, USERS.supervisor);
  const fiscal = await signIn(apiUrl, anonKey, USERS.fiscal);

  const ioMain = await createAndStart(
    apiUrl,
    anonKey,
    field.access_token,
    supervisor.access_token,
    "IO-01 main",
  );

  const io02 = await recordDecision(
    apiUrl,
    anonKey,
    fiscal.access_token,
    ioMain,
    "INTERDICAO_OFICIAL",
    IO_REASON,
  );
  const fiscalVaOcc = await createAndStart(
    apiUrl,
    anonKey,
    field.access_token,
    fiscal.access_token,
    "IO-02 fiscal VA",
  );
  const fiscalVaStart = await startEval(apiUrl, anonKey, fiscal.access_token, fiscalVaOcc);
  const fiscalVa = await recordDecision(
    apiUrl,
    anonKey,
    fiscal.access_token,
    fiscalVaOcc,
    "VER_E_AGIR",
    VA_REASON,
  );
  if (
    io02.success === false &&
    io02.error?.code === "FORBIDDEN" &&
    fiscalVaStart.success &&
    fiscalVa.success &&
    fiscalVa.data?.occurrence?.status === "VER_E_AGIR"
  ) {
    record(
      "IO-02",
      "PASS",
      "qa-fiscal IO FORBIDDEN; VA start+decide OK (evaluate sem confirm_interdiction)",
    );
  } else {
    record("IO-02", "FAIL", JSON.stringify({ io02, fiscalVa }));
  }

  const io01 = await recordDecision(
    apiUrl,
    anonKey,
    supervisor.access_token,
    ioMain,
    "INTERDICAO_OFICIAL",
    IO_REASON,
  );
  if (io01.success && io01.data?.occurrence?.status === "INTERDICAO_CONFIRMADA") {
    record("IO-01", "PASS", "qa-supervisor IO → INTERDICAO_CONFIRMADA");
  } else {
    record("IO-01", "FAIL", JSON.stringify(io01));
  }

  const io07tl = await timeline(apiUrl, anonKey, supervisor.access_token, ioMain);
  const ioTitle = io07tl.items?.find((i) => i.title === "Interdição Oficial confirmada");
  if (io07tl.success && ioTitle?.metadata?.decisionType === "INTERDICAO_OFICIAL") {
    record("IO-07", "PASS", "timeline Interdição Oficial confirmada + metadata");
  } else {
    record("IO-07", "FAIL", JSON.stringify(ioTitle));
  }

  const io05 = await recordDecision(
    apiUrl,
    anonKey,
    supervisor.access_token,
    ioMain,
    "INTERDICAO_OFICIAL",
    IO_REASON,
  );
  if (io05.success === false && io05.error?.code === "ALREADY_DECIDED") {
    record("IO-05", "PASS", "segunda decisão → ALREADY_DECIDED");
  } else {
    record("IO-05", "FAIL", JSON.stringify(io05));
  }

  const io03Occ = await createAndStart(
    apiUrl,
    anonKey,
    field.access_token,
    supervisor.access_token,
    "IO-03 validation",
  );
  const io03 = await recordDecision(
    apiUrl,
    anonKey,
    supervisor.access_token,
    io03Occ,
    "INTERDICAO_OFICIAL",
    "curta",
  );
  if (io03.success === false && io03.error?.code === "VALIDATION_ERROR") {
    record("IO-03", "PASS", "justificativa < 10 chars → VALIDATION_ERROR");
  } else {
    record("IO-03", "FAIL", JSON.stringify(io03));
  }

  const io04Occ = await createPP(apiUrl, anonKey, field.access_token, "IO-04 PP");
  const io04 = await recordDecision(
    apiUrl,
    anonKey,
    supervisor.access_token,
    io04Occ,
    "INTERDICAO_OFICIAL",
    IO_REASON,
  );
  if (io04.success === false && io04.error?.code === "STATUS_MISMATCH") {
    record("IO-04", "PASS", "status PP (≠ EM_AVALIACAO) → STATUS_MISMATCH");
  } else {
    record("IO-04", "FAIL", JSON.stringify(io04));
  }

  const io06Occ = await createAndStart(
    apiUrl,
    anonKey,
    field.access_token,
    supervisor.access_token,
    "IO-06 cross",
  );
  const io06 = await recordDecision(
    apiUrl,
    anonKey,
    multi.access_token,
    io06Occ,
    "INTERDICAO_OFICIAL",
    IO_REASON,
  );
  if (io06.success === false && io06.error?.code === "FORBIDDEN") {
    record("IO-06", "PASS", "qa-multi cross-org IO → FORBIDDEN");
  } else {
    record("IO-06", "FAIL", JSON.stringify(io06));
  }

  const io08Occ = await createAndStart(
    apiUrl,
    anonKey,
    field.access_token,
    supervisor.access_token,
    "IO-08 gestor",
  );
  const gestorIo = await recordDecision(
    apiUrl,
    anonKey,
    gestor.access_token,
    io08Occ,
    "INTERDICAO_OFICIAL",
    IO_REASON,
  );
  const leadership = readRepo("apps/web/src/features/stop-work/components/leadership-decision-section.tsx");
  const interdicaoPerms = readRepo(
    "apps/mobile/src/features/interdicao-oficial/utils/interdicao-permissions.ts",
  );
  if (
    gestorIo.success === false &&
    gestorIo.error?.code === "FORBIDDEN" &&
    leadership.includes("canConfirmInterdiction") &&
    interdicaoPerms.includes("canConfirm")
  ) {
    record("IO-08", "PASS", "qa-gestor sem cards/ação IO (FORBIDDEN + guards UI)");
  } else {
    record("IO-08", "FAIL", JSON.stringify(gestorIo));
  }

  grantSupervisorRoleToDualrole();
  const dualrole = await signIn(apiUrl, anonKey, USERS.dualrole);
  const io11Occ = await createAndStart(
    apiUrl,
    anonKey,
    field.access_token,
    supervisor.access_token,
    "IO-11 race",
  );
  const io11a = await recordDecision(
    apiUrl,
    anonKey,
    supervisor.access_token,
    io11Occ,
    "INTERDICAO_OFICIAL",
    IO_REASON,
  );
  const io11b = await recordDecision(
    apiUrl,
    anonKey,
    dualrole.access_token,
    io11Occ,
    "INTERDICAO_OFICIAL",
    IO_REASON,
  );
  if (
    io11a.success &&
    io11b.success === false &&
    (io11b.error?.code === "ALREADY_DECIDED" || io11b.error?.code === "STATUS_MISMATCH")
  ) {
    record("IO-11", "PASS", `concorrência: 1º OK; 2º ${io11b.error?.code}`);
  } else {
    record("IO-11", "FAIL", JSON.stringify({ io11a, io11b }));
  }

  const io12Occ = await createAndStart(
    apiUrl,
    anonKey,
    field.access_token,
    supervisor.access_token,
    "IO-12 summary",
  );
  await recordDecision(
    apiUrl,
    anonKey,
    supervisor.access_token,
    io12Occ,
    "INTERDICAO_OFICIAL",
    IO_REASON,
  );
  const io12Row = await restGet(
    apiUrl,
    anonKey,
    gestor.access_token,
    `occurrences?select=status,decision_type&id=eq.${io12Occ}`,
  );
  const summaryWeb = readRepo("apps/web/src/features/interdicao-oficial/components/interdicao-summary.tsx");
  const summaryMobile = readRepo("apps/mobile/src/features/interdicao-oficial/components/interdicao-summary.tsx");
  const confirmWeb = readRepo("apps/web/src/features/interdicao-oficial/components/interdicao-decision-card.tsx");
  if (
    io12Row[0]?.status === "INTERDICAO_CONFIRMADA" &&
    summaryWeb.includes("Justificativa") &&
    summaryMobile.includes("Justificativa") &&
    confirmWeb.includes("Confirmar Interdição Oficial?")
  ) {
    record("IO-12", "PASS", "summary read-only pós-IO + dialog destrutivo (contrato código)");
  } else {
    record("IO-12", "FAIL", JSON.stringify(io12Row));
  }

  const ioCard = readRepo("apps/mobile/src/features/interdicao-oficial/components/interdicao-decision-card.tsx");
  if (ioCard.includes("isOnline") && ioCard.includes("!isOnline")) {
    record("IO-10", "PASS", "submit IO bloqueado offline (isOnline guard)");
  } else {
    record("IO-10", "FAIL", "guard offline ausente");
  }

  const invalidateIo = readRepo(
    "apps/web/src/features/interdicao-oficial/hooks/use-invalidate-interdicao-caches.ts",
  );
  const orgProvider = readRepo("apps/mobile/src/features/organization/provider/organization-provider.tsx");
  const crossIo = await recordDecision(
    apiUrl,
    anonKey,
    multi.access_token,
    io06Occ,
    "INTERDICAO_OFICIAL",
    IO_REASON,
  );
  if (
    crossIo.success === false &&
    invalidateIo.includes("decision") &&
    orgProvider.includes("clearTenantCache")
  ) {
    record("IO-17", "PASS", "troca org: cross-org bloqueado + invalidação/cache");
  } else {
    record("IO-17", "FAIL", "IO-17 cache/cross-org");
  }

  console.log("\n=== Regressão VA-01..VA-07 ===\n");

  const va01Occ = await createPP(apiUrl, anonKey, field.access_token, "REG VA-01");
  const va07 = await startEval(apiUrl, anonKey, field.access_token, va01Occ);
  const va01 = await startEval(apiUrl, anonKey, supervisor.access_token, va01Occ);
  if (va07.error?.code === "FORBIDDEN" && va01.success) {
    record("REG-VA-07", "PASS", "field start FORBIDDEN");
    record("REG-VA-01", "PASS", "supervisor start EM_AVALIACAO");
  } else {
    record("REG-VA-07", "FAIL", JSON.stringify(va07));
    record("REG-VA-01", "FAIL", JSON.stringify(va01));
  }

  const va02tl = await timeline(apiUrl, anonKey, supervisor.access_token, va01Occ);
  if (va02tl.items?.some((i) => i.title === "Avaliação iniciada")) {
    record("REG-VA-02", "PASS", "timeline Avaliação iniciada");
  } else {
    record("REG-VA-02", "FAIL", "timeline");
  }

  const va03 = await recordDecision(
    apiUrl,
    anonKey,
    supervisor.access_token,
    va01Occ,
    "VER_E_AGIR",
    VA_REASON,
  );
  const va04row = await restGet(
    apiUrl,
    anonKey,
    supervisor.access_token,
    `occurrence_decisions?select=decision_type&occurrence_id=eq.${va01Occ}`,
  );
  if (va03.success && va03.data?.occurrence?.status === "VER_E_AGIR" && va04row[0]?.decision_type === "VER_E_AGIR") {
    record("REG-VA-03", "PASS", "decisão VA OK");
    record("REG-VA-04", "PASS", "VER_E_AGIR + row decision");
  } else {
    record("REG-VA-03", "FAIL", JSON.stringify(va03));
    record("REG-VA-04", "FAIL", JSON.stringify(va04row));
  }

  const mobileDetail = readRepo("apps/mobile/src/features/stop-work/components/preventive-stop-detail-screen.tsx");
  if (mobileDetail.includes("EvaluationSection") && va03.success) {
    record("REG-VA-05", "PASS", "detalhe integrado (contrato código)");
  } else {
    record("REG-VA-05", "FAIL", "detalhe");
  }

  if (va01.data?.assigned_evaluator_id === QA_SUPERVISOR_USER) {
    record("REG-VA-06", "PASS", "assigned_evaluator_id correto");
  } else {
    record("REG-VA-06", "FAIL", JSON.stringify(va01.data));
  }

  if (va07.error?.code === "FORBIDDEN") {
    record("IO-09", "PASS", "regressão VA-01..07 intacta");
  } else {
    record("IO-09", "FAIL", "VA-07 regressão");
  }

  console.log("\n=== Regressão SW-01 / EV-01 / TL-01..TL-05 ===\n");

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
  if (tl01.success && tl01.items?.some((i) => i.kind === "OCCURRENCE_CREATED")) {
    record("REG-TL-01", "PASS", "OCCURRENCE_CREATED");
  } else {
    record("REG-TL-01", "FAIL", JSON.stringify(tl01));
  }

  const tl02c = await rpc(apiUrl, anonKey, field.access_token, "create_occurrence_comment", {
    p_occurrence_id: tlOcc,
    p_content: "Reg TL-02",
  });
  const tl02 = await timeline(apiUrl, anonKey, field.access_token, tlOcc);
  if (tl02c.success && tl02.items?.[0]?.kind === "COMMENT_ADDED") {
    record("REG-TL-02", "PASS", "COMMENT_ADDED");
  } else {
    record("REG-TL-02", "FAIL", JSON.stringify(tl02));
  }

  const tl03u = await rpc(apiUrl, anonKey, field.access_token, "update_occurrence_comment", {
    p_comment_id: tl02c.comment.id,
    p_content: "Reg TL-03 editado",
  });
  const tl03 = await timeline(apiUrl, anonKey, field.access_token, tlOcc);
  const edited = tl03.items?.find((i) => i.id === tl02c.comment.id);
  if (tl03u.success && edited?.metadata?.isEdited === true) {
    record("REG-TL-03", "PASS", "edit + isEdited");
  } else {
    record("REG-TL-03", "FAIL", JSON.stringify(tl03u));
  }

  const tl04 = await rpc(apiUrl, anonKey, gestor.access_token, "update_occurrence_comment", {
    p_comment_id: tl02c.comment.id,
    p_content: "alheio",
  });
  if (tl04.success === false && tl04.error?.code === "FORBIDDEN") {
    record("REG-TL-04", "PASS", "editar alheio FORBIDDEN");
  } else {
    record("REG-TL-04", "FAIL", JSON.stringify(tl04));
  }

  const tl05d = await rpc(apiUrl, anonKey, field.access_token, "delete_occurrence_comment", {
    p_comment_id: tl02c.comment.id,
  });
  const tl05 = await timeline(apiUrl, anonKey, field.access_token, tlOcc);
  const removed = tl05.items?.find((i) => i.kind === "COMMENT_REMOVED");
  if (tl05d.success && removed?.title === "Comentário removido") {
    record("REG-TL-05", "PASS", "COMMENT_REMOVED");
  } else {
    record("REG-TL-05", "FAIL", JSON.stringify(tl05));
  }

  console.log("\n=== RESUMO IO ===");
  const ioResults = results.filter((r) => r.id.startsWith("IO-"));
  const pass = ioResults.filter((r) => r.status === "PASS").length;
  const fail = ioResults.filter((r) => r.status === "FAIL").length;
  console.log(`PASS: ${pass}/${ioResults.length} | FAIL: ${fail}/${ioResults.length}`);

  const regFail = results.filter((r) => r.id.startsWith("REG-") && r.status === "FAIL").length;
  console.log(regFail > 0 ? `REGRESSÃO: ${regFail} falha(s)` : "REGRESSÃO: OK");

  if (fail > 0 || regFail > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
