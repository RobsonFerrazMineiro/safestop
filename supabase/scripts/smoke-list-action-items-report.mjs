/**
 * Smoke test — list_action_items_report (Sprint 3.3)
 *
 * Referência: docs/decisions/REPORTS-DECISIONS.md (handoff DATABASE item 2)
 * Valida vencida/próxima do vencimento batendo com a MESMA fórmula de
 * packages/types/src/dashboard-formulas.ts (isOverdueActionItem/isDueSoonActionItem).
 *
 * Uso: node supabase/scripts/smoke-list-action-items-report.mjs
 * Pré-requisito: Supabase local + seed aplicado (pnpm supabase:db:reset)
 */
import { loadSupabaseLocalEnv, runLocalSql } from "./_local-env.mjs";

const PASSWORD = "SafeStop-QA-Local-2026";

const QA_ALPHA_ORG = "b0000000-0000-4000-8000-000000000001";
const QA_BETA_ORG = "b0000000-0000-4000-8000-000000000002";
const QA_ALPHA_AREA = "f0000000-0000-4000-8000-000000000001";
const QA_FIELD_PROFILE = "a0000000-0000-4000-8000-000000000001";
const QA_GESTOR_MEMBER = "c0000000-0000-4000-8000-000000000008";

const USERS = {
  gestor: "qa-gestor@safestop.local",
  field: "qa-field@safestop.local",
};

const suffix = Date.now().toString().slice(-6);

function fixtureId(index) {
  return `f3310000-0000-4000-8000-${suffix.padStart(11, "0")}${index}`;
}

const FIXTURE = {
  occurrence: fixtureId(1),
  actionPlan: fixtureId(2),
  itemOverdue: fixtureId(3),
  itemDueSoon: fixtureId(4),
  itemFuture: fixtureId(5),
  itemCompleted: fixtureId(6),
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
      id, organization_id, area_id, public_code, title,
      task_description, condition_description, location_description,
      severity, status, created_by, occurred_at
    ) values (
      '${FIXTURE.occurrence}', '${QA_ALPHA_ORG}', '${QA_ALPHA_AREA}', 'REP-AI-${suffix}', 'REP-AI fixture',
      'QA', 'QA', 'QA', 'HIGH', 'EM_TRATATIVA', '${QA_FIELD_PROFILE}', now() - interval '5 days'
    );
  `);

  runLocalSql(`
    insert into public.action_plans (
      id, organization_id, occurrence_id, status, created_by, summary
    ) values (
      '${FIXTURE.actionPlan}', '${QA_ALPHA_ORG}', '${FIXTURE.occurrence}', 'IN_PROGRESS',
      '${QA_FIELD_PROFILE}', 'REP-AI plano'
    );
  `);

  runLocalSql(`
    insert into public.action_items (
      id, organization_id, action_plan_id, title, due_at, status, priority,
      responsible_member_id, responsible_organization_id, completed_at
    ) values
      ('${FIXTURE.itemOverdue}', '${QA_ALPHA_ORG}', '${FIXTURE.actionPlan}',
        'REP-AI overdue', now() - interval '2 days', 'PENDING', 'HIGH',
        '${QA_GESTOR_MEMBER}', '${QA_ALPHA_ORG}', null),
      ('${FIXTURE.itemDueSoon}', '${QA_ALPHA_ORG}', '${FIXTURE.actionPlan}',
        'REP-AI due soon', now() + interval '2 days', 'IN_PROGRESS', 'MEDIUM',
        '${QA_GESTOR_MEMBER}', '${QA_ALPHA_ORG}', null),
      ('${FIXTURE.itemFuture}', '${QA_ALPHA_ORG}', '${FIXTURE.actionPlan}',
        'REP-AI future', now() + interval '10 days', 'PENDING', 'LOW',
        '${QA_GESTOR_MEMBER}', '${QA_ALPHA_ORG}', null),
      ('${FIXTURE.itemCompleted}', '${QA_ALPHA_ORG}', '${FIXTURE.actionPlan}',
        'REP-AI completed', now() - interval '1 days', 'COMPLETED', 'LOW',
        '${QA_GESTOR_MEMBER}', '${QA_ALPHA_ORG}', now());
  `);
}

function cleanupFixture() {
  try {
    runLocalSql(`
      delete from public.action_items
      where id in ('${FIXTURE.itemOverdue}', '${FIXTURE.itemDueSoon}', '${FIXTURE.itemFuture}', '${FIXTURE.itemCompleted}');
    `);
  } catch {
    // fixture ausente
  }
  try {
    runLocalSql(`delete from public.action_plans where id = '${FIXTURE.actionPlan}';`);
  } catch {
    // fixture ausente
  }
  try {
    runLocalSql(`delete from public.occurrences where id = '${FIXTURE.occurrence}';`);
  } catch {
    // fixture ausente
  }
}

function findItem(items, title) {
  return items.find((item) => item.title === title);
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
    const all = await rpc(apiUrl, anonKey, gestorToken, "list_action_items_report", {
      p_organization_id: QA_ALPHA_ORG,
      p_limit: 100,
    });

    const fixtureTitles = ["REP-AI overdue", "REP-AI due soon", "REP-AI future", "REP-AI completed"];
    const fixtureItems = (all.data?.items ?? []).filter((item) => fixtureTitles.includes(item.title));

    record(
      "REP-AI-01",
      all.ok && fixtureItems.length === 4,
      `dataset determinístico retornou ${fixtureItems.length} itens (esperado 4)`,
    );

    record(
      "REP-AI-02",
      findItem(fixtureItems, "REP-AI overdue")?.occurrenceId === FIXTURE.occurrence,
      "occurrenceId presente para drill-down",
    );

    // REP-AI-03/04: isOverdue/isDueSoon batem com dashboard-formulas.ts
    // (isOverdueActionItem: aberta + due_at < now(); isDueSoonActionItem:
    // aberta + due_at entre now() e now()+3 dias).
    const overdue = findItem(fixtureItems, "REP-AI overdue");
    const dueSoon = findItem(fixtureItems, "REP-AI due soon");
    const future = findItem(fixtureItems, "REP-AI future");
    const completed = findItem(fixtureItems, "REP-AI completed");

    record(
      "REP-AI-03",
      overdue?.isOverdue === true && overdue?.isDueSoon === false,
      `overdue: isOverdue=${overdue?.isOverdue} isDueSoon=${overdue?.isDueSoon}`,
    );
    record(
      "REP-AI-04",
      dueSoon?.isOverdue === false && dueSoon?.isDueSoon === true,
      `dueSoon: isOverdue=${dueSoon?.isOverdue} isDueSoon=${dueSoon?.isDueSoon}`,
    );
    record(
      "REP-AI-05",
      future?.isOverdue === false && future?.isDueSoon === false,
      `future: isOverdue=${future?.isOverdue} isDueSoon=${future?.isDueSoon}`,
    );
    record(
      "REP-AI-06",
      completed?.isOverdue === false && completed?.isDueSoon === false,
      `completed (due_at passado, mas status fechado): isOverdue=${completed?.isOverdue} isDueSoon=${completed?.isDueSoon}`,
    );

    // REP-AI-07: responsibleMemberName resolvido (achado técnico profiles/RLS).
    record(
      "REP-AI-07",
      typeof overdue?.responsibleMemberName === "string" && overdue.responsibleMemberName.length > 0,
      `responsibleMemberName="${overdue?.responsibleMemberName}"`,
    );

    // REP-AI-08: filtro p_overdue_only retorna exatamente 1 item.
    const overdueOnly = await rpc(apiUrl, anonKey, gestorToken, "list_action_items_report", {
      p_organization_id: QA_ALPHA_ORG,
      p_responsible_member_id: QA_GESTOR_MEMBER,
      p_overdue_only: true,
      p_limit: 100,
    });
    const overdueOnlyFixture = (overdueOnly.data?.items ?? []).filter((item) =>
      fixtureTitles.includes(item.title),
    );
    record(
      "REP-AI-08",
      overdueOnly.ok && overdueOnlyFixture.length === 1 && overdueOnlyFixture[0].title === "REP-AI overdue",
      `p_overdue_only retornou ${overdueOnlyFixture.length} itens do fixture (esperado 1)`,
    );

    // REP-AI-09: filtro p_due_soon_only retorna exatamente 1 item.
    const dueSoonOnly = await rpc(apiUrl, anonKey, gestorToken, "list_action_items_report", {
      p_organization_id: QA_ALPHA_ORG,
      p_responsible_member_id: QA_GESTOR_MEMBER,
      p_due_soon_only: true,
      p_limit: 100,
    });
    const dueSoonOnlyFixture = (dueSoonOnly.data?.items ?? []).filter((item) =>
      fixtureTitles.includes(item.title),
    );
    record(
      "REP-AI-09",
      dueSoonOnly.ok && dueSoonOnlyFixture.length === 1 && dueSoonOnlyFixture[0].title === "REP-AI due soon",
      `p_due_soon_only retornou ${dueSoonOnlyFixture.length} itens do fixture (esperado 1)`,
    );

    // REP-AI-10: cross-tenant — qa-field (sem vínculo em Beta) tenta consultar Beta.
    const crossTenant = await rpc(apiUrl, anonKey, fieldToken, "list_action_items_report", {
      p_organization_id: QA_BETA_ORG,
      p_limit: 10,
    });
    record(
      "REP-AI-10",
      crossTenant.status === 403 || crossTenant.status === 400,
      `cross-tenant field→Beta HTTP ${crossTenant.status} (esperado 403/400)`,
    );

    // REP-AI-11 (Gate G / SEC-REP-M01): qa-field tem occurrence.read na própria
    // Alpha (mesma org do gestor), mas NÃO tem report.read — deve ser negado
    // pela RPC mesmo estando no escopo correto de organização, nunca apenas
    // pela tela de WEB.
    const noReportPermission = await rpc(apiUrl, anonKey, fieldToken, "list_action_items_report", {
      p_organization_id: QA_ALPHA_ORG,
      p_limit: 10,
    });
    record(
      "REP-AI-11",
      noReportPermission.status === 403 && noReportPermission.data?.message === "PERMISSION_DENIED",
      `field (occurrence.read, sem report.read) na própria org → HTTP ${noReportPermission.status} ${noReportPermission.data?.message} (esperado 403 PERMISSION_DENIED)`,
    );
  } finally {
    cleanupFixture();
    console.log("Cleanup: fixture REP-AI removido.");
  }

  const failed = results.filter((entry) => !entry.ok);
  console.log("");
  console.log(`=== smoke-list-action-items-report: ${results.length - failed.length}/${results.length} PASS ===`);
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
