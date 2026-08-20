import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { loadSupabaseLocalEnv } from "./_local-env.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..", "..");
const PASSWORD = "SafeStop-QA-Local-2026";

const USERS = {
  field: "qa-field@safestop.local",
  gestor: "qa-gestor@safestop.local",
  multi: "qa-multi@safestop.local",
};

const QA_ALPHA = "b0000000-0000-4000-8000-000000000001";
const QA_BETA = "b0000000-0000-4000-8000-000000000002";
const QA_GAMMA = "b0000000-0000-4000-8000-000000000003";
const QA_ALPHA_AREA = "f0000000-0000-4000-8000-000000000001";
const QA_BETA_AREA = "f0000000-0000-4000-8000-000000000002";
const QA_BETA_CONTRACTOR = "b0000000-0000-4000-8000-000000000002";
const QA_ALPHA_CONTRACT = "01000000-0000-4000-8000-000000000001";
const QA_GAMMA_CONTRACT = "01000000-0000-4000-8000-000000000099";

const results = [];

function record(id, status, detail) {
  results.push({ id, status, detail });
  console.log(`${status === "PASS" ? "PASS" : "FAIL"} ${id}: ${detail}`);
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

async function rpc(apiUrl, anonKey, token, payload) {
  const response = await fetch(`${apiUrl}/rest/v1/rpc/create_occurrence`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ payload }),
  });
  if (!response.ok) throw new Error(`RPC HTTP ${response.status}`);
  return response.json();
}

async function hasPerm(apiUrl, anonKey, token, code, orgId) {
  const response = await fetch(`${apiUrl}/rest/v1/rpc/has_permission`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ permission_code: code, target_organization_id: orgId }),
  });
  return response.ok ? response.json() : false;
}

async function listPP(apiUrl, anonKey, token, orgId) {
  const response = await fetch(
    `${apiUrl}/rest/v1/occurrences?select=id,status,organization_id&organization_id=eq.${orgId}&status=eq.PARALISACAO_PREVENTIVA`,
    { headers: { apikey: anonKey, Authorization: `Bearer ${token}` } },
  );
  if (!response.ok) throw new Error(`List HTTP ${response.status}`);
  return response.json();
}

async function getHistory(apiUrl, anonKey, token, id) {
  const response = await fetch(
    `${apiUrl}/rest/v1/occurrence_status_history?select=from_status,to_status&occurrence_id=eq.${id}&order=changed_at.asc`,
    { headers: { apikey: anonKey, Authorization: `Bearer ${token}` } },
  );
  if (!response.ok) throw new Error(`History HTTP ${response.status}`);
  return response.json();
}

async function getDetail(apiUrl, anonKey, token, id, orgId) {
  const response = await fetch(
    `${apiUrl}/rest/v1/occurrences?select=id,public_code,status&id=eq.${id}&organization_id=eq.${orgId}`,
    { headers: { apikey: anonKey, Authorization: `Bearer ${token}` } },
  );
  if (!response.ok) throw new Error(`Detail HTTP ${response.status}`);
  return response.json();
}

function buildPP(overrides = {}) {
  return {
    organization_id: QA_ALPHA,
    area_id: QA_ALPHA_AREA,
    contractor_organization_id: QA_BETA_CONTRACTOR,
    title: "PP QA SW",
    task_description: "PP QA SW",
    location_description: "Local QA",
    condition_description: "Condição QA",
    severity: "HIGH",
    ...overrides,
  };
}

async function main() {
  const { apiUrl, anonKey } = loadSupabaseLocalEnv();
  console.log("=== QA Sprint 2.1 — Matriz SW-01 a SW-12 ===\n");

  const field = await signIn(apiUrl, anonKey, USERS.field);

  const sw01 = await rpc(apiUrl, anonKey, field.access_token, buildPP({ contract_id: QA_ALPHA_CONTRACT }));
  if (
    sw01.success &&
    sw01.data?.status === "PARALISACAO_PREVENTIVA" &&
    /^SS-\d{2}-\d{6}$/.test(sw01.data.public_code) &&
    sw01.data.contractor_organization_id === QA_BETA_CONTRACTOR
  ) {
    record("SW-01", "PASS", `${sw01.data.public_code} PARALISACAO_PREVENTIVA contractor=Beta`);
  } else {
    record("SW-01", "FAIL", JSON.stringify(sw01));
  }
  const ppId = sw01.data?.id;

  const gestor = await signIn(apiUrl, anonKey, USERS.gestor);
  const gRead = await hasPerm(apiUrl, anonKey, gestor.access_token, "occurrence.read", QA_ALPHA);
  const gCreate = await hasPerm(apiUrl, anonKey, gestor.access_token, "occurrence.create", QA_ALPHA);
  const gRpc = await rpc(apiUrl, anonKey, gestor.access_token, buildPP());
  if (gRead && !gCreate && gRpc.success === false && gRpc.error?.code === "FORBIDDEN") {
    record("SW-02", "PASS", "qa-gestor: read sim, create não, RPC FORBIDDEN");
  } else {
    record("SW-02", "FAIL", `read=${gRead} create=${gCreate} rpc=${JSON.stringify(gRpc)}`);
  }

  const sw03 = await rpc(
    apiUrl,
    anonKey,
    field.access_token,
    buildPP({
      title: "",
      task_description: "",
      location_description: "",
      condition_description: "",
    }),
  );
  if (sw03.success === false && sw03.error?.code === "VALIDATION_ERROR") {
    record("SW-03", "PASS", `RPC VALIDATION_ERROR: ${sw03.error.message}`);
  } else {
    record("SW-03", "FAIL", JSON.stringify(sw03));
  }

  const sw04Area = await rpc(
    apiUrl,
    anonKey,
    field.access_token,
    buildPP({ area_id: QA_BETA_AREA }),
  );
  const sw04Contract = await rpc(
    apiUrl,
    anonKey,
    field.access_token,
    buildPP({ contract_id: QA_GAMMA_CONTRACT }),
  );
  const areaOk =
    sw04Area.success === false &&
    (sw04Area.error?.code === "VALIDATION_ERROR" || sw04Area.error?.code === "FORBIDDEN");
  const contractOk = sw04Contract.success === false && sw04Contract.error?.code === "VALIDATION_ERROR";
  if (areaOk && contractOk) {
    record(
      "SW-04",
      "PASS",
      `área cross-org=${sw04Area.error.code}; contract_id inconsistente=${sw04Contract.error.code}`,
    );
  } else {
    record("SW-04", "FAIL", `area=${JSON.stringify(sw04Area)} contract=${JSON.stringify(sw04Contract)}`);
  }

  const list = await listPP(apiUrl, anonKey, field.access_token, QA_ALPHA);
  if (list.length > 0 && list.every((r) => r.status === "PARALISACAO_PREVENTIVA")) {
    record("SW-05", "PASS", `${list.length} PP(s) status=PARALISACAO_PREVENTIVA org Alpha`);
  } else {
    record("SW-05", "FAIL", JSON.stringify(list));
  }

  if (ppId) {
    const detail = await getDetail(apiUrl, anonKey, field.access_token, ppId, QA_ALPHA);
    const history = await getHistory(apiUrl, anonKey, field.access_token, ppId);
    const timelineOk =
      history.length === 1 &&
      history[0].from_status === null &&
      history[0].to_status === "PARALISACAO_PREVENTIVA";
    const leadershipSrc = readFileSync(
      join(REPO_ROOT, "apps/web/src/features/stop-work/components/leadership-decision-section.tsx"),
      "utf8",
    );
    const decisionUiGated =
      leadershipSrc.includes("if (!shouldRenderSection)") &&
      leadershipSrc.includes("vaContext.canRecordVerEAgir") &&
      leadershipSrc.includes("ioContext.canConfirmInterdiction");
    if (detail.length === 1 && timelineOk && decisionUiGated) {
      record(
        "SW-06",
        "PASS",
        "detalhe 1 linha; timeline 1 entrada; CTAs de decisão gated por permissão",
      );
    } else {
      record(
        "SW-06",
        "FAIL",
        `detail=${detail.length} history=${JSON.stringify(history)} decisionUiGated=${decisionUiGated}`,
      );
    }
  } else {
    record("SW-06", "FAIL", "sem PP de SW-01");
  }

  const multi = await signIn(apiUrl, anonKey, USERS.multi);
  const cross = await getDetail(apiUrl, anonKey, multi.access_token, ppId, QA_BETA);
  if (cross.length === 0) {
    record("SW-07", "PASS", "qa-multi org Beta: PP Alpha inacessível (0 linhas)");
  } else {
    record("SW-07", "FAIL", JSON.stringify(cross));
  }

  const draftStore = readFileSync(
    join(REPO_ROOT, "apps/mobile/src/features/stop-work/stores/preventive-stop-draft-store.ts"),
    "utf8",
  );
  const draftHook = readFileSync(
    join(REPO_ROOT, "apps/mobile/src/features/stop-work/hooks/use-preventive-stop-draft.ts"),
    "utf8",
  );
  const createScreen = readFileSync(
    join(REPO_ROOT, "apps/mobile/src/features/stop-work/components/preventive-stop-create-screen.tsx"),
    "utf8",
  );
  if (
    draftStore.includes("getStorageKey(userId: string, organizationId: string)") &&
    draftHook.includes("scopeKey") &&
    createScreen.includes("updateDraft") &&
    createScreen.includes("hasLocalDraft")
  ) {
    record("SW-08", "PASS", "draft persiste via secure storage + hydrate no create screen (contrato código)");
  } else {
    record("SW-08", "FAIL", "contrato draft incompleto");
  }

  if (
    draftStore.includes("getStorageKey(userId: string, organizationId: string)") &&
    draftHook.includes("scopeKey")
  ) {
    record("SW-09", "PASS", "chave draft scoped userId:organizationId; scopeKey no hook");
  } else {
    record("SW-09", "FAIL", "isolamento por org não confirmado");
  }

  const authProvider = readFileSync(
    join(REPO_ROOT, "apps/mobile/src/providers/auth-provider.tsx"),
    "utf8",
  );
  const clearsOnLogout = /clearStoredPreventiveStopDraft|preventiveStopDraft/.test(authProvider);
  if (!clearsOnLogout) {
    record("SW-10", "PASS", "logout não limpa draft PP (política: mantido conforme arquitetura)");
  } else {
    record("SW-10", "FAIL", "draft limpo no logout — verificar política");
  }

  const sw11 = await rpc(
    apiUrl,
    anonKey,
    field.access_token,
    buildPP({ task_description: `SW11 sem geo ${Date.now()}`, title: `SW11 ${Date.now()}` }),
  );
  const geoHook = readFileSync(
    join(REPO_ROOT, "apps/mobile/src/features/stop-work/hooks/use-preventive-stop-geo.ts"),
    "utf8",
  );
  if (sw11.success && geoHook.includes('status: "unavailable"') && createScreen.includes("...geo.coords")) {
    record("SW-11", "PASS", "RPC sem coords OK; geo negada → unavailable, submit continua");
  } else {
    record("SW-11", "FAIL", `rpc=${JSON.stringify(sw11)}`);
  }

  const successView = readFileSync(
    join(REPO_ROOT, "apps/mobile/src/features/stop-work/components/preventive-stop-success-view.tsx"),
    "utf8",
  );
  if (
    successView.includes("registrada no servidor") &&
    !/notificad/i.test(successView) &&
    successView.includes("publicCode")
  ) {
    record("SW-12", "PASS", "sucesso com SS-* + registrada no servidor; sem notificação");
  } else {
    record("SW-12", "FAIL", "copy de sucesso incorreta");
  }

  console.log("\n=== RESUMO ===");
  const pass = results.filter((r) => r.status === "PASS").length;
  const fail = results.filter((r) => r.status === "FAIL").length;
  console.log(`PASS: ${pass}/12 | FAIL: ${fail}/12`);
  if (fail > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
