import { loadQaCredentials, loadSupabaseLocalEnv } from "./_local-env.mjs";

const QA_FIELD_USER_ID = "a0000000-0000-4000-8000-000000000001";
const QA_ALPHA_ORG_ID = "b0000000-0000-4000-8000-000000000001";
const QA_BETA_CONTRACTOR_ID = "b0000000-0000-4000-8000-000000000002";
const QA_ALPHA_AREA_ID = "f0000000-0000-4000-8000-000000000001";
const QA_ALPHA_CONTRACT_ID = "01000000-0000-4000-8000-000000000001";
const QA_BETA_ORG_ID = "b0000000-0000-4000-8000-000000000002";
const QA_BETA_AREA_ID = "f0000000-0000-4000-8000-000000000002";
const QA_EPSILON_CONTRACTOR_ID = "b0000000-0000-4000-8000-000000000006";
const QA_GAMMA_ORG_ID = "b0000000-0000-4000-8000-000000000003";
const QA_MULTI_EMAIL = "qa-multi@safestop.local";
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
    `${apiUrl}/rest/v1/occurrences?select=id,public_code,status,created_by,organization_id,contractor_organization_id,contract_id,occurred_at,stopped_at&id=eq.${occurrenceId}`,
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

async function rpcListOrganizationContractors(apiUrl, anonKey, accessToken, organizationId) {
  const response = await fetch(`${apiUrl}/rest/v1/rpc/list_organization_contractors`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ target_organization_id: organizationId }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`RPC list_organization_contractors falhou (${response.status}): ${body}`);
  }

  return response.json();
}

async function rpcListOrganizationContracts(
  apiUrl,
  anonKey,
  accessToken,
  organizationId,
  contractorOrganizationId = null,
) {
  const body = { target_organization_id: organizationId };

  if (contractorOrganizationId) {
    body.filter_contractor_organization_id = contractorOrganizationId;
  }

  const response = await fetch(`${apiUrl}/rest/v1/rpc/list_organization_contracts`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const responseBody = await response.text();
    throw new Error(`RPC list_organization_contracts falhou (${response.status}): ${responseBody}`);
  }

  return response.json();
}

function buildPreventiveStopPayload(overrides = {}) {
  const taskDescription =
    overrides.task_description ??
    "Manutenção elétrica em painel de distribuição com condutor exposto";

  return {
    organization_id: QA_ALPHA_ORG_ID,
    area_id: QA_ALPHA_AREA_ID,
    contractor_organization_id: QA_BETA_CONTRACTOR_ID,
    title: taskDescription.trim().slice(0, 200),
    task_description: taskDescription,
    location_description: "Subestação QA Alpha",
    condition_description: "Condutor exposto sem proteção adequada",
    severity: "HIGH",
    ...overrides,
  };
}

function assertSameInstant(left, right, label) {
  if (!left || !right || left !== right) {
    throw new Error(`${label}: esperado timestamps iguais, recebido occurred_at=${left}, stopped_at=${right}`);
  }
}

function parsePublicCodeSequence(publicCode) {
  const match = /^SS-(\d{2})-(\d{6})$/.exec(publicCode);
  if (!match) {
    return null;
  }

  return {
    year: match[1],
    sequence: Number.parseInt(match[2], 10),
  };
}

function assertNextGlobalSequence(previousCode, nextCode, label) {
  const previous = parsePublicCodeSequence(previousCode);
  const next = parsePublicCodeSequence(nextCode);

  if (!previous || !next) {
    throw new Error(`${label}: public_code inválido (${previousCode} → ${nextCode})`);
  }

  if (previous.year !== next.year || next.sequence !== previous.sequence + 1) {
    throw new Error(
      `${label}: sequência global esperada ${previousCode} → +1, recebido ${nextCode}`,
    );
  }
}

async function main() {
  const credentials = loadQaCredentials();
  const { apiUrl, anonKey } = loadSupabaseLocalEnv();

  const fieldSession = await signInWithPassword(
    apiUrl,
    anonKey,
    credentials.email,
    credentials.password,
  );

  console.log("1) SW-03 — listar contratadas com contrato ativo (Alpha)...");
  const contractorsResult = await rpcListOrganizationContractors(
    apiUrl,
    anonKey,
    fieldSession.access_token,
    QA_ALPHA_ORG_ID,
  );

  if (!contractorsResult.success) {
    throw new Error(`list_organization_contractors falhou: ${JSON.stringify(contractorsResult)}`);
  }

  const alphaContractors = contractorsResult.data;
  const betaContractor = alphaContractors.find(
    (row) => row.contractor_organization_id === QA_BETA_CONTRACTOR_ID,
  );

  if (!betaContractor || !betaContractor.contractor_name.includes("Beta")) {
    throw new Error(
      `SW-03: esperada contratada Beta, recebido ${JSON.stringify(alphaContractors)}`,
    );
  }

  console.log(`   OK — ${alphaContractors.length} contratada(s); Beta=${betaContractor.contractor_name}`);

  console.log("2) SW-04 — listar contratos Alpha filtrados por Beta...");
  const contractsResult = await rpcListOrganizationContracts(
    apiUrl,
    anonKey,
    fieldSession.access_token,
    QA_ALPHA_ORG_ID,
    QA_BETA_CONTRACTOR_ID,
  );

  if (!contractsResult.success) {
    throw new Error(`list_organization_contracts falhou: ${JSON.stringify(contractsResult)}`);
  }

  const alphaContracts = contractsResult.data;
  const alphaBetaContract = alphaContracts.find(
    (row) => row.contract_id === QA_ALPHA_CONTRACT_ID,
  );

  if (!alphaBetaContract || alphaBetaContract.contract_number !== "QA-AB-001") {
    throw new Error(
      `SW-04: esperado contrato QA-AB-001, recebido ${JSON.stringify(alphaContracts)}`,
    );
  }

  console.log(`   OK — contrato ${alphaBetaContract.contract_number} (${alphaBetaContract.name})`);

  console.log("3) SW-01 — PP completa (Alpha → Beta, contract_id opcional)...");

  const occurredAt = new Date().toISOString();
  const createResult = await rpcCreateOccurrence(
    apiUrl,
    anonKey,
    fieldSession.access_token,
    buildPreventiveStopPayload({
      contract_id: QA_ALPHA_CONTRACT_ID,
      occurred_at: occurredAt,
    }),
  );

  if (!createResult.success) {
    throw new Error(`create_occurrence retornou erro: ${JSON.stringify(createResult)}`);
  }

  const occurrence = createResult.data;
  console.log(`   OK — id=${occurrence.id}`);
  console.log(`   OK — public_code=${occurrence.public_code}`);
  console.log(`   OK — status=${occurrence.status}`);
  console.log(`   OK — contractor_organization_id=${occurrence.contractor_organization_id}`);

  if (occurrence.status !== "PARALISACAO_PREVENTIVA") {
    throw new Error(`status inicial inválido: ${occurrence.status}`);
  }

  if (occurrence.created_by !== QA_FIELD_USER_ID) {
    throw new Error(`created_by deve ser auth.uid() (${QA_FIELD_USER_ID})`);
  }

  if (occurrence.contractor_organization_id !== QA_BETA_CONTRACTOR_ID) {
    throw new Error("contractor_organization_id não persistido corretamente");
  }

  assertSameInstant(occurrence.occurred_at, occurrence.stopped_at, "A-R4 stopped_at");

  if (!/^SS-\d{2}-\d{6}$/.test(occurrence.public_code)) {
    throw new Error(`public_code fora do formato A1: ${occurrence.public_code}`);
  }

  console.log("4) RLS + can_access_occurrence...");
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

  assertSameInstant(rows[0].occurred_at, rows[0].stopped_at, "A-R4 via SELECT");
  console.log("   OK — can_access_occurrence=true, stopped_at=occurred_at confirmado");

  console.log("5) A-R2 — rejeitar sem contractor_organization_id...");
  const missingContractor = await rpcCreateOccurrence(
    apiUrl,
    anonKey,
    fieldSession.access_token,
    buildPreventiveStopPayload({ contractor_organization_id: undefined }),
  );

  if (missingContractor.success !== false || missingContractor.error?.code !== "VALIDATION_ERROR") {
    throw new Error(`Esperado VALIDATION_ERROR sem contractor, recebido ${JSON.stringify(missingContractor)}`);
  }

  console.log("   OK — contractor_organization_id obrigatório");

  console.log("6) A-R2 — rejeitar contratada sem contrato ativo na org...");
  const invalidContractor = await rpcCreateOccurrence(
    apiUrl,
    anonKey,
    fieldSession.access_token,
    buildPreventiveStopPayload({ contractor_organization_id: QA_GAMMA_ORG_ID }),
  );

  if (invalidContractor.success !== false || invalidContractor.error?.code !== "VALIDATION_ERROR") {
    throw new Error(`Esperado VALIDATION_ERROR para contratada inválida, recebido ${JSON.stringify(invalidContractor)}`);
  }

  console.log("   OK — contratada deve ter contrato ativo com a organização");

  console.log("7) A-R2 — rejeitar contract_id inconsistente com contratada...");
  const inconsistentContract = await rpcCreateOccurrence(
    apiUrl,
    anonKey,
    fieldSession.access_token,
    buildPreventiveStopPayload({
      contract_id: "01000000-0000-4000-8000-000000000002",
    }),
  );

  if (
    inconsistentContract.success !== false
    || inconsistentContract.error?.code !== "VALIDATION_ERROR"
  ) {
    throw new Error(
      `Esperado VALIDATION_ERROR para contract_id inconsistente, recebido ${JSON.stringify(inconsistentContract)}`,
    );
  }

  console.log("   OK — contract_id deve ser consistente com organization_id e contratada");

  console.log("8) create_occurrence negado para usuário sem occurrence.create...");
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
    buildPreventiveStopPayload(),
  );

  if (deniedResult.success !== false || deniedResult.error?.code !== "FORBIDDEN") {
    throw new Error(`Esperado FORBIDDEN para qa-noperm, recebido ${JSON.stringify(deniedResult)}`);
  }

  console.log("   OK — qa-noperm recebeu FORBIDDEN");

  console.log("9) payload cliente ignorado (status, public_code, stopped_at)...");
  const spoofedFieldsAt = new Date(Date.now() - 3_600_000).toISOString();
  const spoofFieldsResult = await rpcCreateOccurrence(
    apiUrl,
    anonKey,
    fieldSession.access_token,
    buildPreventiveStopPayload({
      status: "ENCERRADA",
      public_code: "SS-99-999999",
      stopped_at: spoofedFieldsAt,
      occurred_at: occurredAt,
      task_description: "Verificação de isolamento elétrico temporário",
    }),
  );

  if (!spoofFieldsResult.success) {
    throw new Error(`Criação com campos spoofados falhou: ${JSON.stringify(spoofFieldsResult)}`);
  }

  if (spoofFieldsResult.data.status !== "PARALISACAO_PREVENTIVA") {
    throw new Error(`status spoofado deveria ser ignorado: ${spoofFieldsResult.data.status}`);
  }

  if (spoofFieldsResult.data.public_code === "SS-99-999999") {
    throw new Error("public_code spoofado não deveria ser aceito");
  }

  assertSameInstant(
    spoofFieldsResult.data.occurred_at,
    spoofFieldsResult.data.stopped_at,
    "stopped_at spoofado",
  );

  if (spoofFieldsResult.data.stopped_at === spoofedFieldsAt) {
    throw new Error("stopped_at spoofado não deveria substituir occurred_at");
  }

  console.log(`   OK — status/public_code/stopped_at ignorados; public_code=${spoofFieldsResult.data.public_code}`);

  console.log("10) SW-01 Beta — qa-multi (contador global +1)...");
  const multiSession = await signInWithPassword(
    apiUrl,
    anonKey,
    QA_MULTI_EMAIL,
    credentials.password,
  );

  const betaResult = await rpcCreateOccurrence(
    apiUrl,
    anonKey,
    multiSession.access_token,
    buildPreventiveStopPayload({
      organization_id: QA_BETA_ORG_ID,
      area_id: QA_BETA_AREA_ID,
      contractor_organization_id: QA_EPSILON_CONTRACTOR_ID,
      contract_id: "01000000-0000-4000-8000-000000000002",
      task_description: "Inspeção de andaimes na área Beta",
    }),
  );

  if (!betaResult.success) {
    throw new Error(`PP Beta (qa-multi) falhou: ${JSON.stringify(betaResult)}`);
  }

  assertNextGlobalSequence(
    spoofFieldsResult.data.public_code,
    betaResult.data.public_code,
    "SW-01 Beta",
  );

  console.log(`   OK — public_code=${betaResult.data.public_code} (contador global +1)`);

  console.log("11) created_by do payload é ignorado...");
  const spoofResult = await rpcCreateOccurrence(
    apiUrl,
    anonKey,
    fieldSession.access_token,
    buildPreventiveStopPayload({ created_by: "00000000-0000-4000-8000-000000000099" }),
  );

  if (!spoofResult.success) {
    throw new Error(`Terceira criação falhou: ${JSON.stringify(spoofResult)}`);
  }

  if (spoofResult.data.created_by !== QA_FIELD_USER_ID) {
    throw new Error("created_by do payload não deveria substituir auth.uid()");
  }

  assertNextGlobalSequence(betaResult.data.public_code, spoofResult.data.public_code, "created_by");

  console.log("   OK — created_by permanece auth.uid(); sequência global +1");

  console.log("Smoke test PP (Sprint 2.1) concluído com sucesso.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
