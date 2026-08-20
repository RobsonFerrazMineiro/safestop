/**
 * QA Dashboard Sprint 3.2 — DASH-32-*
 *
 * Dataset canônico: docs/decisions/DASHBOARD-DECISIONS.md (§ dataset canônico)
 * RPC principal: get_dashboard_kpis
 * Drill-down ações: client-side (sem RPC get_dashboard_action_items_attention) — DASH-32-10/11
 *
 * Uso: node supabase/scripts/qa-dashboard-3.2.mjs
 * Pré-requisito: Supabase local + seed aplicado (pnpm supabase:db:reset)
 */
import { loadSupabaseLocalEnv, runLocalSql } from "./_local-env.mjs";

const PASSWORD = "SafeStop-QA-Local-2026";

const QA_ALPHA_ORG = "b0000000-0000-4000-8000-000000000001";
const QA_GAMMA_ORG = "b0000000-0000-4000-8000-000000000003";
const QA_ALPHA_AREA = "f0000000-0000-4000-8000-000000000001";
const QA_BETA_CONTRACTOR = "b0000000-0000-4000-8000-000000000002";
const QA_FIELD_PROFILE = "a0000000-0000-4000-8000-000000000001";
const QA_GESTOR_MEMBER = "c0000000-0000-4000-8000-000000000008";

const USERS = {
  gestor: "qa-gestor@safestop.local",
  field: "qa-field@safestop.local",
  noperm: "qa-noperm@safestop.local",
};

/** IDs determinísticos do dataset canônico (prefixo QA-DASH-32). */
const FIXTURE = {
  occPp1: "da320000-0000-4000-8000-000000000001",
  occPp2: "da320000-0000-4000-8000-000000000002",
  occIo: "da320000-0000-4000-8000-000000000003",
  occLiberada: "da320000-0000-4000-8000-000000000004",
  occEncerrada: "da320000-0000-4000-8000-000000000005",
  actionPlan: "da320000-0000-4000-8000-000000000010",
  itemOverdue: "da320000-0000-4000-8000-000000000011",
  itemDueSoon: "da320000-0000-4000-8000-000000000012",
  itemFuture: "da320000-0000-4000-8000-000000000013",
};

const CLOSED_ITEM_STATUSES = ["COMPLETED", "CANCELLED"];

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

  if (!response.ok) {
    throw new Error(`Login ${email} falhou (${response.status}): ${await response.text()}`);
  }

  return response.json();
}

async function rpcDashboardKpis(apiUrl, anonKey, token, organizationId, extra = {}) {
  const response = await fetch(`${apiUrl}/rest/v1/rpc/get_dashboard_kpis`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      p_organization_id: organizationId,
      p_due_soon_days: 3,
      p_period_start: null,
      p_period_end: null,
      ...extra,
    }),
  });

  const data = await response.json();

  return { ok: response.ok, status: response.status, data };
}

async function rpcMissingFunction(apiUrl, anonKey, token, functionName) {
  const response = await fetch(`${apiUrl}/rest/v1/rpc/${functionName}`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      p_organization_id: QA_ALPHA_ORG,
    }),
  });

  const data = await response.json().catch(() => null);

  return { status: response.status, data };
}

function readManagerial(kpis) {
  return kpis?.managerial ?? {};
}

function readOperational(kpis) {
  return kpis?.operational ?? {};
}

function readPersonal(kpis) {
  return kpis?.personal ?? {};
}

function delta(after, before) {
  if (after === null || before === null) {
    return null;
  }

  return after - before;
}

function readStatusFamily(kpis) {
  return readManagerial(kpis).occurrencesByStatusFamily ?? {};
}

function familyDelta(afterKpis, beforeKpis, family) {
  const after = readStatusFamily(afterKpis)[family] ?? 0;
  const before = readStatusFamily(beforeKpis)[family] ?? 0;
  return after - before;
}

function insertCanonicalDataset() {
  const suffix = Date.now().toString().slice(-4);

  runLocalSql(`
    insert into public.occurrences (
      id, organization_id, area_id, contractor_organization_id, created_by,
      public_code, title, status, severity,
      task_description, condition_description, location_description,
      occurred_at, stopped_at
    ) values
      ('${FIXTURE.occPp1}', '${QA_ALPHA_ORG}', '${QA_ALPHA_AREA}', '${QA_BETA_CONTRACTOR}', '${QA_FIELD_PROFILE}',
        'QD-01-${suffix}', 'QA-DASH-32 pp-1', 'PARALISACAO_PREVENTIVA', 'MEDIUM',
        'QA', 'QA', 'QA', now(), now()),
      ('${FIXTURE.occPp2}', '${QA_ALPHA_ORG}', '${QA_ALPHA_AREA}', '${QA_BETA_CONTRACTOR}', '${QA_FIELD_PROFILE}',
        'QD-02-${suffix}', 'QA-DASH-32 pp-2', 'PARALISACAO_PREVENTIVA', 'MEDIUM',
        'QA', 'QA', 'QA', now(), now()),
      ('${FIXTURE.occIo}', '${QA_ALPHA_ORG}', '${QA_ALPHA_AREA}', '${QA_BETA_CONTRACTOR}', '${QA_FIELD_PROFILE}',
        'QD-03-${suffix}', 'QA-DASH-32 io', 'INTERDICAO_CONFIRMADA', 'HIGH',
        'QA', 'QA', 'QA', now(), now()),
      ('${FIXTURE.occLiberada}', '${QA_ALPHA_ORG}', '${QA_ALPHA_AREA}', '${QA_BETA_CONTRACTOR}', '${QA_FIELD_PROFILE}',
        'QD-04-${suffix}', 'QA-DASH-32 liberada', 'LIBERADA', 'LOW',
        'QA', 'QA', 'QA', now(), now()),
      ('${FIXTURE.occEncerrada}', '${QA_ALPHA_ORG}', '${QA_ALPHA_AREA}', '${QA_BETA_CONTRACTOR}', '${QA_FIELD_PROFILE}',
        'QD-05-${suffix}', 'QA-DASH-32 encerrada', 'ENCERRADA', 'LOW',
        'QA', 'QA', 'QA', now(), now());
  `);

  runLocalSql(`
    insert into public.action_plans (
      id, organization_id, occurrence_id, status, created_by, summary
    ) values (
      '${FIXTURE.actionPlan}', '${QA_ALPHA_ORG}', '${FIXTURE.occIo}', 'OPEN',
      '${QA_FIELD_PROFILE}', 'QA-DASH-32 plano'
    );
  `);

  runLocalSql(`
    insert into public.action_items (
      id, organization_id, action_plan_id, title, due_at, status, priority,
      responsible_member_id, responsible_organization_id
    ) values
      ('${FIXTURE.itemOverdue}', '${QA_ALPHA_ORG}', '${FIXTURE.actionPlan}',
        'QA overdue', now() - interval '2 days', 'PENDING', 'HIGH',
        '${QA_GESTOR_MEMBER}', '${QA_ALPHA_ORG}'),
      ('${FIXTURE.itemDueSoon}', '${QA_ALPHA_ORG}', '${FIXTURE.actionPlan}',
        'QA due soon', now() + interval '2 days', 'IN_PROGRESS', 'MEDIUM',
        '${QA_GESTOR_MEMBER}', '${QA_ALPHA_ORG}'),
      ('${FIXTURE.itemFuture}', '${QA_ALPHA_ORG}', '${FIXTURE.actionPlan}',
        'QA future', now() + interval '10 days', 'PENDING', 'LOW',
        '${QA_GESTOR_MEMBER}', '${QA_ALPHA_ORG}');
  `);
}

function cleanupFixture() {
  try {
    runLocalSql(`
      delete from public.action_items
      where id in (
        '${FIXTURE.itemOverdue}',
        '${FIXTURE.itemDueSoon}',
        '${FIXTURE.itemFuture}'
      );
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
    runLocalSql(`
      delete from public.occurrences
      where id in (
        '${FIXTURE.occPp1}',
        '${FIXTURE.occPp2}',
        '${FIXTURE.occIo}',
        '${FIXTURE.occLiberada}',
        '${FIXTURE.occEncerrada}'
      );
    `);
  } catch {
    // fixture ausente
  }
}

async function fetchOpenActionItems(apiUrl, anonKey, token) {
  const params = new URLSearchParams({
    select: "id,status,due_at",
    organization_id: `eq.${QA_ALPHA_ORG}`,
    status: `not.in.(${CLOSED_ITEM_STATUSES.join(",")})`,
  });

  const response = await fetch(`${apiUrl}/rest/v1/action_items?${params}`, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`action_items query falhou (${response.status})`);
  }

  return response.json();
}

function classifyAttentionItems(rows, dueSoonDays = 3) {
  const now = Date.now();
  const thresholdMs = dueSoonDays * 86400000;
  let overdue = 0;
  let dueSoon = 0;

  for (const row of rows) {
    if (CLOSED_ITEM_STATUSES.includes(row.status)) {
      continue;
    }

    const dueMs = new Date(row.due_at).getTime();

    if (dueMs < now) {
      overdue += 1;
      continue;
    }

    if (dueMs >= now && dueMs <= now + thresholdMs) {
      dueSoon += 1;
    }
  }

  return { overdue, dueSoon };
}

function fixtureItemIds() {
  return new Set([FIXTURE.itemOverdue, FIXTURE.itemDueSoon, FIXTURE.itemFuture]);
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

  const beforeGestor = await rpcDashboardKpis(apiUrl, anonKey, gestorToken, QA_ALPHA_ORG);
  if (!beforeGestor.ok) {
    throw new Error(`get_dashboard_kpis baseline falhou: ${JSON.stringify(beforeGestor.data)}`);
  }

  insertCanonicalDataset();

  let afterGestor = null;

  try {
    afterGestor = await rpcDashboardKpis(apiUrl, anonKey, gestorToken, QA_ALPHA_ORG);
    if (!afterGestor.ok) {
      record("DASH-32-00", "FAIL", `get_dashboard_kpis pós-insert HTTP ${afterGestor.status}`);
    } else {
      const mgrBefore = readManagerial(beforeGestor.data);
      const mgrAfter = readManagerial(afterGestor.data);

      const dActive = delta(mgrAfter.activeOccurrences, mgrBefore.activeOccurrences);
      const dInterdiction = delta(mgrAfter.activeInterdictions, mgrBefore.activeInterdictions);
      const dPendingEval = delta(mgrAfter.pendingEvaluation, mgrBefore.pendingEvaluation);
      const dOverdue = delta(mgrAfter.overdueActionItems, mgrBefore.overdueActionItems);
      const dDueSoon = delta(mgrAfter.dueSoonActionItems, mgrBefore.dueSoonActionItems);

      record(
        "DASH-32-01",
        dActive === 4 ? "PASS" : "FAIL",
        `activeOccurrences delta=${dActive} (esperado 4)`,
      );
      record(
        "DASH-32-02",
        dInterdiction === 1 ? "PASS" : "FAIL",
        `activeInterdictions delta=${dInterdiction} (esperado 1)`,
      );
      record(
        "DASH-32-03",
        dPendingEval === 2 ? "PASS" : "FAIL",
        `pendingEvaluation delta=${dPendingEval} (esperado 2 — PP conta na fórmula canônica)`,
      );

      const dOpenEval = familyDelta(afterGestor.data, beforeGestor.data, "OPEN_EVALUATION");
      const dInterdicted = familyDelta(afterGestor.data, beforeGestor.data, "INTERDICTED");
      const dCompleted = familyDelta(afterGestor.data, beforeGestor.data, "COMPLETED");

      record(
        "DASH-32-04",
        dOpenEval === 2 && dInterdicted === 1 && dCompleted === 2 ? "PASS" : "FAIL",
        `occurrencesByStatusFamily delta OPEN=${dOpenEval} INTER=${dInterdicted} COMP=${dCompleted}`,
      );

      record(
        "DASH-32-05",
        dOverdue !== null && dOverdue >= 1 ? "PASS" : "FAIL",
        `overdueActionItems delta=${dOverdue} (esperado >= 1)`,
      );
      record(
        "DASH-32-06",
        dDueSoon !== null && dDueSoon >= 1 ? "PASS" : "FAIL",
        `dueSoonActionItems delta=${dDueSoon} (esperado >= 1)`,
      );

      const operational = readOperational(afterGestor.data);
      record(
        "DASH-32-07",
        operational.scopedOpenOccurrences !== null &&
          operational.scopedPendingAwareness !== null
          ? "PASS"
          : "FAIL",
        `operational scoped gestor: open=${operational.scopedOpenOccurrences} awareness=${operational.scopedPendingAwareness}`,
      );

      record(
        "DASH-32-08",
        mgrAfter.pendingAwarenessOrg !== null ? "PASS" : "FAIL",
        `pendingAwarenessOrg gestor (report.read)=${mgrAfter.pendingAwarenessOrg}`,
      );
    }

    const fieldKpis = await rpcDashboardKpis(apiUrl, anonKey, fieldToken, QA_ALPHA_ORG);
    if (fieldKpis.ok) {
      const fieldOperational = readOperational(fieldKpis.data);
      const fieldMgr = readManagerial(fieldKpis.data);

      record(
        "DASH-32-09",
        fieldOperational.scopedOpenOccurrences === null &&
          fieldOperational.scopedPendingAwareness === null
          ? "PASS"
          : "FAIL",
        `operational field sem contacts: open=${fieldOperational.scopedOpenOccurrences}`,
      );

      record(
        "DASH-32-10",
        fieldMgr.pendingAwarenessOrg === null ? "PASS" : "FAIL",
        `pendingAwarenessOrg field (sem report.read)=${fieldMgr.pendingAwarenessOrg}`,
      );
    } else {
      record("DASH-32-09", "FAIL", "get_dashboard_kpis field falhou");
      record("DASH-32-10", "FAIL", "get_dashboard_kpis field falhou");
    }

    const nopermKpis = await rpcDashboardKpis(apiUrl, anonKey, nopermToken, QA_ALPHA_ORG);
    if (nopermKpis.ok) {
      const nopermMgr = readManagerial(nopermKpis.data);
      const allManagerialNull =
        nopermMgr.activeOccurrences === null &&
        nopermMgr.overdueActionItems === null &&
        nopermMgr.pendingAwarenessOrg === null;

      record(
        "DASH-32-11",
        allManagerialNull ? "PASS" : "FAIL",
        "managerial.* null para qa-noperm (sem permissões)",
      );
    } else {
      record("DASH-32-11", "FAIL", "get_dashboard_kpis noperm falhou");
    }

    const spoof = await rpcDashboardKpis(apiUrl, anonKey, gestorToken, QA_GAMMA_ORG);
    record(
      "DASH-32-12",
      spoof.status === 403 || spoof.data?.code === "42501" ? "PASS" : "FAIL",
      `spoof org Gamma → HTTP ${spoof.status} code=${spoof.data?.code ?? "n/a"}`,
    );

    const missingRpc = await rpcMissingFunction(
      apiUrl,
      anonKey,
      gestorToken,
      "get_dashboard_action_items_attention",
    );
    record(
      "DASH-32-13",
      missingRpc.status === 404 ? "PASS" : "FAIL",
      `get_dashboard_action_items_attention ausente → HTTP ${missingRpc.status} (decisão: client-side)`,
    );

    if (afterGestor?.ok) {
      const mgrBefore = readManagerial(beforeGestor.data);
      const mgrAfter = readManagerial(afterGestor.data);
      const dOverdue = delta(mgrAfter.overdueActionItems, mgrBefore.overdueActionItems);
      const dDueSoon = delta(mgrAfter.dueSoonActionItems, mgrBefore.dueSoonActionItems);

      const rows = await fetchOpenActionItems(apiUrl, anonKey, gestorToken);
      const fixtureRows = rows.filter((row) => fixtureItemIds().has(row.id));
      const classified = classifyAttentionItems(fixtureRows, 3);

      record(
        "DASH-32-14",
        classified.overdue === 1 && dOverdue === 1 ? "PASS" : "FAIL",
        `paridade overdue RPC delta=${dOverdue} client fixture=${classified.overdue}`,
      );
      record(
        "DASH-32-15",
        classified.dueSoon === 1 && dDueSoon === 1 ? "PASS" : "FAIL",
        `paridade dueSoon RPC delta=${dDueSoon} client fixture=${classified.dueSoon}`,
      );

      const personal = readPersonal(afterGestor.data);
      record(
        "DASH-32-16",
        typeof personal.myPendingActions === "number" &&
          typeof personal.myPendingAwareness === "number"
          ? "PASS"
          : "FAIL",
        `personal.* numérico (myPendingActions=${personal.myPendingActions})`,
      );
    } else {
      record("DASH-32-14", "FAIL", "paridade overdue não executada (RPC gestor falhou)");
      record("DASH-32-15", "FAIL", "paridade dueSoon não executada (RPC gestor falhou)");
      record("DASH-32-16", "FAIL", "personal não verificado (RPC gestor falhou)");
    }
  } finally {
    cleanupFixture();
    console.log("Cleanup: fixture QA-DASH-32 removido.");
  }

  const failed = results.filter((entry) => entry.status === "FAIL");

  console.log("");
  console.log(`=== QA Dashboard 3.2: ${results.length - failed.length}/${results.length} PASS ===`);

  if (failed.length > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  try {
    cleanupFixture();
  } catch {
    // ignore cleanup errors on crash
  }
  process.exit(1);
});
