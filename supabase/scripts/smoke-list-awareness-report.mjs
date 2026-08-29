/**
 * Smoke test — list_awareness_report (Sprint 3.3, PO-REP-4)
 *
 * Referência: docs/decisions/REPORTS-DECISIONS.md (achado técnico SECURITY DEFINER)
 * Critério de aceite: nunca retorna dado para quem não tem report.read, mesmo
 * com occurrence.read amplo; leitura (read_at) ≠ ciência (awareness_confirmed_at).
 *
 * Uso: node supabase/scripts/smoke-list-awareness-report.mjs
 * Pré-requisito: Supabase local + seed aplicado (pnpm supabase:db:reset)
 */
import { loadSupabaseLocalEnv, runLocalSql } from "./_local-env.mjs";

const PASSWORD = "SafeStop-QA-Local-2026";

const QA_ALPHA_ORG = "b0000000-0000-4000-8000-000000000001";
const QA_BETA_ORG = "b0000000-0000-4000-8000-000000000002";
const QA_ALPHA_AREA = "f0000000-0000-4000-8000-000000000001";
const QA_FIELD_PROFILE = "a0000000-0000-4000-8000-000000000001";
const QA_GESTOR_MEMBER = "c0000000-0000-4000-8000-000000000008";
const QA_SUPERVISOR_MEMBER = "c0000000-0000-4000-8000-000000000009";

const USERS = {
  gestor: "qa-gestor@safestop.local",
  field: "qa-field@safestop.local",
};

const suffix = Date.now().toString().slice(-6);

function fixtureId(index) {
  return `f3320000-0000-4000-8000-${suffix.padStart(11, "0")}${index}`;
}

const FIXTURE = {
  occurrence: fixtureId(1),
  event: fixtureId(2),
  notifRead: fixtureId(3),
  notifConfirmed: fixtureId(4),
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
      '${FIXTURE.occurrence}', '${QA_ALPHA_ORG}', '${QA_ALPHA_AREA}', 'REP-AW-${suffix}', 'REP-AW fixture',
      'QA', 'QA', 'QA', 'HIGH', 'VER_E_AGIR', '${QA_FIELD_PROFILE}', now()
    );
  `);

  runLocalSql(`
    insert into public.notification_events (
      id, organization_id, occurrence_id, event_type, priority, created_by
    ) values (
      '${FIXTURE.event}', '${QA_ALPHA_ORG}', '${FIXTURE.occurrence}', 'VER_AND_ACT_REQUIRED', 'HIGH',
      '${QA_FIELD_PROFILE}'
    );
  `);

  // notifRead: lida (read_at preenchido) mas SEM ciência confirmada —
  // valida explicitamente que leitura ≠ ciência.
  runLocalSql(`
    insert into public.notifications (
      id, notification_event_id, organization_id, recipient_member_id,
      title, message, priority, requires_awareness, read_at, awareness_confirmed_at
    ) values (
      '${FIXTURE.notifRead}', '${FIXTURE.event}', '${QA_ALPHA_ORG}', '${QA_GESTOR_MEMBER}',
      'REP-AW título', 'REP-AW mensagem', 'HIGH', true, now(), null
    );
  `);

  // notifConfirmed: ciência confirmada (implica leitura prévia).
  runLocalSql(`
    insert into public.notifications (
      id, notification_event_id, organization_id, recipient_member_id,
      title, message, priority, requires_awareness, read_at, awareness_confirmed_at
    ) values (
      '${FIXTURE.notifConfirmed}', '${FIXTURE.event}', '${QA_ALPHA_ORG}', '${QA_SUPERVISOR_MEMBER}',
      'REP-AW título', 'REP-AW mensagem', 'HIGH', true, now(), now()
    );
  `);
}

function cleanupFixture() {
  try {
    runLocalSql(`delete from public.notifications where id in ('${FIXTURE.notifRead}', '${FIXTURE.notifConfirmed}');`);
  } catch {
    // fixture ausente
  }
  try {
    runLocalSql(`delete from public.notification_events where id = '${FIXTURE.event}';`);
  } catch {
    // fixture ausente
  }
  try {
    runLocalSql(`delete from public.occurrences where id = '${FIXTURE.occurrence}';`);
  } catch {
    // fixture ausente
  }
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
    // REP-AW-01: qa-gestor tem report.read → retorna as 2 notificações do
    // fixture, incluindo a de outro destinatário (qa-supervisor) —
    // confirma agregação org-wide (achado técnico SECURITY DEFINER).
    const asGestor = await rpc(apiUrl, anonKey, gestorToken, "list_awareness_report", {
      p_organization_id: QA_ALPHA_ORG,
      p_occurrence_id: FIXTURE.occurrence,
      p_limit: 100,
    });
    record(
      "REP-AW-01",
      asGestor.ok && asGestor.data?.items?.length === 2,
      `qa-gestor (report.read) retornou ${asGestor.data?.items?.length ?? "erro"} itens (esperado 2)`,
    );

    // REP-AW-02: leitura ≠ ciência — item lido sem ciência confirmada
    // mantém readAt preenchido e awarenessConfirmedAt null.
    const readItem = asGestor.data?.items?.find((item) => item.id === FIXTURE.notifRead);
    record(
      "REP-AW-02",
      Boolean(readItem?.readAt) && readItem?.awarenessConfirmedAt === null,
      `notifRead: readAt="${readItem?.readAt}" awarenessConfirmedAt=${readItem?.awarenessConfirmedAt}`,
    );

    const confirmedItem = asGestor.data?.items?.find((item) => item.id === FIXTURE.notifConfirmed);
    record(
      "REP-AW-03",
      Boolean(confirmedItem?.readAt) && Boolean(confirmedItem?.awarenessConfirmedAt),
      `notifConfirmed: readAt="${confirmedItem?.readAt}" awarenessConfirmedAt="${confirmedItem?.awarenessConfirmedAt}"`,
    );

    // REP-AW-04: recipientMemberName resolvido para destinatário que NÃO é
    // o usuário autenticado (achado técnico resolve_member_display_name).
    record(
      "REP-AW-04",
      confirmedItem?.recipientMemberName === "QA — Supervisor HSE (técnico)",
      `recipientMemberName="${confirmedItem?.recipientMemberName}" (destinatário ≠ solicitante)`,
    );

    // REP-AW-05: p_pending_only=true retorna apenas notifRead.
    const pendingOnly = await rpc(apiUrl, anonKey, gestorToken, "list_awareness_report", {
      p_organization_id: QA_ALPHA_ORG,
      p_occurrence_id: FIXTURE.occurrence,
      p_pending_only: true,
      p_limit: 100,
    });
    record(
      "REP-AW-05",
      pendingOnly.ok &&
        pendingOnly.data?.items?.length === 1 &&
        pendingOnly.data.items[0].id === FIXTURE.notifRead,
      `p_pending_only=true retornou ${pendingOnly.data?.items?.length} item (esperado 1: notifRead)`,
    );

    // REP-AW-06: CRÍTICO — qa-field (occurrence.read amplo, SEM report.read)
    // nunca recebe nenhuma linha, mesmo filtrando pela mesma ocorrência.
    const asField = await rpc(apiUrl, anonKey, fieldToken, "list_awareness_report", {
      p_organization_id: QA_ALPHA_ORG,
      p_occurrence_id: FIXTURE.occurrence,
      p_limit: 100,
    });
    record(
      "REP-AW-06",
      asField.status === 403 || asField.status === 400,
      `qa-field (sem report.read) → HTTP ${asField.status} (esperado 403/400, nunca 200 com dados)`,
    );

    // REP-AW-07: cross-tenant — qa-field tenta consultar Beta (nem vínculo,
    // nem report.read) — gate de permissão já bloqueia primeiro.
    const crossTenant = await rpc(apiUrl, anonKey, fieldToken, "list_awareness_report", {
      p_organization_id: QA_BETA_ORG,
      p_limit: 10,
    });
    record(
      "REP-AW-07",
      crossTenant.status === 403 || crossTenant.status === 400,
      `cross-tenant field→Beta HTTP ${crossTenant.status} (esperado 403/400)`,
    );
  } finally {
    cleanupFixture();
    console.log("Cleanup: fixture REP-AW removido.");
  }

  const failed = results.filter((entry) => !entry.ok);
  console.log("");
  console.log(`=== smoke-list-awareness-report: ${results.length - failed.length}/${results.length} PASS ===`);
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
