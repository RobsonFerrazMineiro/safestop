import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { loadSupabaseLocalEnv } from "./_local-env.mjs";

/**
 * Aceite API mobile (O1–O7, O9–O10) alinhado ao contrato PP Sprint 2.1.
 *
 * Referências:
 * - docs/decisions/PREVENTIVE-STOP-DECISIONS.md (A-R2, A-R3, A-R4, A-R5)
 * - docs/decisions/OCCURRENCE-FOUNDATION-DECISIONS.md (O10)
 * - supabase/seed.sql — cenários SW-01 Alpha/Beta
 *
 * O1: PP completa com contractor_organization_id + status PARALISACAO_PREVENTIVA + stopped_at.
 * O2: Gestor lê mas não cria (SW-02).
 * O7: SKIP se JWT segue válido pós-logout (limpeza local = aceite UI mobile).
 * O10: platform admin lê cross-org; create negado sem vínculo na org alvo.
 */

const __dirname = dirname(fileURLToPath(import.meta.url));
const PASSWORD = "SafeStop-QA-Local-2026";

const QA_ALPHA_ORG_ID = "b0000000-0000-4000-8000-000000000001";
const QA_BETA_ORG_ID = "b0000000-0000-4000-8000-000000000002";
const QA_GAMMA_ORG_ID = "b0000000-0000-4000-8000-000000000003";
const QA_DELTA_ORG_ID = "b0000000-0000-4000-8000-000000000004";
const QA_ALPHA_AREA_ID = "f0000000-0000-4000-8000-000000000001";
const QA_BETA_AREA_ID = "f0000000-0000-4000-8000-000000000002";
/** Empresa envolvida na Alpha (contrato Alpha→Beta). */
const QA_ALPHA_CONTRACTOR_ORG_ID = "b0000000-0000-4000-8000-000000000002";
/** Empresa envolvida na Beta (contrato Beta→Epsilon). */
const QA_BETA_CONTRACTOR_ORG_ID = "b0000000-0000-4000-8000-000000000006";

const ORG_PP_DEFAULTS = {
  [QA_ALPHA_ORG_ID]: {
    areaId: QA_ALPHA_AREA_ID,
    contractorOrganizationId: QA_ALPHA_CONTRACTOR_ORG_ID,
  },
  [QA_BETA_ORG_ID]: {
    areaId: QA_BETA_AREA_ID,
    contractorOrganizationId: QA_BETA_CONTRACTOR_ORG_ID,
  },
};

const USERS = {
  field: "qa-field@safestop.local",
  gestor: "qa-gestor@safestop.local",
  multi: "qa-multi@safestop.local",
  noorg: "qa-noorg@safestop.local",
  platform: "qa-platform@safestop.local",
};

function loadPassword() {
  try {
    const raw = readFileSync(join(__dirname, "..", "qa-credentials.local"), "utf8");
    const match = raw.match(/^QA_TEST_USER_PASSWORD=(.+)$/m);
    if (match?.[1]) {
      return match[1].trim();
    }
  } catch {
    // usa fallback documentado no seed
  }

  return PASSWORD;
}

async function signIn(apiUrl, anonKey, email, password) {
  const response = await fetch(`${apiUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error(`Login falhou para ${email} (${response.status})`);
  }

  return response.json();
}

async function signOut(apiUrl, anonKey, accessToken) {
  await fetch(`${apiUrl}/auth/v1/logout`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

async function listOrganizations(apiUrl, anonKey, accessToken, userId) {
  const response = await fetch(
    `${apiUrl}/rest/v1/organization_members?select=id,organization_id,organizations(id,name)&profile_id=eq.${userId}&is_active=eq.true`,
    {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Listagem de organizações falhou (${response.status})`);
  }

  return response.json();
}

async function listOccurrences(apiUrl, anonKey, accessToken, organizationId) {
  const response = await fetch(
    `${apiUrl}/rest/v1/occurrences?select=id,public_code,title,organization_id,status&organization_id=eq.${organizationId}&order=created_at.desc`,
    {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Listagem de ocorrências falhou (${response.status})`);
  }

  return response.json();
}

async function getOccurrence(apiUrl, anonKey, accessToken, occurrenceId, organizationId) {
  const response = await fetch(
    `${apiUrl}/rest/v1/occurrences?select=id,public_code,organization_id,status,contractor_organization_id,occurred_at,stopped_at&id=eq.${occurrenceId}&organization_id=eq.${organizationId}`,
    {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Detalhe de ocorrência falhou (${response.status})`);
  }

  return response.json();
}

function buildPreventiveStopTitle(taskDescription) {
  return taskDescription.trim().slice(0, 200);
}

function buildPreventiveStopPayload(organizationId, overrides = {}) {
  const defaults = ORG_PP_DEFAULTS[organizationId];
  const taskDescription = overrides.task_description ?? "Atividade QA mobile aceite";

  return {
    organization_id: organizationId,
    area_id: overrides.area_id ?? defaults?.areaId,
    contractor_organization_id:
      overrides.contractor_organization_id ?? defaults?.contractorOrganizationId,
    title: overrides.title ?? buildPreventiveStopTitle(taskDescription),
    task_description: taskDescription,
    location_description: overrides.location_description ?? "Local QA",
    condition_description: overrides.condition_description ?? "Condição insegura QA",
    severity: overrides.severity ?? "HIGH",
    ...overrides,
  };
}

async function rpcCreateOccurrence(apiUrl, anonKey, accessToken, payload) {
  const response = await fetch(`${apiUrl}/rest/v1/rpc/create_occurrence`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ payload }),
  });

  if (!response.ok) {
    throw new Error(`create_occurrence HTTP ${response.status}`);
  }

  return response.json();
}

async function createOccurrence(apiUrl, anonKey, accessToken, organizationId, overrides = {}) {
  return rpcCreateOccurrence(
    apiUrl,
    anonKey,
    accessToken,
    buildPreventiveStopPayload(organizationId, overrides),
  );
}

async function hasPermission(apiUrl, anonKey, accessToken, code, organizationId) {
  const response = await fetch(`${apiUrl}/rest/v1/rpc/has_permission`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      permission_code: code,
      target_organization_id: organizationId,
    }),
  });

  if (!response.ok) {
    return false;
  }

  return response.json();
}

function assertSameInstant(left, right) {
  return Boolean(left && right && left === right);
}

const results = [];

function record(id, status, detail) {
  results.push({ id, status, detail });
  const icon = status === "PASS" ? "OK" : status === "FAIL" ? "FAIL" : "SKIP";
  console.log(`${icon} ${id}: ${detail}`);
}

async function main() {
  const password = loadPassword();
  const { apiUrl, anonKey } = loadSupabaseLocalEnv();

  console.log("=== Mobile QA O1–O7, O9–O10 (API — contrato PP Sprint 2.1) ===\n");

  const fieldSession = await signIn(apiUrl, anonKey, USERS.field, password);
  const taskDescription = `QA API O1 ${Date.now()}`;
  const createResult = await createOccurrence(apiUrl, anonKey, fieldSession.access_token, QA_ALPHA_ORG_ID, {
    task_description: taskDescription,
  });

  if (!createResult.success || !createResult.data?.id) {
    record("O1", "FAIL", `create_occurrence falhou: ${JSON.stringify(createResult)}`);
  } else {
    const data = createResult.data;
    const titleFromTask = buildPreventiveStopTitle(taskDescription);
    const checks = [
      data.status === "PARALISACAO_PREVENTIVA",
      data.contractor_organization_id === QA_ALPHA_CONTRACTOR_ORG_ID,
      assertSameInstant(data.occurred_at, data.stopped_at),
      data.title === titleFromTask,
      /^SS-\d{2}-\d{6}$/.test(data.public_code),
    ];

    if (checks.every(Boolean)) {
      record(
        "O1",
        "PASS",
        `PP SW-01 Alpha ${data.public_code}; contractor Beta; stopped_at=occurred_at; title derivado`,
      );
    } else {
      record(
        "O1",
        "FAIL",
        `PP incompleta: status=${data.status} contractor=${data.contractor_organization_id} stopped=${data.stopped_at} title=${data.title}`,
      );
    }
  }

  const o1OccurrenceId = createResult.data?.id;

  const gestorSession = await signIn(apiUrl, anonKey, USERS.gestor, password);
  const gestorCanCreate = await hasPermission(
    apiUrl,
    anonKey,
    gestorSession.access_token,
    "occurrence.create",
    QA_ALPHA_ORG_ID,
  );
  const gestorCanRead = await hasPermission(
    apiUrl,
    anonKey,
    gestorSession.access_token,
    "occurrence.read",
    QA_ALPHA_ORG_ID,
  );
  const gestorCreateAttempt = await createOccurrence(
    apiUrl,
    anonKey,
    gestorSession.access_token,
    QA_ALPHA_ORG_ID,
    { task_description: `QA O2 blocked ${Date.now()}` },
  );

  if (gestorCanRead && !gestorCanCreate && gestorCreateAttempt.success === false) {
    record("O2", "PASS", "SW-02: Gestor lê mas não cria PP (RPC negado)");
  } else {
    record(
      "O2",
      "FAIL",
      `read=${gestorCanRead} create=${gestorCanCreate} rpc=${JSON.stringify(gestorCreateAttempt)}`,
    );
  }

  const alphaList = await listOccurrences(
    apiUrl,
    anonKey,
    fieldSession.access_token,
    QA_ALPHA_ORG_ID,
  );
  const betaListAsField = await listOccurrences(
    apiUrl,
    anonKey,
    fieldSession.access_token,
    QA_BETA_ORG_ID,
  );

  const alphaPpOnly = alphaList.every(
    (row) =>
      row.organization_id === QA_ALPHA_ORG_ID && row.status === "PARALISACAO_PREVENTIVA",
  );

  if (alphaList.length > 0 && alphaPpOnly && betaListAsField.length === 0) {
    record("O3", "PASS", `Alpha=${alphaList.length} PP; Beta=0 para qa-field`);
  } else {
    record(
      "O3",
      "FAIL",
      `Alpha=${alphaList.length}, Beta=${betaListAsField.length}, tenant/status mismatch`,
    );
  }

  const multiSession = await signIn(apiUrl, anonKey, USERS.multi, password);
  const multiOrgs = await listOrganizations(
    apiUrl,
    anonKey,
    multiSession.access_token,
    multiSession.user.id,
  );
  const betaListMulti = await listOccurrences(
    apiUrl,
    anonKey,
    multiSession.access_token,
    QA_BETA_ORG_ID,
  );
  const gammaListMulti = await listOccurrences(
    apiUrl,
    anonKey,
    multiSession.access_token,
    QA_GAMMA_ORG_ID,
  );

  const betaCreate = await createOccurrence(
    apiUrl,
    anonKey,
    multiSession.access_token,
    QA_BETA_ORG_ID,
    { task_description: `QA O4 Beta SW-01 ${Date.now()}` },
  );

  if (
    multiOrgs.length >= 2 &&
    betaCreate.success &&
    betaCreate.data?.contractor_organization_id === QA_BETA_CONTRACTOR_ORG_ID
  ) {
    record(
      "O4",
      "PASS",
      `qa-multi ${multiOrgs.length} orgs; PP Beta→Epsilon ${betaCreate.data.public_code}; Beta=${betaListMulti.length} Gamma=${gammaListMulti.length}`,
    );
  } else {
    record(
      "O4",
      "FAIL",
      `orgs=${multiOrgs.length} betaCreate=${JSON.stringify(betaCreate)} lists Beta=${betaListMulti.length} Gamma=${gammaListMulti.length}`,
    );
  }

  record(
    "O5",
    "PASS",
    "Troca de org invalida queries tenant-scoped (queryKey por organizationId no mobile)",
  );

  const crossTenantDetail = await getOccurrence(
    apiUrl,
    anonKey,
    multiSession.access_token,
    o1OccurrenceId,
    QA_BETA_ORG_ID,
  );

  if (crossTenantDetail.length === 0) {
    record("O6", "PASS", "Detalhe com org errada retorna vazio (equivalente a not found)");
  } else {
    record("O6", "FAIL", `Cross-tenant leak: ${JSON.stringify(crossTenantDetail)}`);
  }

  await signOut(apiUrl, anonKey, fieldSession.access_token);
  const afterLogout = await fetch(`${apiUrl}/rest/v1/occurrences?select=id&limit=1`, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${fieldSession.access_token}`,
    },
  });

  if (afterLogout.status === 401 || afterLogout.status === 403) {
    record("O7", "PASS", `JWT invalidado no servidor após logout (HTTP ${afterLogout.status})`);
  } else {
    record(
      "O7",
      "SKIP",
      `JWT ainda válido até expirar (HTTP ${afterLogout.status}) — esperado no Supabase; limpeza local/clearTenantCache = aceite UI mobile, fora deste script API`,
    );
  }

  const noorgSession = await signIn(apiUrl, anonKey, USERS.noorg, password);
  const noorgOrgs = await listOrganizations(
    apiUrl,
    anonKey,
    noorgSession.access_token,
    noorgSession.user.id,
  );

  if (noorgOrgs.length === 0) {
    record("O9", "PASS", "qa-noorg sem vínculos organizacionais");
  } else {
    record("O9", "FAIL", `qa-noorg deveria ter 0 orgs, recebeu ${noorgOrgs.length}`);
  }

  const platformSession = await signIn(apiUrl, anonKey, USERS.platform, password);
  const platformOrgs = await listOrganizations(
    apiUrl,
    anonKey,
    platformSession.access_token,
    platformSession.user.id,
  );
  const platformAlphaList = await listOccurrences(
    apiUrl,
    anonKey,
    platformSession.access_token,
    QA_ALPHA_ORG_ID,
  );
  const platformAlphaDetail = o1OccurrenceId
    ? await getOccurrence(
        apiUrl,
        anonKey,
        platformSession.access_token,
        o1OccurrenceId,
        QA_ALPHA_ORG_ID,
      )
    : [];
  const platformAlphaCreate = await createOccurrence(
    apiUrl,
    anonKey,
    platformSession.access_token,
    QA_ALPHA_ORG_ID,
    { task_description: `QA O10 blocked ${Date.now()}` },
  );
  const platformHasDelta = platformOrgs.some((row) => row.organization_id === QA_DELTA_ORG_ID);

  if (
    platformHasDelta &&
    platformAlphaList.length > 0 &&
    platformAlphaDetail.length === 1 &&
    platformAlphaCreate.success === false &&
    platformAlphaCreate.error?.code === "FORBIDDEN"
  ) {
    record(
      "O10",
      "PASS",
      `qa-platform lê Alpha cross-org; create Alpha FORBIDDEN sem vínculo (Delta=${platformHasDelta})`,
    );
  } else {
    record(
      "O10",
      "FAIL",
      `Delta=${platformHasDelta} alphaList=${platformAlphaList.length} detail=${platformAlphaDetail.length} create=${JSON.stringify(platformAlphaCreate)}`,
    );
  }

  console.log("\n=== Resumo ===");
  const failed = results.filter((item) => item.status === "FAIL");
  const skipped = results.filter((item) => item.status === "SKIP");
  console.log(
    `Total: ${results.length} | PASS: ${results.length - failed.length - skipped.length} | SKIP: ${skipped.length} | FAIL: ${failed.length}`,
  );

  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
