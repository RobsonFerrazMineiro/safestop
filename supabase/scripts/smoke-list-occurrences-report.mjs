/**
 * Smoke test — list_occurrences_report (Sprint 3.3, PO-REP-3)
 *
 * Referência: docs/decisions/REPORTS-DECISIONS.md
 * Dataset determinístico (prefixo REP-OC), inserido/limpo via runLocalSql
 * (mesmo padrão de supabase/scripts/qa-dashboard-3.2.mjs).
 *
 * Uso: node supabase/scripts/smoke-list-occurrences-report.mjs
 * Pré-requisito: Supabase local + seed aplicado (pnpm supabase:db:reset)
 */
import { loadSupabaseLocalEnv, runLocalSql } from "./_local-env.mjs";

const PASSWORD = "SafeStop-QA-Local-2026";

const QA_ALPHA_ORG = "b0000000-0000-4000-8000-000000000001";
const QA_BETA_ORG = "b0000000-0000-4000-8000-000000000002";
const QA_ALPHA_AREA = "f0000000-0000-4000-8000-000000000001";
const QA_ALPHA_BETA_CONTRACT = "01000000-0000-4000-8000-000000000001";
const QA_BETA_CONTRACTOR_ORG = "b0000000-0000-4000-8000-000000000002";
const QA_FIELD_PROFILE = "a0000000-0000-4000-8000-000000000001";
const QA_SUPERVISOR_PROFILE = "a0000000-0000-4000-8000-000000000009";

const USERS = {
  gestor: "qa-gestor@safestop.local",
  field: "qa-field@safestop.local",
};

const suffix = Date.now().toString().slice(-6);
const CODE_PREFIX = `REP-OC-${suffix}`;

function fixtureId(index) {
  return `f3300000-0000-4000-8000-${suffix.padStart(11, "0")}${index}`;
}

const FIXTURE = {
  ppOpen: fixtureId(1),
  emAvaliacao: fixtureId(2),
  io: fixtureId(3),
  cancelada: fixtureId(4),
  encerrada: fixtureId(5),
};

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
  const response = await fetch(`${apiUrl}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => null);
  return { ok: response.ok, status: response.status, data };
}

function insertFixture() {
  runLocalSql(`
    insert into public.occurrences (
      id, organization_id, area_id, contract_id, contractor_organization_id,
      public_code, title, task_description, condition_description, location_description,
      severity, status, decision_type, ims_reference_code,
      created_by, assigned_evaluator_id,
      occurred_at, cancellation_reason
    ) values
      ('${FIXTURE.ppOpen}', '${QA_ALPHA_ORG}', '${QA_ALPHA_AREA}', '${QA_ALPHA_BETA_CONTRACT}', '${QA_BETA_CONTRACTOR_ORG}',
        '${CODE_PREFIX}-1', 'REP-OC pp aberta', 'QA', 'QA', 'QA',
        'MEDIUM', 'PARALISACAO_PREVENTIVA', null, null,
        '${QA_FIELD_PROFILE}', null,
        now() - interval '4 days', null),
      ('${FIXTURE.emAvaliacao}', '${QA_ALPHA_ORG}', '${QA_ALPHA_AREA}', null, null,
        '${CODE_PREFIX}-2', 'REP-OC em avaliação', 'QA', 'QA', 'QA',
        'HIGH', 'EM_AVALIACAO', null, null,
        '${QA_FIELD_PROFILE}', '${QA_SUPERVISOR_PROFILE}',
        now() - interval '3 days', null),
      ('${FIXTURE.io}', '${QA_ALPHA_ORG}', '${QA_ALPHA_AREA}', '${QA_ALPHA_BETA_CONTRACT}', '${QA_BETA_CONTRACTOR_ORG}',
        '${CODE_PREFIX}-3', 'REP-OC interditada', 'QA', 'QA', 'QA',
        'CRITICAL', 'INTERDICAO_CONFIRMADA', 'INTERDICAO_OFICIAL', 'IMS-${suffix}',
        '${QA_FIELD_PROFILE}', '${QA_SUPERVISOR_PROFILE}',
        now() - interval '2 days', null),
      ('${FIXTURE.cancelada}', '${QA_ALPHA_ORG}', '${QA_ALPHA_AREA}', null, null,
        '${CODE_PREFIX}-4', 'REP-OC cancelada', 'QA', 'QA', 'QA',
        'LOW', 'CANCELADA', null, null,
        '${QA_FIELD_PROFILE}', null,
        now() - interval '1 days', 'Falso alarme'),
      ('${FIXTURE.encerrada}', '${QA_ALPHA_ORG}', '${QA_ALPHA_AREA}', '${QA_ALPHA_BETA_CONTRACT}', '${QA_BETA_CONTRACTOR_ORG}',
        '${CODE_PREFIX}-5', 'REP-OC encerrada', 'QA', 'QA', 'QA',
        'LOW', 'ENCERRADA', null, null,
        '${QA_FIELD_PROFILE}', null,
        now(), null);
  `);
}

function cleanupFixture() {
  try {
    runLocalSql(`
      delete from public.occurrences
      where id in (
        '${FIXTURE.ppOpen}', '${FIXTURE.emAvaliacao}', '${FIXTURE.io}',
        '${FIXTURE.cancelada}', '${FIXTURE.encerrada}'
      );
    `);
  } catch {
    // fixture ausente
  }
}

function findItem(items, code) {
  return items.find((item) => item.publicCode === code);
}

async function main() {
  const { apiUrl, anonKey } = loadSupabaseLocalEnv();

  const gestorSession = await signIn(apiUrl, anonKey, USERS.gestor);
  const fieldSession = await signIn(apiUrl, anonKey, USERS.field);
  const gestorToken = gestorSession.access_token;
  const fieldToken = fieldSession.access_token;

  cleanupFixture();
  insertFixture();

  try {
    // REP-OC-01: busca por public_code retorna exatamente os 5 itens do fixture.
    const all = await rpc(apiUrl, anonKey, gestorToken, "list_occurrences_report", {
      p_organization_id: QA_ALPHA_ORG,
      p_search: CODE_PREFIX,
      p_limit: 100,
    });
    record(
      "REP-OC-01",
      all.ok && all.data.items.length === 5,
      `busca por prefixo retornou ${all.data?.items?.length ?? "erro"} itens (esperado 5)`,
    );

    // REP-OC-02: nenhuma coluna de action_items/participants/notifications —
    // apenas os campos esperados da matriz de colunas.
    const sample = all.data?.items?.[0] ?? {};
    const forbiddenKeys = ["actionItems", "participants", "notifications"];
    const hasForbidden = forbiddenKeys.some((key) => key in sample);
    record(
      "REP-OC-02",
      !hasForbidden,
      `item não contém colunas 1:N (action_items/participants/notifications)`,
    );

    // REP-OC-03: createdByName / assignedEvaluatorName resolvidos mesmo sob
    // RLS de profiles (achado técnico — resolve_profile_display_name).
    const io = findItem(all.data.items, `${CODE_PREFIX}-3`);
    record(
      "REP-OC-03",
      io?.createdByName && io?.assignedEvaluatorName,
      `createdByName="${io?.createdByName}" assignedEvaluatorName="${io?.assignedEvaluatorName}"`,
    );

    // REP-OC-04: contractorOrganizationName resolvido cross-tenant (gestor
    // Alpha não é membro de Beta — achado técnico resolve_organization_display_name).
    record(
      "REP-OC-04",
      io?.contractorOrganizationName === "QA Beta Contratada",
      `contractorOrganizationName="${io?.contractorOrganizationName}"`,
    );

    // REP-OC-05: statusFamily bate com DASHBOARD_OCCURRENCE_STATUS_FAMILIES.
    const familyByCode = {
      [`${CODE_PREFIX}-1`]: "OPEN_EVALUATION",
      [`${CODE_PREFIX}-2`]: "OPEN_EVALUATION",
      [`${CODE_PREFIX}-3`]: "INTERDICTED",
      [`${CODE_PREFIX}-4`]: "CANCELLED",
      [`${CODE_PREFIX}-5`]: "COMPLETED",
    };
    const familyOk = Object.entries(familyByCode).every(
      ([code, family]) => findItem(all.data.items, code)?.statusFamily === family,
    );
    record("REP-OC-05", familyOk, "statusFamily de todos os itens bate com dashboard-formulas.ts");

    // REP-OC-06: filtro p_contract_id retorna apenas os 3 itens com contrato Alpha→Beta.
    const byContract = await rpc(apiUrl, anonKey, gestorToken, "list_occurrences_report", {
      p_organization_id: QA_ALPHA_ORG,
      p_search: CODE_PREFIX,
      p_contract_id: QA_ALPHA_BETA_CONTRACT,
      p_limit: 100,
    });
    record(
      "REP-OC-06",
      byContract.ok && byContract.data.items.length === 3,
      `filtro contract_id retornou ${byContract.data?.items?.length} (esperado 3)`,
    );

    // REP-OC-07: filtro p_has_ims=true retorna apenas a ocorrência com IMS.
    const byIms = await rpc(apiUrl, anonKey, gestorToken, "list_occurrences_report", {
      p_organization_id: QA_ALPHA_ORG,
      p_search: CODE_PREFIX,
      p_has_ims: true,
      p_limit: 100,
    });
    record(
      "REP-OC-07",
      byIms.ok && byIms.data.items.length === 1 && byIms.data.items[0].publicCode === `${CODE_PREFIX}-3`,
      `filtro has_ims=true retornou ${byIms.data?.items?.length} (esperado 1)`,
    );

    // REP-OC-08: filtro p_severity retorna HIGH + CRITICAL (2 itens).
    const bySeverity = await rpc(apiUrl, anonKey, gestorToken, "list_occurrences_report", {
      p_organization_id: QA_ALPHA_ORG,
      p_search: CODE_PREFIX,
      p_severity: ["HIGH", "CRITICAL"],
      p_limit: 100,
    });
    record(
      "REP-OC-08",
      bySeverity.ok && bySeverity.data.items.length === 2,
      `filtro severity retornou ${bySeverity.data?.items?.length} (esperado 2)`,
    );

    // REP-OC-09 a REP-OC-11: paginação cursor com p_limit=2 (5 itens → páginas 2/2/1).
    let cursor = null;
    let pageCount = 0;
    let totalPaged = 0;
    const seenIds = new Set();
    let paginationOk = true;

    while (pageCount < 5) {
      const page = await rpc(apiUrl, anonKey, gestorToken, "list_occurrences_report", {
        p_organization_id: QA_ALPHA_ORG,
        p_search: CODE_PREFIX,
        p_limit: 2,
        p_cursor: cursor,
      });

      if (!page.ok) {
        paginationOk = false;
        break;
      }

      for (const item of page.data.items) {
        if (seenIds.has(item.id)) {
          paginationOk = false;
        }
        seenIds.add(item.id);
      }

      totalPaged += page.data.items.length;
      pageCount += 1;

      if (!page.data.hasNext) {
        break;
      }
      cursor = page.data.nextCursor;
    }

    record(
      "REP-OC-09",
      paginationOk && totalPaged === 5 && pageCount === 3,
      `paginação limit=2: ${pageCount} páginas, ${totalPaged} itens únicos (esperado 3 páginas, 5 itens)`,
    );

    // REP-OC-10: cross-tenant — qa-field (sem vínculo em Beta) tenta consultar Beta.
    const crossTenant = await rpc(apiUrl, anonKey, fieldToken, "list_occurrences_report", {
      p_organization_id: QA_BETA_ORG,
      p_limit: 10,
    });
    record(
      "REP-OC-10",
      crossTenant.status === 403 || crossTenant.status === 400,
      `cross-tenant field→Beta HTTP ${crossTenant.status} (esperado 403/400)`,
    );

    // REP-OC-11: sort_field inválido é rejeitado (allowlist).
    const invalidSort = await rpc(apiUrl, anonKey, gestorToken, "list_occurrences_report", {
      p_organization_id: QA_ALPHA_ORG,
      p_sort_field: "created_by; drop table occurrences;",
      p_limit: 10,
    });
    record(
      "REP-OC-11",
      !invalidSort.ok,
      `sort_field inválido rejeitado (HTTP ${invalidSort.status})`,
    );

    // REP-OC-12 (Gate G / SEC-REP-M01): qa-field tem occurrence.read na própria
    // Alpha (mesma org do gestor), mas NÃO tem report.read — deve ser negado
    // pela RPC mesmo estando no escopo correto de organização, nunca apenas
    // pela tela de WEB.
    const noReportPermission = await rpc(apiUrl, anonKey, fieldToken, "list_occurrences_report", {
      p_organization_id: QA_ALPHA_ORG,
      p_limit: 10,
    });
    record(
      "REP-OC-12",
      noReportPermission.status === 403 && noReportPermission.data?.message === "PERMISSION_DENIED",
      `field (occurrence.read, sem report.read) na própria org → HTTP ${noReportPermission.status} ${noReportPermission.data?.message} (esperado 403 PERMISSION_DENIED)`,
    );
  } finally {
    cleanupFixture();
    console.log("Cleanup: fixture REP-OC removido.");
  }

  const failed = results.filter((entry) => !entry.ok);
  console.log("");
  console.log(`=== smoke-list-occurrences-report: ${results.length - failed.length}/${results.length} PASS ===`);
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
