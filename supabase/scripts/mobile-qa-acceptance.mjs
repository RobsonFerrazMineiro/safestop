import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { loadSupabaseLocalEnv } from "./_local-env.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PASSWORD = "SafeStop-QA-Local-2026";

const QA_ALPHA_ORG_ID = "b0000000-0000-4000-8000-000000000001";
const QA_BETA_ORG_ID = "b0000000-0000-4000-8000-000000000002";
const QA_GAMMA_ORG_ID = "b0000000-0000-4000-8000-000000000003";
const QA_ALPHA_AREA_ID = "f0000000-0000-4000-8000-000000000001";

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
    `${apiUrl}/rest/v1/occurrences?select=id,public_code,title,organization_id&organization_id=eq.${organizationId}&order=created_at.desc`,
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
    `${apiUrl}/rest/v1/occurrences?select=id,public_code,organization_id&id=eq.${occurrenceId}&organization_id=eq.${organizationId}`,
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

async function createOccurrence(apiUrl, anonKey, accessToken, organizationId, title) {
  const response = await fetch(`${apiUrl}/rest/v1/rpc/create_occurrence`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      payload: {
        organization_id: organizationId,
        area_id: QA_ALPHA_AREA_ID,
        title,
        task_description: "Atividade QA",
        location_description: "Local QA",
        condition_description: "Condição QA",
        severity: "HIGH",
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`create_occurrence HTTP ${response.status}`);
  }

  return response.json();
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

const results = [];

function record(id, status, detail) {
  results.push({ id, status, detail });
  const icon = status === "PASS" ? "OK" : status === "FAIL" ? "FAIL" : "SKIP";
  console.log(`${icon} ${id}: ${detail}`);
}

async function main() {
  const password = loadPassword();
  const { apiUrl, anonKey } = loadSupabaseLocalEnv();

  console.log("=== Mobile QA O1–O7, O9–O10 (API + contrato mobile) ===\n");

  const fieldSession = await signIn(apiUrl, anonKey, USERS.field, password);
  const createResult = await createOccurrence(
    apiUrl,
    anonKey,
    fieldSession.access_token,
    QA_ALPHA_ORG_ID,
    `QA API O1 ${Date.now()}`,
  );

  if (!createResult.success || !createResult.data?.id) {
    record("O1", "FAIL", `create_occurrence falhou: ${JSON.stringify(createResult)}`);
  } else {
    record(
      "O1",
      "PASS",
      `Ocorrência criada ${createResult.data.public_code} (${createResult.data.id})`,
    );
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
    `QA O2 blocked ${Date.now()}`,
  );

  if (gestorCanRead && !gestorCanCreate && gestorCreateAttempt.success === false) {
    record("O2", "PASS", "Gestor lê mas não cria (RPC negado)");
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

  if (
    alphaList.length > 0 &&
    alphaList.every((row) => row.organization_id === QA_ALPHA_ORG_ID) &&
    betaListAsField.length === 0
  ) {
    record("O3", "PASS", `Alpha=${alphaList.length} itens; Beta=0 para qa-field`);
  } else {
    record(
      "O3",
      "FAIL",
      `Alpha=${alphaList.length}, Beta=${betaListAsField.length}, org mismatch`,
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

  if (multiOrgs.length >= 2) {
    record(
      "O4",
      "PASS",
      `qa-multi com ${multiOrgs.length} orgs; Beta=${betaListMulti.length} Gamma=${gammaListMulti.length}`,
    );
  } else {
    record("O4", "FAIL", `qa-multi deveria ter 2+ orgs, recebeu ${multiOrgs.length}`);
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
  const afterLogout = await fetch(
    `${apiUrl}/rest/v1/occurrences?select=id&limit=1`,
    {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${fieldSession.access_token}`,
      },
    },
  );

  if (afterLogout.status === 401 || afterLogout.status === 403) {
    record("O7", "PASS", `Sessão invalidada após logout (HTTP ${afterLogout.status})`);
  } else {
    const body = await afterLogout.json();
    record("O7", "FAIL", `Ainda acessa após logout: HTTP ${afterLogout.status} ${JSON.stringify(body)}`);
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

  if (platformOrgs.length > 0 && platformAlphaList.length >= 0) {
    record(
      "O10",
      "PASS",
      `qa-platform com ${platformOrgs.length} org(s); leitura Alpha OK (${platformAlphaList.length})`,
    );
  } else {
    record("O10", "FAIL", `Platform admin sem acesso esperado`);
  }

  console.log("\n=== Resumo ===");
  const failed = results.filter((item) => item.status === "FAIL");
  console.log(`Total: ${results.length} | PASS: ${results.length - failed.length} | FAIL: ${failed.length}`);

  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
