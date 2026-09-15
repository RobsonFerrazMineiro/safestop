/**
 * Smoke Gate 13B — RLS autenticada + IDOR + create_occurrence Workspace-aware.
 * NÃO usa postgres/service role para declarar PASS de RLS.
 *
 * Uso: node supabase/scripts/smoke-workspace-gate13b.mjs
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
const SUPERVISOR_EMAIL = "qa-supervisor@safestop.local";
const PLATFORM_EMAIL = "qa-platform@safestop.local";

const WS1 = "d13b0000-0000-4000-8000-000000000001";
const WS2 = "d13b0000-0000-4000-8000-000000000002";
const WS_OFF = "d13b0000-0000-4000-8000-000000000003";
const OCC_WS1 = "d13b0000-0000-4000-8000-000000000011";
const OCC_WS2 = "d13b0000-0000-4000-8000-000000000012";
const CONTRACT_WS1 = "d13b0000-0000-4000-8000-000000000021";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function runSqlAsPostgres(sql, label) {
  const sqlPath = join(tmpdir(), `safestop-g13b-${Date.now()}-${label}.sql`);
  writeFileSync(sqlPath, sql, "utf8");
  const containerPath = `/tmp/smoke-g13b-${label}.sql`;
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
  const supervisor = await signIn(apiUrl, anonKey, SUPERVISOR_EMAIL, LOCAL_PASSWORD);
  const platform = await signIn(apiUrl, anonKey, PLATFORM_EMAIL, LOCAL_PASSWORD);
  const fieldId = field.user.id;
  const supervisorId = supervisor.user.id;

  console.log("=== Setup fixtures (postgres — não conta como PASS RLS) ===");
  const setupOut = runSqlAsPostgres(
    `
\\set ON_ERROR_STOP on
-- cleanup idempotente de fixtures deste smoke (IDs fixos + creates anteriores)
delete from public.occurrence_comments
  where occurrence_id in ('${OCC_WS1}','${OCC_WS2}')
     or occurrence_id in (select id from public.occurrences where title like 'G13B%' or public_code like 'SS-G13B%');
delete from public.occurrence_participants
  where occurrence_id in ('${OCC_WS1}','${OCC_WS2}')
     or occurrence_id in (select id from public.occurrences where title like 'G13B%' or public_code like 'SS-G13B%');
delete from public.occurrence_decisions
  where occurrence_id in ('${OCC_WS1}','${OCC_WS2}')
     or occurrence_id in (select id from public.occurrences where title like 'G13B%' or public_code like 'SS-G13B%');
delete from public.notifications n
  using public.notification_events e
  where n.notification_event_id = e.id
    and (
      e.occurrence_id in ('${OCC_WS1}','${OCC_WS2}')
      or e.occurrence_id in (select id from public.occurrences where title like 'G13B%' or public_code like 'SS-G13B%')
    );
delete from public.notification_events
  where occurrence_id in ('${OCC_WS1}','${OCC_WS2}')
     or occurrence_id in (select id from public.occurrences where title like 'G13B%' or public_code like 'SS-G13B%');
delete from public.occurrence_status_history
  where occurrence_id in ('${OCC_WS1}','${OCC_WS2}')
     or occurrence_id in (select id from public.occurrences where title like 'G13B%' or public_code like 'SS-G13B%');
delete from public.occurrences
  where id in ('${OCC_WS1}','${OCC_WS2}')
     or title like 'G13B%'
     or public_code like 'SS-G13B%';
delete from public.workspace_memberships
  where workspace_id in ('${WS1}','${WS2}','${WS_OFF}','d13b0000-0000-4000-8000-000000000099');
delete from public.organization_workspace_links
  where workspace_id in ('${WS1}','${WS2}','${WS_OFF}','d13b0000-0000-4000-8000-000000000099');
delete from public.contracts where id = '${CONTRACT_WS1}';
delete from public.workspaces
  where id in ('${WS1}','${WS2}','${WS_OFF}','d13b0000-0000-4000-8000-000000000099');

do $$
declare
  v_field_member uuid;
  v_sup_member uuid;
  v_legacy uuid;
begin
  select om.id into v_field_member from public.organization_members om
   where om.organization_id = '${ALPHA_ORG}' and om.profile_id = '${fieldId}' and om.is_active;
  select om.id into v_sup_member from public.organization_members om
   where om.organization_id = '${ALPHA_ORG}' and om.profile_id = '${supervisorId}' and om.is_active;
  if v_field_member is null or v_sup_member is null then
    raise exception 'members não encontrados';
  end if;

  insert into public.workspaces (id, name, code, owner_organization_id, is_active) values
    ('${WS1}', 'Gate13B WS1', 'G13B-WS1', '${ALPHA_ORG}', true),
    ('${WS2}', 'Gate13B WS2', 'G13B-WS2', null, true),
    ('${WS_OFF}', 'Gate13B WS OFF', 'G13B-WS-OFF', null, false)
  on conflict (id) do update set
    is_active = excluded.is_active,
    name = excluded.name,
    owner_organization_id = excluded.owner_organization_id;

  insert into public.organization_workspace_links (organization_id, workspace_id, is_active) values
    ('${ALPHA_ORG}', '${WS1}', true),
    ('${BETA_ORG}', '${WS1}', true),
    ('${ALPHA_ORG}', '${WS2}', true),
    ('${ALPHA_ORG}', '${WS_OFF}', true)
  on conflict (organization_id, workspace_id) do update set is_active = excluded.is_active;

  insert into public.contracts (
    id, client_organization_id, contractor_organization_id, workspace_id,
    contract_number, name, starts_at, is_active
  ) values (
    '${CONTRACT_WS1}', '${ALPHA_ORG}', '${BETA_ORG}', '${WS1}',
    'G13B-C1', 'Gate13B contrato WS1', now(), true
  )
  on conflict (id) do update set
    workspace_id = excluded.workspace_id,
    is_active = true;

  insert into public.workspace_memberships (organization_member_id, organization_id, workspace_id, is_active) values
    (v_field_member, '${ALPHA_ORG}', '${WS1}', true),
    (v_sup_member, '${ALPHA_ORG}', '${WS2}', true);

  select id into v_legacy from public.occurrences
   where organization_id = '${ALPHA_ORG}'
     and id not in ('${OCC_WS1}','${OCC_WS2}')
   order by created_at asc limit 1;

  insert into public.occurrences (
    id, organization_id, workspace_id, area_id, public_code, title, task_description,
    location_description, condition_description, severity, status, created_by
  )
  select '${OCC_WS1}', organization_id, '${WS1}', area_id, 'SS-G13B-000001', 'G13B WS1',
         'task','loc','cond', severity, 'PARALISACAO_PREVENTIVA', created_by
  from public.occurrences where id = v_legacy;

  insert into public.occurrences (
    id, organization_id, workspace_id, area_id, public_code, title, task_description,
    location_description, condition_description, severity, status, created_by
  )
  select '${OCC_WS2}', organization_id, '${WS2}', area_id, 'SS-G13B-000002', 'G13B WS2',
         'task','loc','cond', severity, 'PARALISACAO_PREVENTIVA', created_by
  from public.occurrences where id = v_legacy;

  update public.occurrences set workspace_id = null where id = v_legacy;

  insert into public.workspace_memberships (organization_member_id, organization_id, workspace_id, is_active)
  values (v_sup_member, '${ALPHA_ORG}', '${WS1}', false)
  on conflict (organization_member_id, workspace_id) do update set is_active = false;

  raise notice 'EXPORT legacy=% field_member=% sup_member=%', v_legacy, v_field_member, v_sup_member;
end $$;
`,
    "setup",
  );
  const m = setupOut.match(
    /EXPORT legacy=([0-9a-f-]+) field_member=([0-9a-f-]+) sup_member=([0-9a-f-]+)/i,
  );
  assert(m, `EXPORT parse fail: ${setupOut}`);
  const [, occLegacy, fieldMember, supMember] = m;
  console.log(`legacy=${occLegacy}`);

  console.log("=== Foundation RLS (authenticated) ===");

  // 1) member válido vê WS1
  let r = await restGet(apiUrl, anonKey, field.access_token, `workspaces?id=eq.${WS1}&select=id`);
  assert(r.ok && Array.isArray(r.body) && r.body.length === 1, `#1 ${JSON.stringify(r)}`);
  console.log("PASS #1 member válido vê Workspace ativo autorizado");

  // 2) não vê WS2 sem membership
  r = await restGet(apiUrl, anonKey, field.access_token, `workspaces?id=eq.${WS2}&select=id`);
  assert(r.ok && Array.isArray(r.body) && r.body.length === 0, `#2 ${JSON.stringify(r)}`);
  console.log("PASS #2 não vê Workspace sem membership");

  // 3) workspace inativo
  r = await restGet(apiUrl, anonKey, field.access_token, `workspaces?id=eq.${WS_OFF}&select=id`);
  assert(r.ok && Array.isArray(r.body) && r.body.length === 0, `#3 ${JSON.stringify(r)}`);
  assert(
    (await rpc(apiUrl, anonKey, field.access_token, "can_access_workspace", {
      p_workspace_id: WS_OFF,
    })) === false,
    "#3b can_access inactive",
  );
  console.log("PASS #3 Workspace inativo inacessível");

  // 4) link inativo
  runSqlAsPostgres(
    `update public.organization_workspace_links set is_active=false where organization_id='${ALPHA_ORG}' and workspace_id='${WS1}';`,
    "link-off",
  );
  assert(
    (await rpc(apiUrl, anonKey, field.access_token, "can_access_workspace", {
      p_workspace_id: WS1,
    })) === false,
    "#4 access",
  );
  r = await restGet(apiUrl, anonKey, field.access_token, `workspaces?id=eq.${WS1}&select=id`);
  assert(r.ok && r.body.length === 0, `#4 select ${JSON.stringify(r)}`);
  runSqlAsPostgres(
    `update public.organization_workspace_links set is_active=true where organization_id='${ALPHA_ORG}' and workspace_id='${WS1}';`,
    "link-on",
  );
  console.log("PASS #4 link inativo bloqueia");

  // 5) membership inativa
  runSqlAsPostgres(
    `update public.workspace_memberships set is_active=false where organization_member_id='${fieldMember}' and workspace_id='${WS1}';`,
    "wm-off",
  );
  assert(
    (await rpc(apiUrl, anonKey, field.access_token, "can_access_workspace", {
      p_workspace_id: WS1,
    })) === false,
    "#5",
  );
  runSqlAsPostgres(
    `update public.workspace_memberships set is_active=true where organization_member_id='${fieldMember}' and workspace_id='${WS1}';`,
    "wm-on",
  );
  console.log("PASS #5 membership inativa bloqueia");

  // 6) org membership inativa
  runSqlAsPostgres(
    `update public.organization_members set is_active=false where id='${fieldMember}';`,
    "om-off",
  );
  assert(
    (await rpc(apiUrl, anonKey, field.access_token, "can_access_workspace", {
      p_workspace_id: WS1,
    })) === false,
    "#6",
  );
  runSqlAsPostgres(
    `update public.organization_members set is_active=true where id='${fieldMember}';`,
    "om-on",
  );
  console.log("PASS #6 Organization Membership inativa bloqueia");

  // 7) disclosure — field não lista membership do supervisor
  r = await restGet(
    apiUrl,
    anonKey,
    field.access_token,
    `workspace_memberships?organization_member_id=eq.${supMember}&select=id,organization_member_id,is_active`,
  );
  assert(r.ok && Array.isArray(r.body) && r.body.length === 0, `#7 ${JSON.stringify(r)}`);
  r = await restGet(
    apiUrl,
    anonKey,
    field.access_token,
    `workspace_memberships?select=id,organization_member_id,workspace_id`,
  );
  assert(r.ok && Array.isArray(r.body), `#7b ${JSON.stringify(r)}`);
  assert(
    r.body.every((row) => row.organization_member_id === fieldMember),
    `#7c viu membership alheia: ${JSON.stringify(r.body)}`,
  );
  console.log("PASS #7 usuário comum não lista memberships de terceiros");

  // 8) insert/update foundation negado
  const ins = await fetch(`${apiUrl}/rest/v1/workspaces`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${field.access_token}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ name: "deny", code: "G13B-DENY" }),
  });
  assert(!ins.ok, `#8 insert ${ins.status}`);
  const upd = await fetch(`${apiUrl}/rest/v1/workspaces?id=eq.${WS1}`, {
    method: "PATCH",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${field.access_token}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ name: "hacked" }),
  });
  assert(!upd.ok || upd.status === 204, `#8 update status=${upd.status}`);
  // PostgREST may return 204 with 0 rows; verify name unchanged
  r = await restGet(
    apiUrl,
    anonKey,
    platform.access_token,
    `workspaces?id=eq.${WS1}&select=name`,
  );
  assert(r.body?.[0]?.name === "Gate13B WS1", `#8 name changed: ${JSON.stringify(r)}`);
  console.log("PASS #8 non-admin não inserir/editar foundation");

  // 9) platform admin
  assert(
    (await rpc(apiUrl, anonKey, platform.access_token, "can_access_workspace", {
      p_workspace_id: WS1,
    })) === true,
    "#9",
  );
  r = await restGet(apiUrl, anonKey, platform.access_token, `workspaces?id=eq.${WS_OFF}&select=id`);
  assert(r.ok && r.body.length === 1, `#9b platform vê inactive ${JSON.stringify(r)}`);
  console.log("PASS #9 Platform Admin exceção");

  console.log("=== Occurrence / IDOR ===");

  // 10) legacy NULL
  assert(
    (await rpc(apiUrl, anonKey, field.access_token, "can_access_occurrence", {
      target_occurrence_id: occLegacy,
    })) === true,
    "#10",
  );
  r = await restGet(
    apiUrl,
    anonKey,
    field.access_token,
    `occurrences?id=eq.${occLegacy}&select=id,workspace_id`,
  );
  assert(r.ok && r.body.length === 1 && r.body[0].workspace_id === null, `#10 select`);
  console.log("PASS #10 legacy NULL acessível");

  // 11) WS1 authorized
  r = await restGet(
    apiUrl,
    anonKey,
    field.access_token,
    `occurrences?id=eq.${OCC_WS1}&select=id`,
  );
  assert(r.ok && r.body.length === 1, `#11 ${JSON.stringify(r)}`);
  console.log("PASS #11 occurrence Workspace autorizada");

  // 12) outro Workspace bloqueado
  r = await restGet(
    apiUrl,
    anonKey,
    field.access_token,
    `occurrences?id=eq.${OCC_WS2}&select=id`,
  );
  assert(r.ok && r.body.length === 0, `#12 ${JSON.stringify(r)}`);
  console.log("PASS #12 occurrence outro Workspace bloqueada");

  // 13) deep link / IDOR SELECT
  r = await restGet(
    apiUrl,
    anonKey,
    field.access_token,
    `occurrences?id=eq.${OCC_WS2}&select=*`,
  );
  assert(r.ok && r.body.length === 0, `#13 ${JSON.stringify(r)}`);
  console.log("PASS #13 IDOR SELECT cross-Workspace");

  // 14) IDOR UPDATE/mutação via RPC
  const evalDenied = await rpc(apiUrl, anonKey, field.access_token, "start_occurrence_evaluation", {
    p_occurrence_id: OCC_WS2,
  });
  assert(
    evalDenied?.success === false &&
      (evalDenied?.error?.code === "FORBIDDEN" || evalDenied?.error?.code === "NOT_FOUND"),
    `#14 ${JSON.stringify(evalDenied)}`,
  );
  console.log("PASS #14 IDOR UPDATE/mutação RPC bloqueada");

  // 15/16 create com workspace não autorizado / org×ws inválido
  const createUnauthorized = await rpc(apiUrl, anonKey, field.access_token, "create_occurrence", {
    payload: {
      organization_id: ALPHA_ORG,
      workspace_id: WS2,
      area_id: ALPHA_AREA,
      contractor_organization_id: BETA_ORG,
      title: "G13B deny WS2",
      task_description: "t",
      location_description: "l",
      condition_description: "c",
      severity: "LOW",
    },
  });
  assert(
    createUnauthorized?.success === false && createUnauthorized?.error?.code === "FORBIDDEN",
    `#15 ${JSON.stringify(createUnauthorized)}`,
  );
  console.log("PASS #15 create com Workspace não autorizado bloqueado");

  // 16: org A + workspace sem link — cria WS só Beta? Use WS1 with wrong org by linking only... 
  // field can't create for Beta. Use postgres to create orphan workspace linked only to Beta,
  // then field tries Alpha + that workspace.
  const WS_BETA_ONLY = "d13b0000-0000-4000-8000-000000000099";
  runSqlAsPostgres(
    `
    insert into public.workspaces (id, name, code, is_active)
    values ('${WS_BETA_ONLY}', 'Beta only', 'G13B-BETA', true)
    on conflict (id) do nothing;
    insert into public.organization_workspace_links (organization_id, workspace_id, is_active)
    values ('${BETA_ORG}', '${WS_BETA_ONLY}', true)
    on conflict (organization_id, workspace_id) do update set is_active=true;
    `,
    "ws-beta",
  );
  // Even platform creating as field: field has no access to WS_BETA_ONLY
  const createMismatch = await rpc(apiUrl, anonKey, field.access_token, "create_occurrence", {
    payload: {
      organization_id: ALPHA_ORG,
      workspace_id: WS_BETA_ONLY,
      area_id: ALPHA_AREA,
      contractor_organization_id: BETA_ORG,
      title: "G13B org mismatch",
      task_description: "t",
      location_description: "l",
      condition_description: "c",
      severity: "LOW",
    },
  });
  assert(
    createMismatch?.success === false &&
      (createMismatch?.error?.code === "FORBIDDEN" ||
        createMismatch?.error?.code === "VALIDATION_ERROR"),
    `#16 ${JSON.stringify(createMismatch)}`,
  );
  console.log("PASS #16 Organization × Workspace inválido bloqueado");

  // 17 FK inexistente — via update postgres already; authenticated create
  const createMissing = await rpc(apiUrl, anonKey, field.access_token, "create_occurrence", {
    payload: {
      organization_id: ALPHA_ORG,
      workspace_id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
      area_id: ALPHA_AREA,
      contractor_organization_id: BETA_ORG,
      title: "G13B missing ws",
      task_description: "t",
      location_description: "l",
      condition_description: "c",
      severity: "LOW",
    },
  });
  assert(createMissing?.success === false, `#17 ${JSON.stringify(createMissing)}`);
  console.log("PASS #17 Workspace inexistente rejeitado");

  // create autorizado com workspace (compat path + workspace-aware)
  const createOk = await rpc(apiUrl, anonKey, field.access_token, "create_occurrence", {
    payload: {
      organization_id: ALPHA_ORG,
      workspace_id: WS1,
      area_id: ALPHA_AREA,
      contract_id: CONTRACT_WS1,
      contractor_organization_id: BETA_ORG,
      title: "G13B create WS1 ok",
      task_description: "t",
      location_description: "l",
      condition_description: "c",
      severity: "MEDIUM",
    },
  });
  assert(createOk?.success === true && createOk?.data?.workspace_id === WS1, `#createOk ${JSON.stringify(createOk)}`);
  const createdId = createOk.data.id;
  console.log("PASS create_occurrence Workspace-aware (autorizado)");

  // create sem workspace_id (compat clientes)
  const createLegacy = await rpc(apiUrl, anonKey, field.access_token, "create_occurrence", {
    payload: {
      organization_id: ALPHA_ORG,
      area_id: ALPHA_AREA,
      contractor_organization_id: BETA_ORG,
      title: "G13B create legacy null",
      task_description: "t",
      location_description: "l",
      condition_description: "c",
      severity: "LOW",
    },
  });
  assert(
    createLegacy?.success === true && createLegacy?.data?.workspace_id == null,
    `#compat ${JSON.stringify(createLegacy)}`,
  );
  console.log("PASS create_occurrence sem workspace_id (compat clientes)");

  console.log("=== Filhos ===");
  // 18 mutação filha em occurrence inacessível
  const commentDenied = await rpc(apiUrl, anonKey, field.access_token, "create_occurrence_comment", {
    p_occurrence_id: OCC_WS2,
    p_content: "should fail",
  });
  assert(
    commentDenied?.success === false,
    `#18 ${JSON.stringify(commentDenied)}`,
  );
  console.log("PASS #18 mutação filha em occurrence inacessível falha");

  // 19 operação legítima
  const commentOk = await rpc(apiUrl, anonKey, field.access_token, "create_occurrence_comment", {
    p_occurrence_id: OCC_WS1,
    p_content: "Gate 13B comment ok",
  });
  assert(commentOk?.success === true, `#19 ${JSON.stringify(commentOk)}`);
  console.log("PASS #19 mutação filha autorizada OK");

  // filhos sem workspace_id
  const childCols = runSqlAsPostgres(
    `select count(*)::int as c from information_schema.columns
     where table_schema='public' and column_name='workspace_id'
       and table_name in ('occurrence_comments','occurrence_attachments','action_plans','mdho_assessments');`,
    "child-cols",
  );
  assert(/^\s*0\s*$/m.test(childCols.split("\n").find((l) => /^\s*\d+\s*$/.test(l)) ?? ""), childCols);
  console.log("PASS filhos sem workspace_id");

  console.log("=== Cleanup ===");
  runSqlAsPostgres(
    `
    delete from public.occurrence_comments
      where occurrence_id in ('${OCC_WS1}','${OCC_WS2}','${createdId}');
    delete from public.occurrence_participants
      where occurrence_id in ('${createdId}','${createLegacy.data.id}');
    delete from public.occurrence_status_history
      where occurrence_id in ('${OCC_WS1}','${OCC_WS2}','${createdId}','${createLegacy.data.id}');
    delete from public.notifications n
      using public.notification_events e
      where n.notification_event_id = e.id
        and e.occurrence_id in ('${createdId}','${createLegacy.data.id}');
    delete from public.notification_events
      where occurrence_id in ('${createdId}','${createLegacy.data.id}');
    delete from public.occurrences
      where id in ('${OCC_WS1}','${OCC_WS2}','${createdId}','${createLegacy.data.id}');
    delete from public.workspace_memberships
      where workspace_id in ('${WS1}','${WS2}','${WS_OFF}','${WS_BETA_ONLY}');
    delete from public.organization_workspace_links
      where workspace_id in ('${WS1}','${WS2}','${WS_OFF}','${WS_BETA_ONLY}');
    delete from public.contracts where id = '${CONTRACT_WS1}';
    delete from public.workspaces
      where id in ('${WS1}','${WS2}','${WS_OFF}','${WS_BETA_ONLY}');
    update public.occurrences set workspace_id = null where id = '${occLegacy}';
    `,
    "cleanup",
  );

  console.log("ALL GATE 13B CHECKS PASSED");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
