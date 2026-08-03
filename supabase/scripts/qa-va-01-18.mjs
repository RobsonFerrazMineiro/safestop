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
  dualrole: "qa-dualrole@safestop.local",
};

const QA_ALPHA = "b0000000-0000-4000-8000-000000000001";
const QA_ALPHA_AREA = "f0000000-0000-4000-8000-000000000001";
const QA_BETA_CONTRACTOR = "b0000000-0000-4000-8000-000000000002";
const QA_SUPERVISOR_USER = "a0000000-0000-4000-8000-000000000009";
const QA_DUALROLE_MEMBER = "c0000000-0000-4000-8000-000000000007";
const DECISION_REASON =
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

async function createPP(apiUrl, anonKey, token, title = "QA VA") {
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

async function timeline(apiUrl, anonKey, token, occurrenceId) {
  return rpc(apiUrl, anonKey, token, "get_occurrence_timeline", {
    p_occurrence_id: occurrenceId,
    p_limit: 20,
  });
}

async function startEval(apiUrl, anonKey, token, occurrenceId) {
  return rpc(apiUrl, anonKey, token, "start_occurrence_evaluation", {
    p_occurrence_id: occurrenceId,
  });
}

async function recordDecision(apiUrl, anonKey, token, occurrenceId, extra = {}) {
  return rpc(apiUrl, anonKey, token, "record_occurrence_decision", {
    p_payload: {
      occurrence_id: occurrenceId,
      decision_type: "VER_E_AGIR",
      decision_reason: DECISION_REASON,
      ...extra,
    },
  });
}

async function uploadEvidence(apiUrl, anonKey, token, occurrenceId) {
  const prepare = await rpc(apiUrl, anonKey, token, "prepare_occurrence_attachment_upload", {
    payload: {
      occurrence_id: occurrenceId,
      attachment_type: "INITIAL_EVIDENCE",
      original_file_name: "va-reg.jpg",
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
  const complete = await rpc(apiUrl, anonKey, token, "complete_occurrence_attachment_upload", {
    target_attachment_id: prepare.data.attachment_id,
  });
  return complete;
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

async function main() {
  const { apiUrl, anonKey } = loadSupabaseLocalEnv();
  console.log("=== QA Sprint 2.4 — VA-01 a VA-18 + regressão ===\n");

  const field = await signIn(apiUrl, anonKey, USERS.field);
  const gestor = await signIn(apiUrl, anonKey, USERS.gestor);
  const multi = await signIn(apiUrl, anonKey, USERS.multi);
  const supervisor = await signIn(apiUrl, anonKey, USERS.supervisor);

  const mainOcc = await createPP(apiUrl, anonKey, field.access_token, "VA main flow");

  const va07 = await startEval(apiUrl, anonKey, field.access_token, mainOcc);
  const evalSection = readRepo("apps/mobile/src/features/ver-e-agir/components/evaluation-section.tsx");
  const evalPerms = readRepo("apps/mobile/src/features/ver-e-agir/utils/evaluation-permissions.ts");
  if (
    va07.success === false &&
    va07.error?.code === "FORBIDDEN" &&
    evalSection.includes("canStartEvaluation") &&
    evalPerms.includes("params.canEvaluate")
  ) {
    record("VA-07", "PASS", "qa-field start FORBIDDEN + CTAs gated por canEvaluate");
  } else {
    record("VA-07", "FAIL", JSON.stringify(va07));
  }

  const va01 = await startEval(apiUrl, anonKey, supervisor.access_token, mainOcc);
  if (va01.success && va01.data?.current_status === "EM_AVALIACAO") {
    record("VA-01", "PASS", "qa-supervisor start → EM_AVALIACAO");
  } else {
    record("VA-01", "FAIL", JSON.stringify(va01));
  }

  const va02tl = await timeline(apiUrl, anonKey, supervisor.access_token, mainOcc);
  const evalStarted = va02tl.items?.find((i) => i.title === "Avaliação iniciada");
  if (va02tl.success && evalStarted) {
    record("VA-02", "PASS", "timeline título Avaliação iniciada");
  } else {
    record("VA-02", "FAIL", JSON.stringify(va02tl.items?.map((i) => i.title)));
  }

  if (va01.data?.assigned_evaluator_id === QA_SUPERVISOR_USER) {
    record("VA-06", "PASS", `assigned_evaluator_id=${QA_SUPERVISOR_USER}`);
  } else {
    record("VA-06", "FAIL", JSON.stringify(va01.data));
  }

  const forgedId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
  const va09 = await recordDecision(apiUrl, anonKey, supervisor.access_token, mainOcc, {
    decided_by: forgedId,
    evaluator_id: forgedId,
    assigned_evaluator_id: forgedId,
  });
  const decisionRows = await restGet(
    apiUrl,
    anonKey,
    supervisor.access_token,
    `occurrence_decisions?select=decided_by,decision_type&occurrence_id=eq.${mainOcc}`,
  );
  if (
    va09.success &&
    decisionRows[0]?.decided_by === QA_SUPERVISOR_USER &&
    decisionRows[0]?.decision_type === "VER_E_AGIR"
  ) {
    record("VA-09", "PASS", "payload forjado ignorado; decided_by=auth.uid()");
  } else {
    record("VA-09", "FAIL", JSON.stringify({ va09, decisionRows }));
  }

  if (va09.success && va09.data?.occurrence?.status === "VER_E_AGIR") {
    record("VA-03", "PASS", "decisão Ver e Agir registrada");
    record("VA-04", "PASS", "status VER_E_AGIR + row occurrence_decisions");
  } else {
    record("VA-03", "FAIL", JSON.stringify(va09));
    record("VA-04", "FAIL", JSON.stringify(va09));
  }

  const occRow = await restGet(
    apiUrl,
    anonKey,
    gestor.access_token,
    `occurrences?select=status,decision_type&id=eq.${mainOcc}`,
  );
  const webDetail = readRepo("apps/web/src/features/stop-work/components/leadership-decision-section.tsx");
  const mobileDetail = readRepo("apps/mobile/src/features/stop-work/components/preventive-stop-detail-screen.tsx");
  if (
    occRow[0]?.status === "VER_E_AGIR" &&
    webDetail.includes("VerEAgirSummary") &&
    mobileDetail.includes("EvaluationSection")
  ) {
    record("VA-05", "PASS", "REST status VER_E_AGIR + detalhe web/mobile integrado");
  } else {
    record("VA-05", "FAIL", JSON.stringify(occRow));
  }

  const va14 = await recordDecision(apiUrl, anonKey, supervisor.access_token, mainOcc);
  if (va14.success === false && va14.error?.code === "ALREADY_DECIDED") {
    record("VA-14", "PASS", "retry → ALREADY_DECIDED");
  } else {
    record("VA-14", "FAIL", JSON.stringify(va14));
  }

  const crossOcc = await createPP(apiUrl, anonKey, field.access_token, "VA-08 cross");
  const va08 = await startEval(apiUrl, anonKey, multi.access_token, crossOcc);
  if (va08.success === false && va08.error?.code === "FORBIDDEN") {
    record("VA-08", "PASS", "qa-multi cross-org start → FORBIDDEN");
  } else {
    record("VA-08", "FAIL", JSON.stringify(va08));
  }

  const gestorOcc = await createPP(apiUrl, anonKey, field.access_token, "VA-10 gestor");
  const gestorStart = await startEval(apiUrl, anonKey, gestor.access_token, gestorOcc);
  const gestorRead = await timeline(apiUrl, anonKey, gestor.access_token, gestorOcc);
  if (
    gestorStart.success === false &&
    gestorStart.error?.code === "FORBIDDEN" &&
    gestorRead.success
  ) {
    record("VA-10", "PASS", "qa-gestor lê timeline; start FORBIDDEN (read only)");
  } else {
    record("VA-10", "FAIL", JSON.stringify({ gestorStart, gestorRead }));
  }

  grantSupervisorRoleToDualrole();
  const dualrole = await signIn(apiUrl, anonKey, USERS.dualrole);
  const va11Occ = await createPP(apiUrl, anonKey, field.access_token, "VA-11 race");
  const firstStart = await startEval(apiUrl, anonKey, supervisor.access_token, va11Occ);
  const secondStart = await startEval(apiUrl, anonKey, dualrole.access_token, va11Occ);
  if (
    firstStart.success &&
    secondStart.success === false &&
    secondStart.error?.code === "STATUS_MISMATCH"
  ) {
    record("VA-11", "PASS", "2º evaluator start → STATUS_MISMATCH");
  } else {
    record("VA-11", "FAIL", JSON.stringify({ firstStart, secondStart }));
  }

  const va12Occ = await createPP(apiUrl, anonKey, field.access_token, "VA-12 idempotent");
  const start1 = await startEval(apiUrl, anonKey, supervisor.access_token, va12Occ);
  const start2 = await startEval(apiUrl, anonKey, supervisor.access_token, va12Occ);
  if (start1.success && start2.success && start2.data?.current_status === "EM_AVALIACAO") {
    record("VA-12", "PASS", "duplo start mesmo evaluator → idempotente");
  } else {
    record("VA-12", "FAIL", JSON.stringify({ start1, start2 }));
  }

  const va13Occ = await createPP(apiUrl, anonKey, field.access_token, "VA-13 mismatch");
  await startEval(apiUrl, anonKey, supervisor.access_token, va13Occ);
  runLocalSql(`update public.occurrences set status = 'VER_E_AGIR' where id = '${va13Occ}';`);
  const va13 = await recordDecision(apiUrl, anonKey, supervisor.access_token, va13Occ);
  if (va13.success === false && va13.error?.code === "STATUS_MISMATCH") {
    record("VA-13", "PASS", "decisão com status VER_E_AGIR → STATUS_MISMATCH");
  } else {
    record("VA-13", "FAIL", JSON.stringify(va13));
  }

  const startBtn = readRepo("apps/web/src/features/ver-e-agir/components/start-evaluation-button.tsx");
  const decisionForm = readRepo("apps/web/src/features/ver-e-agir/components/ver-e-agir-decision-form.tsx");
  if (
    startBtn.includes("isPending") &&
    startBtn.includes("Iniciando…") &&
    decisionForm.includes("isPending") &&
    decisionForm.includes("Registrando…")
  ) {
    record("VA-15", "PASS", "loading states isPending + copy PT (contrato código)");
  } else {
    record("VA-15", "FAIL", "loading UI ausente");
  }

  const conflictWeb = readRepo("apps/web/src/features/ver-e-agir/components/ver-e-agir-states.tsx");
  const conflictMobile = readRepo("apps/mobile/src/features/ver-e-agir/components/evaluation-section.tsx");
  const evalErrors = readRepo("apps/mobile/src/features/ver-e-agir/utils/evaluation-errors.ts");
  if (
    conflictWeb.includes("Esta ocorrência já foi atualizada") &&
    conflictMobile.includes("Esta ocorrência já foi atualizada") &&
    conflictMobile.includes("EvaluationConflictCard") &&
    evalErrors.includes("isConflict()") &&
    evalErrors.includes("isOccurrenceConflictErrorCode")
  ) {
    record("VA-16", "PASS", "EvaluationConflictCard + conflict handler (contrato código)");
  } else {
    record("VA-16", "FAIL", "conflict UI incompleta");
  }

  const invalidateCaches = readRepo(
    "apps/web/src/features/ver-e-agir/hooks/use-invalidate-ver-e-agir-caches.ts",
  );
  const orgProvider = readRepo("apps/mobile/src/features/organization/provider/organization-provider.tsx");
  if (invalidateCaches.includes("decision") && orgProvider.includes("clearTenantCache")) {
    record("VA-17", "PASS", "invalidação decision + clearTenantCache na troca org");
  } else {
    record("VA-17", "FAIL", "cache org incompleto");
  }

  const authProvider = readRepo("apps/mobile/src/providers/auth-provider.tsx");
  const webAuth = readRepo("apps/web/src/providers/auth-provider.tsx");
  if (authProvider.includes("clearTenantCache") && webAuth.includes("signOut")) {
    record("VA-18", "PASS", "logout limpa sessão/cache (contrato código)");
  } else {
    record("VA-18", "FAIL", "logout mid-form não coberto");
  }

  console.log("\n=== Regressão SW-01 / EV-01 / TL-01..TL-05 ===\n");

  const sw01 = await rpc(apiUrl, anonKey, field.access_token, "create_occurrence", {
    payload: {
      organization_id: QA_ALPHA,
      area_id: QA_ALPHA_AREA,
      contractor_organization_id: QA_BETA_CONTRACTOR,
      title: "Regressão SW-01",
      task_description: "Regressão SW-01",
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

  const evOcc = await createPP(apiUrl, anonKey, field.access_token, "Regressão EV-01");
  const ev01 = await uploadEvidence(apiUrl, anonKey, field.access_token, evOcc);
  if (ev01.success) {
    record("REG-EV-01", "PASS", "upload JPEG COMPLETED");
  } else {
    record("REG-EV-01", "FAIL", JSON.stringify(ev01));
  }

  const tlOcc = await createPP(apiUrl, anonKey, field.access_token, "Regressão TL");
  const tl01 = await timeline(apiUrl, anonKey, field.access_token, tlOcc);
  const created = tl01.items?.filter((i) => i.kind === "OCCURRENCE_CREATED") ?? [];
  if (tl01.success && created.length === 1) {
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
    record("REG-TL-02", "PASS", "COMMENT_ADDED topo");
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

  console.log("\n=== RESUMO VA ===");
  const vaResults = results.filter((r) => r.id.startsWith("VA-"));
  const pass = vaResults.filter((r) => r.status === "PASS").length;
  const fail = vaResults.filter((r) => r.status === "FAIL").length;
  console.log(`PASS: ${pass}/18 | FAIL: ${fail}/18`);

  const regFail = results.filter((r) => r.id.startsWith("REG-") && r.status === "FAIL").length;
  if (regFail > 0) {
    console.log(`REGRESSÃO: ${regFail} falha(s)`);
  } else {
    console.log("REGRESSÃO: OK (SW-01, EV-01, TL-01..05)");
  }

  if (fail > 0 || regFail > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
