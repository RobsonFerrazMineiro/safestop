import { loadQaCredentials, loadSupabaseLocalEnv } from "./_local-env.mjs";

const QA_FIELD_USER_ID = "a0000000-0000-4000-8000-000000000001";
const QA_ALPHA_ORG_ID = "b0000000-0000-4000-8000-000000000001";
const QA_ALPHA_AREA_ID = "f0000000-0000-4000-8000-000000000001";
const QA_NOPERM_EMAIL = "qa-noperm@safestop.local";

async function signInWithPassword(apiUrl, anonKey, email, password) {
  const response = await fetch(`${apiUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`signInWithPassword falhou (${response.status}): ${body}`);
  }

  return response.json();
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
    const body = await response.text();
    throw new Error(`RPC create_occurrence falhou (${response.status}): ${body}`);
  }

  return response.json();
}

async function fetchOccurrence(apiUrl, anonKey, accessToken, occurrenceId) {
  const response = await fetch(
    `${apiUrl}/rest/v1/occurrences?select=id,public_code,status,created_by,organization_id&id=eq.${occurrenceId}`,
    {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Consulta occurrences falhou (${response.status}): ${body}`);
  }

  return response.json();
}

async function rpcCanAccessOccurrence(apiUrl, anonKey, accessToken, occurrenceId) {
  const response = await fetch(`${apiUrl}/rest/v1/rpc/can_access_occurrence`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ target_occurrence_id: occurrenceId }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`RPC can_access_occurrence falhou (${response.status}): ${body}`);
  }

  return response.json();
}

function buildPayload(overrides = {}) {
  return {
    organization_id: QA_ALPHA_ORG_ID,
    area_id: QA_ALPHA_AREA_ID,
    title: "QA Paralisação Preventiva",
    task_description: "Manutenção elétrica em painel de distribuição",
    location_description: "Subestação QA Alpha",
    condition_description: "Condutor exposto sem proteção adequada",
    severity: "HIGH",
    ...overrides,
  };
}

async function main() {
  const credentials = loadQaCredentials();
  const { apiUrl, anonKey } = loadSupabaseLocalEnv();

  console.log("1) create_occurrence como qa-field (com occurrence.create)...");
  const fieldSession = await signInWithPassword(
    apiUrl,
    anonKey,
    credentials.email,
    credentials.password,
  );

  const createResult = await rpcCreateOccurrence(
    apiUrl,
    anonKey,
    fieldSession.access_token,
    buildPayload(),
  );

  if (!createResult.success) {
    throw new Error(`create_occurrence retornou erro: ${JSON.stringify(createResult)}`);
  }

  const occurrence = createResult.data;
  console.log(`   OK — id=${occurrence.id}`);
  console.log(`   OK — public_code=${occurrence.public_code}`);
  console.log(`   OK — status=${occurrence.status}`);
  console.log(`   OK — created_by=${occurrence.created_by}`);

  if (occurrence.status !== "PARALISACAO_PREVENTIVA") {
    throw new Error(`status inicial inválido: ${occurrence.status}`);
  }

  if (occurrence.created_by !== QA_FIELD_USER_ID) {
    throw new Error(`created_by deve ser auth.uid() (${QA_FIELD_USER_ID}), recebido ${occurrence.created_by}`);
  }

  if (!/^SS-\d{2}-\d{6}$/.test(occurrence.public_code)) {
    throw new Error(`public_code fora do formato A1: ${occurrence.public_code}`);
  }

  console.log("2) RLS + can_access_occurrence para a ocorrência criada...");
  const canAccess = await rpcCanAccessOccurrence(
    apiUrl,
    anonKey,
    fieldSession.access_token,
    occurrence.id,
  );

  if (canAccess !== true) {
    throw new Error(`can_access_occurrence deveria ser true, recebido ${canAccess}`);
  }

  const rows = await fetchOccurrence(
    apiUrl,
    anonKey,
    fieldSession.access_token,
    occurrence.id,
  );

  if (rows.length !== 1) {
    throw new Error(`RLS de leitura falhou: esperado 1 linha, recebido ${rows.length}`);
  }

  console.log("   OK — can_access_occurrence=true e SELECT via RLS retornou 1 linha");

  console.log("3) create_occurrence negado para usuário sem occurrence.create...");
  const noPermSession = await signInWithPassword(
    apiUrl,
    anonKey,
    QA_NOPERM_EMAIL,
    credentials.password,
  );

  const deniedResult = await rpcCreateOccurrence(
    apiUrl,
    anonKey,
    noPermSession.access_token,
    buildPayload(),
  );

  if (deniedResult.success !== false || deniedResult.error?.code !== "FORBIDDEN") {
    throw new Error(`Esperado FORBIDDEN para qa-noperm, recebido ${JSON.stringify(deniedResult)}`);
  }

  console.log("   OK — qa-noperm recebeu FORBIDDEN");

  console.log("4) created_by do payload é ignorado...");
  const spoofResult = await rpcCreateOccurrence(
    apiUrl,
    anonKey,
    fieldSession.access_token,
    buildPayload({ created_by: "00000000-0000-4000-8000-000000000099" }),
  );

  if (!spoofResult.success) {
    throw new Error(`Segunda criação falhou: ${JSON.stringify(spoofResult)}`);
  }

  if (spoofResult.data.created_by !== QA_FIELD_USER_ID) {
    throw new Error("created_by do payload não deveria substituir auth.uid()");
  }

  console.log("   OK — created_by permanece auth.uid()");

  console.log("Smoke test create_occurrence + can_access_occurrence concluído com sucesso.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
