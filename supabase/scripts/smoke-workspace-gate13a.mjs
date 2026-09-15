/**
 * Smoke Gate 13A — workspace_id em occurrences + can_access_workspace + compat.
 *
 * - SQL estrutural via postgres (schema/FK/filhos sem workspace_id)
 * - RPC autenticada via JWT (acesso efetivo / negativos / IDOR / platform admin)
 *
 * Uso: node supabase/scripts/smoke-workspace-gate13a.mjs
 */
import { execFileSync, spawnSync } from "node:child_process";
import { writeFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { loadSupabaseLocalEnv } from "./_local-env.mjs";

const CONTAINER = process.env.SAFESTOP_DB_CONTAINER ?? "supabase_db_safestop";
const LOCAL_PASSWORD = "SafeStop-QA-Local-2026";

const ALPHA_ORG = "b0000000-0000-4000-8000-000000000001";
const FIELD_EMAIL = "qa-field@safestop.local";
const SUPERVISOR_EMAIL = "qa-supervisor@safestop.local";
const PLATFORM_EMAIL = "qa-platform@safestop.local";

const WS1 = "d13a0000-0000-4000-8000-000000000001";
const WS2 = "d13a0000-0000-4000-8000-000000000002";
const WS_OFF = "d13a0000-0000-4000-8000-000000000003";

const STRUCTURAL_SQL = `
\\set ON_ERROR_STOP on

do $$
declare
  v_bad uuid := 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
  v_occ uuid;
  v_has_child_col boolean;
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'occurrences' and column_name = 'workspace_id'
      and is_nullable = 'YES' and data_type = 'uuid'
  ) then
    raise exception 'FAIL: occurrences.workspace_id deve existir e ser uuid NULLABLE';
  end if;
  raise notice 'PASS structure: occurrences.workspace_id uuid nullable';

  select id into v_occ from public.occurrences
  where organization_id = 'b0000000-0000-4000-8000-000000000001' limit 1;
  if v_occ is null then
    raise exception 'FAIL: sem occurrence Alpha para teste FK';
  end if;

  begin
    update public.occurrences set workspace_id = v_bad where id = v_occ;
    raise exception 'FAIL: deveria rejeitar workspace inexistente';
  exception
    when foreign_key_violation then
      raise notice 'PASS structure: FK rejeita workspace inexistente';
    when check_violation then
      raise notice 'PASS structure: trigger rejeita workspace inexistente/inativo';
  end;

  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and column_name = 'workspace_id'
      and table_name in (
        'occurrence_status_history',
        'occurrence_participants',
        'occurrence_decisions',
        'occurrence_comments',
        'occurrence_attachments',
        'action_plans',
        'action_items',
        'action_item_attachments',
        'mdho_assessments',
        'mdho_selections'
      )
  ) into v_has_child_col;

  if v_has_child_col then
    raise exception 'FAIL: tabela filha recebeu workspace_id (proibido no Gate 13A)';
  end if;
  raise notice 'PASS structure: filhos sem workspace_id';

  insert into public.workspaces (id, name, code, is_active)
  values
    ('${WS1}', 'Gate13A WS1', 'G13A-WS1', true),
    ('${WS2}', 'Gate13A WS2', 'G13A-WS2', true),
    ('${WS_OFF}', 'Gate13A WS inactive', 'G13A-WS-OFF', false)
  on conflict (id) do update set is_active = excluded.is_active, name = excluded.name;

  insert into public.organization_workspace_links (organization_id, workspace_id, is_active)
  values
    ('${ALPHA_ORG}', '${WS1}', true),
    ('${ALPHA_ORG}', '${WS2}', true),
    ('${ALPHA_ORG}', '${WS_OFF}', true)
  on conflict (organization_id, workspace_id) do update set is_active = excluded.is_active;

  raise notice 'PASS structure setup fixtures';
end $$;
`;

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

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function runSql(sql, label) {
  const sqlPath = join(tmpdir(), `safestop-g13a-${Date.now()}-${label}.sql`);
  writeFileSync(sqlPath, sql, "utf8");
  const containerPath = `/tmp/smoke-g13a-${label}.sql`;
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

async function main() {
  console.log("=== Gate 13A structural ===");
  runSql(STRUCTURAL_SQL, "struct");

  const { apiUrl, anonKey } = loadSupabaseLocalEnv();
  const field = await signIn(apiUrl, anonKey, FIELD_EMAIL, LOCAL_PASSWORD);
  const supervisor = await signIn(apiUrl, anonKey, SUPERVISOR_EMAIL, LOCAL_PASSWORD);
  const platform = await signIn(apiUrl, anonKey, PLATFORM_EMAIL, LOCAL_PASSWORD);

  const fieldId = field.user.id;
  const supervisorId = supervisor.user.id;

  const setupAuthSql = `
\\set ON_ERROR_STOP on
do $$
declare
  v_field_member uuid;
  v_sup_member uuid;
  v_occ_legacy uuid;
  v_occ_ws1 uuid;
  v_occ_ws2 uuid;
begin
  select om.id into v_field_member
  from public.organization_members om
  where om.organization_id = '${ALPHA_ORG}' and om.profile_id = '${fieldId}' and om.is_active = true
  limit 1;

  select om.id into v_sup_member
  from public.organization_members om
  where om.organization_id = '${ALPHA_ORG}' and om.profile_id = '${supervisorId}' and om.is_active = true
  limit 1;

  if v_field_member is null or v_sup_member is null then
    raise exception 'members Alpha não encontrados para field/supervisor';
  end if;

  delete from public.workspace_memberships
  where workspace_id in ('${WS1}', '${WS2}', '${WS_OFF}');

  insert into public.workspace_memberships (
    organization_member_id, organization_id, workspace_id, is_active
  ) values
    (v_field_member, '${ALPHA_ORG}', '${WS1}', true),
    (v_sup_member, '${ALPHA_ORG}', '${WS2}', true);

  update public.organization_workspace_links
    set is_active = true
    where workspace_id in ('${WS1}', '${WS2}');

  select id into v_occ_legacy from public.occurrences
    where organization_id = '${ALPHA_ORG}'
      and id not in (
        'd13a0000-0000-4000-8000-000000000011',
        'd13a0000-0000-4000-8000-000000000012'
      )
    order by created_at asc
    limit 1;

  if v_occ_legacy is null then
    raise exception 'precisa de ao menos 1 occurrence Alpha no seed local';
  end if;

  -- Cria 2 occurrences temporárias para testes WS1/WS2 (seed local pode ter só 1).
  insert into public.occurrences (
    id, organization_id, area_id, public_code, title, task_description,
    location_description, condition_description, severity, status, created_by, workspace_id
  )
  select
    'd13a0000-0000-4000-8000-000000000011',
    o.organization_id, o.area_id, 'SS-G13A-000001', 'Gate13A WS1 fixture',
    'task', 'loc', 'cond', o.severity, 'PARALISACAO_PREVENTIVA', o.created_by, null
  from public.occurrences o where o.id = v_occ_legacy
  on conflict (id) do nothing;

  insert into public.occurrences (
    id, organization_id, area_id, public_code, title, task_description,
    location_description, condition_description, severity, status, created_by, workspace_id
  )
  select
    'd13a0000-0000-4000-8000-000000000012',
    o.organization_id, o.area_id, 'SS-G13A-000002', 'Gate13A WS2 fixture',
    'task', 'loc', 'cond', o.severity, 'PARALISACAO_PREVENTIVA', o.created_by, null
  from public.occurrences o where o.id = v_occ_legacy
  on conflict (id) do nothing;

  v_occ_ws1 := 'd13a0000-0000-4000-8000-000000000011';
  v_occ_ws2 := 'd13a0000-0000-4000-8000-000000000012';

  update public.occurrences set workspace_id = null where id = v_occ_legacy;
  update public.occurrences set workspace_id = '${WS1}' where id = v_occ_ws1;
  update public.occurrences set workspace_id = '${WS2}' where id = v_occ_ws2;

  raise notice 'EXPORT legacy=% ws1=% ws2=% field_member=% sup_member=%',
    v_occ_legacy, v_occ_ws1, v_occ_ws2, v_field_member, v_sup_member;
end $$;
`;

  const setupOut = runSql(setupAuthSql, "setup");
  const exportMatch = setupOut.match(
    /EXPORT legacy=([0-9a-f-]+) ws1=([0-9a-f-]+) ws2=([0-9a-f-]+) field_member=([0-9a-f-]+) sup_member=([0-9a-f-]+)/i,
  );
  assert(exportMatch, `não parseou EXPORT do setup: ${setupOut}`);
  const [, occLegacy, occWs1, occWs2, fieldMember] = exportMatch;
  console.log(`fixtures: legacy=${occLegacy} ws1=${occWs1} ws2=${occWs2}`);

  console.log("=== Gate 13A authorization (authenticated RPC) ===");

  assert(
    (await rpc(apiUrl, anonKey, field.access_token, "can_access_workspace", {
      p_workspace_id: WS1,
    })) === true,
    "FAIL #4 field deveria acessar WS1",
  );
  console.log("PASS #4 membership efetiva concede acesso");

  assert(
    (await rpc(apiUrl, anonKey, field.access_token, "can_access_workspace", {
      p_workspace_id: WS2,
    })) === false,
    "FAIL #5 field não deveria acessar WS2 sem membership",
  );
  console.log("PASS #5 org member sem workspace membership nega");

  runSql(
    `update public.workspace_memberships set is_active = false
     where organization_member_id = '${fieldMember}' and workspace_id = '${WS1}';`,
    "inactive-wm",
  );
  assert(
    (await rpc(apiUrl, anonKey, field.access_token, "can_access_workspace", {
      p_workspace_id: WS1,
    })) === false,
    "FAIL #6 membership inativa deveria negar",
  );
  runSql(
    `update public.workspace_memberships set is_active = true
     where organization_member_id = '${fieldMember}' and workspace_id = '${WS1}';`,
    "reactivate-wm",
  );
  console.log("PASS #6 membership inativa nega");

  runSql(
    `update public.organization_members set is_active = false where id = '${fieldMember}';`,
    "inactive-om",
  );
  assert(
    (await rpc(apiUrl, anonKey, field.access_token, "can_access_workspace", {
      p_workspace_id: WS1,
    })) === false,
    "FAIL #7 org membership inativa deveria negar",
  );
  runSql(
    `update public.organization_members set is_active = true where id = '${fieldMember}';`,
    "reactivate-om",
  );
  console.log("PASS #7 organization membership inativa nega");

  runSql(
    `update public.organization_workspace_links set is_active = false
     where organization_id = '${ALPHA_ORG}' and workspace_id = '${WS1}';`,
    "inactive-link",
  );
  assert(
    (await rpc(apiUrl, anonKey, field.access_token, "can_access_workspace", {
      p_workspace_id: WS1,
    })) === false,
    "FAIL #8 link inativo deveria negar",
  );
  runSql(
    `update public.organization_workspace_links set is_active = true
     where organization_id = '${ALPHA_ORG}' and workspace_id = '${WS1}';`,
    "reactivate-link",
  );
  console.log("PASS #8 link inativo nega");

  assert(
    (await rpc(apiUrl, anonKey, field.access_token, "can_access_workspace", {
      p_workspace_id: WS_OFF,
    })) === false,
    "FAIL #9 workspace inativo deveria negar",
  );
  runSql(
    `insert into public.workspace_memberships (organization_member_id, organization_id, workspace_id, is_active)
     values ('${fieldMember}', '${ALPHA_ORG}', '${WS_OFF}', true)
     on conflict (organization_member_id, workspace_id) do update set is_active = true;`,
    "wm-inactive-ws",
  );
  assert(
    (await rpc(apiUrl, anonKey, field.access_token, "can_access_workspace", {
      p_workspace_id: WS_OFF,
    })) === false,
    "FAIL #9b membership em workspace inativo ainda deve negar",
  );
  console.log("PASS #9 workspace inativo nega");

  assert(
    (await rpc(apiUrl, anonKey, supervisor.access_token, "can_access_workspace", {
      p_workspace_id: WS1,
    })) === false,
    "FAIL #10 supervisor não deve acessar WS1",
  );
  console.log("PASS #10 membership de outro Workspace não amplia");

  assert(
    (await rpc(apiUrl, anonKey, platform.access_token, "can_access_workspace", {
      p_workspace_id: WS1,
    })) === true,
    "FAIL #11 platform admin deveria acessar via is_platform_admin",
  );
  console.log("PASS #11 platform admin bypass centralizado");

  assert(
    (await rpc(apiUrl, anonKey, field.access_token, "can_access_occurrence", {
      target_occurrence_id: occLegacy,
    })) === true,
    "FAIL #12 legado NULL deveria manter acesso org",
  );
  console.log("PASS #12 occurrence workspace_id NULL legado");

  assert(
    (await rpc(apiUrl, anonKey, field.access_token, "can_access_occurrence", {
      target_occurrence_id: occWs1,
    })) === true,
    "FAIL #13 field deveria acessar occ WS1",
  );
  assert(
    (await rpc(apiUrl, anonKey, field.access_token, "can_access_occurrence", {
      target_occurrence_id: occWs2,
    })) === false,
    "FAIL #13 field NÃO deveria acessar occ WS2",
  );
  console.log("PASS #13 occurrence com Workspace exige acesso efetivo");

  assert(
    (await rpc(apiUrl, anonKey, supervisor.access_token, "can_access_occurrence", {
      target_occurrence_id: occWs1,
    })) === false,
    "FAIL #14 IDOR cross-workspace: supervisor não deve acessar occ WS1",
  );
  console.log("PASS #14 IDOR cross-Workspace bloqueado");

  const wsRes = await fetch(`${apiUrl}/rest/v1/workspaces?id=eq.${WS1}&select=id,is_active`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${field.access_token}` },
  });
  const wsRows = await wsRes.json();
  assert(
    wsRes.ok && Array.isArray(wsRows) && wsRows.length === 1,
    `RLS SELECT workspace: ${JSON.stringify(wsRows)}`,
  );
  console.log("PASS RLS autenticada: member da org vê workspace linkado");

  const wsInsert = await fetch(`${apiUrl}/rest/v1/workspaces`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${field.access_token}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ name: "Should Fail", code: "G13A-DENY" }),
  });
  assert(!wsInsert.ok, `field não deveria INSERT workspace: ${wsInsert.status}`);
  console.log(`PASS RLS autenticada: non-admin INSERT workspace negado (${wsInsert.status})`);

  runSql(
    `
    update public.occurrences set workspace_id = null
      where id in ('${occLegacy}', '${occWs1}', '${occWs2}');
    delete from public.occurrences
      where id in ('${occWs1}', '${occWs2}');
    delete from public.workspace_memberships
      where workspace_id in ('${WS1}', '${WS2}', '${WS_OFF}');
    delete from public.organization_workspace_links
      where workspace_id in ('${WS1}', '${WS2}', '${WS_OFF}');
    delete from public.workspaces
      where id in ('${WS1}', '${WS2}', '${WS_OFF}');
    `,
    "cleanup",
  );

  console.log("ALL GATE 13A CHECKS PASSED");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
