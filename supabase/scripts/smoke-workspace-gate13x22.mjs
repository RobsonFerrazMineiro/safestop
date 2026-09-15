/**
 * Smoke Gate 13X.2.2 — leitura de detalhe JWT (contratada origin).
 *
 * Uso: node supabase/scripts/smoke-workspace-gate13x22.mjs
 */
import { execFileSync, spawnSync } from "node:child_process";
import { writeFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { loadSupabaseLocalEnv } from "./_local-env.mjs";

const CONTAINER = process.env.SAFESTOP_DB_CONTAINER ?? "supabase_db_safestop";
const LOCAL_PASSWORD = "SafeStop-QA-Local-2026";
const ALPHA_ORG = "b0000000-0000-4000-8000-000000000001";
const BETA_ORG = "b0000000-0000-4000-8000-000000000002";
const ALPHA_AREA = "f0000000-0000-4000-8000-000000000001";
const FIELD_EMAIL = "qa-field@safestop.local";
const MULTI_EMAIL = "qa-multi@safestop.local";
const NOPERM_EMAIL = "qa-noperm@safestop.local";

const WS = "d1322000-0000-4000-8000-000000000001";
const CONTRACT_A = "d1322000-0000-4000-8000-000000000011";
const PARTICIPANT = "d1322000-0000-4000-8000-000000000041";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function runSqlAsPostgres(sql, label) {
  const sqlPath = join(tmpdir(), `safestop-g13x22-${Date.now()}-${label}.sql`);
  writeFileSync(sqlPath, sql, "utf8");
  const containerPath = `/tmp/smoke-g13x22-${label}.sql`;
  try {
    execFileSync("docker", ["cp", sqlPath, `${CONTAINER}:${containerPath}`], {
      stdio: "inherit",
    });
    const result = spawnSync(
      "docker",
      [
        "exec",
        "-i",
        CONTAINER,
        "psql",
        "-U",
        "postgres",
        "-d",
        "postgres",
        "-v",
        "ON_ERROR_STOP=1",
        "-f",
        containerPath,
      ],
      { encoding: "utf8" },
    );
    const combined = `${result.stdout ?? ""}${result.stderr ?? ""}`;
    if (result.status !== 0) {
      throw new Error(`SQL ${label} falhou (exit ${result.status}):\n${combined}`);
    }
    return combined;
  } finally {
    try {
      unlinkSync(sqlPath);
    } catch {
      // ignore
    }
  }
}

async function signIn(apiUrl, anonKey, email, password) {
  const res = await fetch(`${apiUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: anonKey, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(`login ${email}: ${res.status} ${await res.text()}`);
  return res.json();
}

async function rpc(apiUrl, anonKey, token, fn, args) {
  const res = await fetch(`${apiUrl}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(args),
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`RPC ${fn} HTTP ${res.status}: ${text}`);
  }
  if (!res.ok) throw new Error(`RPC ${fn} HTTP ${res.status}: ${text}`);
  return json;
}

async function restGet(apiUrl, anonKey, token, path) {
  const res = await fetch(`${apiUrl}/rest/v1/${path}`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${token}` },
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: res.ok, status: res.status, body: text };
  }
  return { ok: res.ok, status: res.status, body: json };
}

async function main() {
  const { apiUrl, anonKey } = loadSupabaseLocalEnv();
  const field = await signIn(apiUrl, anonKey, FIELD_EMAIL, LOCAL_PASSWORD);
  const multi = await signIn(apiUrl, anonKey, MULTI_EMAIL, LOCAL_PASSWORD);
  const noperm = await signIn(apiUrl, anonKey, NOPERM_EMAIL, LOCAL_PASSWORD);

  runSqlAsPostgres(
    `
\\set ON_ERROR_STOP on
delete from public.occurrence_participants where id = '${PARTICIPANT}';
delete from public.occurrence_participants
  where occurrence_id in (select id from public.occurrences where title like 'G13X22%');
delete from public.occurrence_status_history
  where occurrence_id in (select id from public.occurrences where title like 'G13X22%');
delete from public.notifications n
  using public.notification_events e
  where n.notification_event_id = e.id
    and e.occurrence_id in (select id from public.occurrences where title like 'G13X22%');
delete from public.notification_events
  where occurrence_id in (select id from public.occurrences where title like 'G13X22%');
delete from public.occurrences where title like 'G13X22%';
delete from public.contracts where id = '${CONTRACT_A}';
delete from public.workspace_memberships where workspace_id = '${WS}';
delete from public.organization_workspace_links where workspace_id = '${WS}';
delete from public.workspaces where id = '${WS}';

do $$
declare
  v_field_member uuid;
  v_multi_member uuid;
begin
  select om.id into v_field_member
  from public.organization_members om
  where om.organization_id = '${ALPHA_ORG}'
    and om.profile_id = '${field.user.id}'
    and om.is_active;
  select om.id into v_multi_member
  from public.organization_members om
  where om.organization_id = '${BETA_ORG}'
    and om.profile_id = '${multi.user.id}'
    and om.is_active;
  if v_field_member is null or v_multi_member is null then
    raise exception 'Smoke 13X.2.2: members não encontrados';
  end if;

  insert into public.workspaces (id, name, code, owner_organization_id, is_active)
  values ('${WS}', 'Hydro Alunorte 13X22', 'G13X22-WS', '${ALPHA_ORG}', true);

  insert into public.organization_workspace_links (organization_id, workspace_id, is_active)
  values ('${ALPHA_ORG}', '${WS}', true), ('${BETA_ORG}', '${WS}', true);

  insert into public.workspace_memberships (
    organization_member_id, organization_id, workspace_id, is_active
  ) values
    (v_field_member, '${ALPHA_ORG}', '${WS}', true),
    (v_multi_member, '${BETA_ORG}', '${WS}', true);

  insert into public.contracts (
    id, client_organization_id, contractor_organization_id, workspace_id,
    contract_number, name, starts_at, is_active
  ) values (
    '${CONTRACT_A}', '${ALPHA_ORG}', '${BETA_ORG}', '${WS}',
    'G13X22-A', '13X.2.2 Contrato A', now(), true
  );
end $$;
`,
    "setup",
  );

  const created = await rpc(apiUrl, anonKey, multi.access_token, "create_occurrence", {
    payload: {
      organization_id: BETA_ORG,
      workspace_id: WS,
      area_id: ALPHA_AREA,
      contract_id: CONTRACT_A,
      contractor_organization_id: BETA_ORG,
      title: "G13X22 C-TUV",
      task_description: "t",
      location_description: "l",
      condition_description: "c",
      severity: "LOW",
    },
  });
  assert(created?.success === true, `C-TUV ${JSON.stringify(created)}`);
  const occId = created.data.id;

  runSqlAsPostgres(
    `
    insert into public.occurrence_participants (
      id, occurrence_id, organization_id, organization_member_id, participant_type
    )
    select '${PARTICIPANT}', '${occId}', '${BETA_ORG}', om.id, 'OBSERVER'
    from public.organization_members om
    where om.organization_id = '${BETA_ORG}'
      and om.profile_id = '${multi.user.id}'
    on conflict (id) do nothing;
    `,
    "participant",
  );

  const history = await restGet(
    apiUrl,
    anonKey,
    multi.access_token,
    `occurrence_status_history?occurrence_id=eq.${occId}&select=id,to_status`,
  );
  assert(
    history.ok &&
      Array.isArray(history.body) &&
      history.body.length >= 1 &&
      history.body.some((row) => row.to_status === "PARALISACAO_PREVENTIVA"),
    `H-TUV ${JSON.stringify(history)}`,
  );
  console.log("PASS H-TUV occurrence_status_history >= 1");

  const timeline = await rpc(apiUrl, anonKey, multi.access_token, "get_occurrence_timeline", {
    p_occurrence_id: occId,
  });
  assert(
    timeline?.success === true && timeline?.error?.code !== "FORBIDDEN",
    `T-TUV ${JSON.stringify(timeline)}`,
  );
  console.log("PASS T-TUV get_occurrence_timeline success");

  const participants = await restGet(
    apiUrl,
    anonKey,
    multi.access_token,
    `occurrence_participants?occurrence_id=eq.${occId}&select=id`,
  );
  assert(
    participants.ok && Array.isArray(participants.body) && participants.body.length >= 1,
    `P-TUV ${JSON.stringify(participants)}`,
  );
  console.log("PASS P-TUV occurrence_participants visíveis");

  const negHistory = await restGet(
    apiUrl,
    anonKey,
    noperm.access_token,
    `occurrence_status_history?occurrence_id=eq.${occId}&select=id`,
  );
  assert(
    negHistory.ok && Array.isArray(negHistory.body) && negHistory.body.length === 0,
    `NEG history ${JSON.stringify(negHistory)}`,
  );
  const negTl = await rpc(apiUrl, anonKey, noperm.access_token, "get_occurrence_timeline", {
    p_occurrence_id: occId,
  });
  assert(negTl?.success === false && negTl.error?.code === "FORBIDDEN", `NEG timeline ${JSON.stringify(negTl)}`);
  console.log("PASS NEG qa-noperm sem occurrence.read");

  const mut = await rpc(apiUrl, anonKey, multi.access_token, "start_occurrence_evaluation", {
    p_occurrence_id: occId,
  });
  assert(mut?.success === false && mut.error?.code === "FORBIDDEN", `MUT-NEG ${JSON.stringify(mut)}`);
  console.log("PASS MUT-NEG start_occurrence_evaluation continua FORBIDDEN");

  runSqlAsPostgres(
    `
    delete from public.occurrence_participants where id = '${PARTICIPANT}';
    delete from public.occurrence_participants where occurrence_id = '${occId}';
    delete from public.occurrence_status_history where occurrence_id = '${occId}';
    delete from public.notifications n
      using public.notification_events e
      where n.notification_event_id = e.id and e.occurrence_id = '${occId}';
    delete from public.notification_events where occurrence_id = '${occId}';
    delete from public.occurrences where id = '${occId}';
    delete from public.contracts where id = '${CONTRACT_A}';
    delete from public.workspace_memberships where workspace_id = '${WS}';
    delete from public.organization_workspace_links where workspace_id = '${WS}';
    delete from public.workspaces where id = '${WS}';
    `,
    "cleanup",
  );

  console.log("ALL GATE 13X.2.2 CHECKS PASSED");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
