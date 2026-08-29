/**
 * Smoke test — list_operational_occurrences (PR-D1 / GATE D1 / PO-UX-10)
 *
 * Referência: docs/api.md (RPC lista operacional) · docs/database.md §25.4
 *             supabase/migrations/20260825220000_list_operational_occurrences.sql
 *
 * Dataset determinístico (prefixo OP-OC-), inserido/limpo via runLocalSql.
 * Não reutiliza o fixture REP-OC nem list_occurrences_report nos casos de busca.
 *
 * Uso: node supabase/scripts/smoke-list-operational-occurrences.mjs
 * Pré-requisito: Supabase local + seed (pnpm supabase:db:reset se o seed QA não existir)
 */
import { loadSupabaseLocalEnv, runLocalSql } from "./_local-env.mjs";

const PASSWORD = "SafeStop-QA-Local-2026";

const QA_ALPHA_ORG = "b0000000-0000-4000-8000-000000000001";
const QA_BETA_ORG = "b0000000-0000-4000-8000-000000000002";
const QA_ALPHA_AREA = "f0000000-0000-4000-8000-000000000001";
const QA_BETA_AREA = "f0000000-0000-4000-8000-000000000002";
const QA_ALPHA_UNIT = "e0000000-0000-4000-8000-000000000001";
const QA_ALPHA_BETA_CONTRACT = "01000000-0000-4000-8000-000000000001";
const QA_BETA_CONTRACTOR_ORG = "b0000000-0000-4000-8000-000000000002";
const QA_FIELD_PROFILE = "a0000000-0000-4000-8000-000000000001";

const USERS = {
  gestor: "qa-gestor@safestop.local",
  field: "qa-field@safestop.local",
  noperm: "qa-noperm@safestop.local",
};

const suffix = Date.now().toString().slice(-6);
const CODE_PREFIX = `OP-OC-${suffix}`;
const AREA_NAME = `OP-OC Area ${suffix}`;
const ACTIVITY = `OP-OC-ACT-${suffix} vazamento de flange`;
const IMS_CODE = `OP-IMS-${suffix}`;
const CONTRACTOR_NAME = "QA Beta Contratada";

function fixtureId(index) {
  return `f0d10000-0000-4000-8000-${suffix.padStart(11, "0")}${index}`;
}

const FIXTURE = {
  area: fixtureId(9),
  withArea: fixtureId(1),
  withIms: fixtureId(2),
  noContractor: fixtureId(3),
  beta: fixtureId(4),
};

const SUMMARY_KEYS = [
  "id",
  "publicCode",
  "title",
  "status",
  "severity",
  "areaName",
  "contractorOrganizationName",
  "createdAt",
  "createdByName",
];

const results = [];
function record(id, ok, detail) {
  results.push({ id, ok });
  console.log(`${ok ? "PASS" : "FAIL"} ${id}: ${detail}`);
}

async function signIn(apiUrl, anonKey, email) {
  const response = await fetch(`${apiUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: anonKey, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: PASSWORD }),
  });
  if (!response.ok) {
    throw new Error(`Login ${email} falhou (${response.status}): ${await response.text()}`);
  }
  return response.json();
}

async function rpc(apiUrl, anonKey, token, fn, body) {
  const headers = {
    apikey: anonKey,
    "Content-Type": "application/json",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${apiUrl}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => null);
  return { ok: response.ok, status: response.status, data };
}

function listOperational(apiUrl, anonKey, token, body) {
  return rpc(apiUrl, anonKey, token, "list_operational_occurrences", {
    p_organization_id: QA_ALPHA_ORG,
    p_limit: 100,
    ...body,
  });
}

function insertFixture() {
  runLocalSql(`
    insert into public.areas (id, organization_id, unit_id, name, code, is_active)
    values (
      '${FIXTURE.area}',
      '${QA_ALPHA_ORG}',
      '${QA_ALPHA_UNIT}',
      '${AREA_NAME}',
      'OP-OC-${suffix}',
      true
    );
  `);
  runLocalSql(`
    insert into public.occurrences (
      id, organization_id, area_id, contract_id, contractor_organization_id,
      public_code, title, task_description, condition_description, location_description,
      severity, status, decision_type, ims_reference_code,
      created_by, occurred_at, created_at
    ) values
      (
        '${FIXTURE.withArea}', '${QA_ALPHA_ORG}', '${FIXTURE.area}',
        '${QA_ALPHA_BETA_CONTRACT}', '${QA_BETA_CONTRACTOR_ORG}',
        '${CODE_PREFIX}-1', 'OP-OC area search', '${ACTIVITY}', 'QA', 'local OP-OC',
        'HIGH', 'PARALISACAO_PREVENTIVA', null, null,
        '${QA_FIELD_PROFILE}', now(), now()
      ),
      (
        '${FIXTURE.withIms}', '${QA_ALPHA_ORG}', '${QA_ALPHA_AREA}',
        '${QA_ALPHA_BETA_CONTRACT}', '${QA_BETA_CONTRACTOR_ORG}',
        '${CODE_PREFIX}-2', 'OP-OC ims', 'atividade comum', 'QA', 'local OP-OC',
        'CRITICAL', 'INTERDICAO_CONFIRMADA', 'INTERDICAO_OFICIAL', '${IMS_CODE}',
        '${QA_FIELD_PROFILE}', now() - interval '1 minute', now() - interval '1 minute'
      ),
      (
        '${FIXTURE.noContractor}', '${QA_ALPHA_ORG}', '${QA_ALPHA_AREA}',
        null, null,
        '${CODE_PREFIX}-3', 'OP-OC sem contratada', 'atividade comum', 'QA', 'local OP-OC',
        'MEDIUM', 'EM_AVALIACAO', null, null,
        '${QA_FIELD_PROFILE}', now() - interval '2 minutes', now() - interval '2 minutes'
      ),
      (
        '${FIXTURE.beta}', '${QA_BETA_ORG}', '${QA_BETA_AREA}',
        null, null,
        '${CODE_PREFIX}-B', 'OP-OC beta tenant', 'atividade beta', 'QA', 'local beta',
        'LOW', 'PARALISACAO_PREVENTIVA', null, null,
        '${QA_FIELD_PROFILE}', now(), now()
      );
  `);
}

function cleanupFixture() {
  try {
    runLocalSql(`
      delete from public.occurrences
      where id in (
        '${FIXTURE.withArea}', '${FIXTURE.withIms}',
        '${FIXTURE.noContractor}', '${FIXTURE.beta}'
      );
    `);
  } catch {
    // fixture ausente
  }
  try {
    runLocalSql(`delete from public.areas where id = '${FIXTURE.area}';`);
  } catch {
    // área ausente
  }
}

function itemsOf(result) {
  return Array.isArray(result?.data?.items) ? result.data.items : [];
}

function findById(items, id) {
  return items.find((item) => item.id === id);
}

function hasSummaryShape(item) {
  if (!item || typeof item !== "object") {
    return false;
  }
  const hasKeys = SUMMARY_KEYS.every((key) => key in item);
  const noJoinCols = !("statusFamily" in item) && !("actionItems" in item) && !("participants" in item);
  return hasKeys && noJoinCols;
}

async function main() {
  const { apiUrl, anonKey } = loadSupabaseLocalEnv();

  const gestorSession = await signIn(apiUrl, anonKey, USERS.gestor);
  const fieldSession = await signIn(apiUrl, anonKey, USERS.field);
  const nopermSession = await signIn(apiUrl, anonKey, USERS.noperm);
  const gestorToken = gestorSession.access_token;
  const fieldToken = fieldSession.access_token;
  const nopermToken = nopermSession.access_token;

  cleanupFixture();
  insertFixture();

  try {
    const unauth = await listOperational(apiUrl, anonKey, null, { p_limit: 5 });
    record(
      "D1-AUTH",
      !unauth.ok,
      `sem token → HTTP ${unauth.status} (esperado falha 401/403)`,
    );

    const fieldList = await listOperational(apiUrl, anonKey, fieldToken, {
      p_search: CODE_PREFIX,
    });
    const fieldItems = itemsOf(fieldList);
    record(
      "D1-PERM-FIELD",
      fieldList.ok &&
        fieldItems.length >= 3 &&
        Boolean(findById(fieldItems, FIXTURE.withArea)) &&
        fieldItems.every(hasSummaryShape),
      `qa-field Alpha: HTTP ${fieldList.status} items=${fieldItems.length} (esperado >=3 do fixture)`,
    );

    const gestorList = await listOperational(apiUrl, anonKey, gestorToken, {
      p_search: CODE_PREFIX,
    });
    const gestorItems = itemsOf(gestorList);
    record(
      "D1-PERM-GESTOR",
      gestorList.ok && gestorItems.length >= 3 && Boolean(findById(gestorItems, FIXTURE.withArea)),
      `qa-gestor: HTTP ${gestorList.status} items=${gestorItems.length}`,
    );

    const denied = await listOperational(apiUrl, anonKey, nopermToken, { p_limit: 10 });
    const deniedMessage = denied.data?.message ?? "";
    record(
      "D1-PERM-DENIED",
      !denied.ok &&
        (denied.status === 403 || denied.status === 400) &&
        String(deniedMessage).startsWith("FORBIDDEN"),
      `qa-noperm (seed, sem occurrence.read): HTTP ${denied.status} message=${deniedMessage}`,
    );

    const alphaSeesBeta = Boolean(findById(gestorItems, FIXTURE.beta));
    const crossOrg = await rpc(apiUrl, anonKey, fieldToken, "list_operational_occurrences", {
      p_organization_id: QA_BETA_ORG,
      p_limit: 10,
    });
    const betaSearch = await listOperational(apiUrl, anonKey, gestorToken, {
      p_search: `${CODE_PREFIX}-B`,
    });
    record(
      "D1-TENANT",
      !alphaSeesBeta &&
        itemsOf(betaSearch).length === 0 &&
        !crossOrg.ok &&
        (crossOrg.status === 403 || crossOrg.status === 400),
      `Alpha não vê fixture Beta (in-list=${alphaSeesBeta} searchB=${itemsOf(betaSearch).length}); field→Beta HTTP ${crossOrg.status}`,
    );

    const searchArea = await listOperational(apiUrl, anonKey, fieldToken, {
      p_search: AREA_NAME,
    });
    const areaItems = itemsOf(searchArea);
    record(
      "D1-SEARCH-AREA",
      searchArea.ok &&
        Boolean(findById(areaItems, FIXTURE.withArea)) &&
        !findById(areaItems, FIXTURE.noContractor),
      `p_search área: ${areaItems.length} itens, fixture área=${Boolean(findById(areaItems, FIXTURE.withArea))}`,
    );

    const searchContractor = await listOperational(apiUrl, anonKey, fieldToken, {
      p_search: CONTRACTOR_NAME,
    });
    const contractorItems = itemsOf(searchContractor);
    record(
      "D1-SEARCH-CONTRACTOR",
      searchContractor.ok &&
        Boolean(findById(contractorItems, FIXTURE.withArea)) &&
        Boolean(findById(contractorItems, FIXTURE.withIms)) &&
        !findById(contractorItems, FIXTURE.noContractor),
      `p_search contratada: com=${Boolean(findById(contractorItems, FIXTURE.withArea))} sem=${Boolean(findById(contractorItems, FIXTURE.noContractor))}`,
    );

    const searchActivity = await listOperational(apiUrl, anonKey, fieldToken, {
      p_search: `OP-OC-ACT-${suffix}`,
    });
    const activityItems = itemsOf(searchActivity);
    record(
      "D1-SEARCH-ACTIVITY",
      searchActivity.ok &&
        activityItems.length === 1 &&
        activityItems[0]?.id === FIXTURE.withArea,
      `p_search atividade: ${activityItems.length} itens (esperado 1)`,
    );

    const searchCode = await listOperational(apiUrl, anonKey, fieldToken, {
      p_search: `${CODE_PREFIX}-1`,
    });
    const codeItems = itemsOf(searchCode);
    record(
      "D1-SEARCH-CODE",
      searchCode.ok && codeItems.length === 1 && codeItems[0]?.id === FIXTURE.withArea,
      `p_search public_code: ${codeItems.map((item) => item.publicCode).join(",")}`,
    );

    const filterArea = await listOperational(apiUrl, anonKey, fieldToken, {
      p_area_id: FIXTURE.area,
    });
    const filterAreaItems = itemsOf(filterArea);
    record(
      "D1-FILTER-AREA",
      filterArea.ok &&
        filterAreaItems.length === 1 &&
        filterAreaItems[0]?.id === FIXTURE.withArea,
      `p_area_id: ${filterAreaItems.length} itens (esperado 1)`,
    );

    const filterContractor = await listOperational(apiUrl, anonKey, fieldToken, {
      p_search: CODE_PREFIX,
      p_contractor_organization_id: QA_BETA_CONTRACTOR_ORG,
    });
    const filterContractorItems = itemsOf(filterContractor);
    record(
      "D1-FILTER-CONTRACTOR",
      filterContractor.ok &&
        filterContractorItems.length === 2 &&
        Boolean(findById(filterContractorItems, FIXTURE.withArea)) &&
        Boolean(findById(filterContractorItems, FIXTURE.withIms)) &&
        !findById(filterContractorItems, FIXTURE.noContractor),
      `p_contractor_organization_id: ${filterContractorItems.length} itens (esperado 2)`,
    );

    const filterStatus = await listOperational(apiUrl, anonKey, fieldToken, {
      p_search: CODE_PREFIX,
      p_status: ["EM_AVALIACAO"],
    });
    const statusItems = itemsOf(filterStatus);
    record(
      "D1-FILTER-STATUS",
      filterStatus.ok &&
        statusItems.length === 1 &&
        statusItems[0]?.id === FIXTURE.noContractor &&
        statusItems[0]?.status === "EM_AVALIACAO",
      `p_status EM_AVALIACAO: ${statusItems.length} itens status=${statusItems[0]?.status}`,
    );

    const filterSeverity = await listOperational(apiUrl, anonKey, fieldToken, {
      p_search: CODE_PREFIX,
      p_severity: ["CRITICAL"],
    });
    const severityItems = itemsOf(filterSeverity);
    record(
      "D1-FILTER-SEVERITY",
      filterSeverity.ok &&
        severityItems.length === 1 &&
        severityItems[0]?.id === FIXTURE.withIms &&
        severityItems[0]?.severity === "CRITICAL",
      `p_severity CRITICAL: ${severityItems.length} itens severity=${severityItems[0]?.severity}`,
    );

    const filterIms = await listOperational(apiUrl, anonKey, fieldToken, {
      p_ims_reference_code: `IMS-${suffix}`,
    });
    const imsItems = itemsOf(filterIms);
    record(
      "D1-IMS",
      filterIms.ok && imsItems.length === 1 && imsItems[0]?.id === FIXTURE.withIms,
      `p_ims_reference_code contains: ${imsItems.length} itens (esperado 1)`,
    );

    const empty = await listOperational(apiUrl, anonKey, fieldToken, {
      p_search: `ZZZ-OP-OC-NO-MATCH-${suffix}`,
    });
    record(
      "D1-EMPTY",
      empty.ok && Array.isArray(empty.data?.items) && empty.data.items.length === 0 && empty.data.hasNext === false,
      `busca sem match: HTTP ${empty.status} items=${empty.data?.items?.length} hasNext=${empty.data?.hasNext}`,
    );

    const page1 = await listOperational(apiUrl, anonKey, fieldToken, {
      p_search: CODE_PREFIX,
      p_limit: 1,
    });
    const page1Items = itemsOf(page1);
    const page1Id = page1Items[0]?.id;
    const page2 = await listOperational(apiUrl, anonKey, fieldToken, {
      p_search: CODE_PREFIX,
      p_limit: 1,
      p_cursor: page1.data?.nextCursor ?? null,
    });
    const page2Items = itemsOf(page2);
    const page2Id = page2Items[0]?.id;
    record(
      "D1-PAGE",
      page1.ok &&
        page2.ok &&
        page1.data?.hasNext === true &&
        page1Items.length === 1 &&
        page2Items.length === 1 &&
        Boolean(page1.data?.nextCursor?.sortValue) &&
        Boolean(page1.data?.nextCursor?.id) &&
        page2Id !== page1Id &&
        Boolean(page1Id) &&
        Boolean(page2Id),
      `limit=1 hasNext=${page1.data?.hasNext} page1=${page1Id} page2=${page2Id} nextCursor=${JSON.stringify(page1.data?.nextCursor)}`,
    );

    const fieldReport = await rpc(apiUrl, anonKey, fieldToken, "list_occurrences_report", {
      p_organization_id: QA_ALPHA_ORG,
      p_limit: 10,
    });
    const gestorReport = await rpc(apiUrl, anonKey, gestorToken, "list_occurrences_report", {
      p_organization_id: QA_ALPHA_ORG,
      p_search: CODE_PREFIX,
      p_limit: 10,
    });
    record(
      "D1-REPORT-UNCHANGED",
      fieldReport.status === 403 &&
        fieldReport.data?.message === "PERMISSION_DENIED" &&
        gestorReport.ok &&
        Array.isArray(gestorReport.data?.items),
      `field report HTTP ${fieldReport.status} ${fieldReport.data?.message}; gestor report HTTP ${gestorReport.status} items=${gestorReport.data?.items?.length}`,
    );
  } finally {
    cleanupFixture();
    console.log("Cleanup: fixture OP-OC removido.");
  }

  const failed = results.filter((entry) => !entry.ok);
  console.log("");
  console.log(
    `=== smoke-list-operational-occurrences: ${results.length - failed.length}/${results.length} PASS ===`,
  );
  if (failed.length > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  try {
    cleanupFixture();
  } catch {
    // ignore
  }
  process.exit(1);
});
