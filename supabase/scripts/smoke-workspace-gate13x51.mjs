/**
 * Smoke Gate 13X.5.1 — participation_role + SELECT Contract-scoped.
 *
 * Fixtures usam IDs de seed (Alpha/Beta/Epsilon). As regras NÃO dependem
 * de nome de empresa, organization.type nem contractor_organization_id.
 *
 * Uso: node supabase/scripts/smoke-workspace-gate13x51.mjs
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
const EPSILON_ORG = "b0000000-0000-4000-8000-000000000006";
const FIELD_EMAIL = "qa-field@safestop.local";
const GESTOR_EMAIL = "qa-gestor@safestop.local";
const MULTI_EMAIL = "qa-multi@safestop.local";
const ANDAIME_EMAIL = "qa-emptyrole@safestop.local";

const WS1 = "d1351000-0000-4000-8000-000000000001";
const WS2 = "d1351000-0000-4000-8000-000000000002";
const CONTRACT_A = "d1351000-0000-4000-8000-000000000011";
const CONTRACT_WS2 = "d1351000-0000-4000-8000-000000000012";
const ASG_HYDRO = "d1351000-0000-4000-8000-000000000021";
const ASG_TUV = "d1351000-0000-4000-8000-000000000022";
const ASG_AND = "d1351000-0000-4000-8000-000000000023";
const ASG_WS2_HYDRO = "d1351000-0000-4000-8000-000000000024";
const EPSILON_MEMBER_ID = "c1351000-0000-4000-8000-000000000001";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function runSqlAsPostgres(sql, label) {
  const sqlPath = join(tmpdir(), `safestop-g13x51-${Date.now()}-${label}.sql`);
  writeFileSync(sqlPath, sql, "utf8");
  const containerPath = `/tmp/smoke-g13x51-${label}.sql`;
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

async function rest(apiUrl, anonKey, token, { method, path, body }) {
  const res = await fetch(`${apiUrl}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }
  return { ok: res.ok, status: res.status, body: json };
}

function idsOf(body) {
  return Array.isArray(body) ? body.map((row) => row.id) : [];
}

function writeCreatedRow(res) {
  return Boolean(res.ok && Array.isArray(res.body) && res.body.length > 0);
}

async function main() {
  const { apiUrl, anonKey } = loadSupabaseLocalEnv();
  const field = await signIn(apiUrl, anonKey, FIELD_EMAIL, LOCAL_PASSWORD);
  const gestor = await signIn(apiUrl, anonKey, GESTOR_EMAIL, LOCAL_PASSWORD);
  const multi = await signIn(apiUrl, anonKey, MULTI_EMAIL, LOCAL_PASSWORD);
  const andaime = await signIn(apiUrl, anonKey, ANDAIME_EMAIL, LOCAL_PASSWORD);

  const setupOut = runSqlAsPostgres(
    `
\\set ON_ERROR_STOP on
delete from public.contract_assignments
  where contract_id in ('${CONTRACT_A}','${CONTRACT_WS2}');
delete from public.contracts
  where id in ('${CONTRACT_A}','${CONTRACT_WS2}');
delete from public.workspace_memberships
  where workspace_id in ('${WS1}','${WS2}');
delete from public.organization_workspace_links
  where workspace_id in ('${WS1}','${WS2}');
delete from public.workspaces where id in ('${WS1}','${WS2}');
delete from public.member_roles
  where organization_member_id = '${EPSILON_MEMBER_ID}';
delete from public.organization_members
  where id = '${EPSILON_MEMBER_ID}';

do $$
declare
  v_field uuid;
  v_gestor uuid;
  v_multi_beta uuid;
  v_admin_role uuid;
begin
  select om.id into v_field from public.organization_members om
    where om.organization_id = '${ALPHA_ORG}' and om.profile_id = '${field.user.id}' and om.is_active;
  select om.id into v_gestor from public.organization_members om
    where om.organization_id = '${ALPHA_ORG}' and om.profile_id = '${gestor.user.id}' and om.is_active;
  select om.id into v_multi_beta from public.organization_members om
    where om.organization_id = '${BETA_ORG}' and om.profile_id = '${multi.user.id}' and om.is_active;
  select r.id into v_admin_role from public.roles r
    where r.name = 'Administrador da Empresa' and r.organization_id is null;

  if v_field is null or v_gestor is null or v_multi_beta is null or v_admin_role is null then
    raise exception 'Smoke 13X.5.1: members/role não encontrados';
  end if;

  insert into public.organization_members (
    id, organization_id, profile_id, membership_type, is_active
  ) values (
    '${EPSILON_MEMBER_ID}', '${EPSILON_ORG}', '${andaime.user.id}', 'CONTRACTOR', true
  );

  insert into public.member_roles (organization_member_id, role_id)
  values
    (v_gestor, v_admin_role),
    (v_multi_beta, v_admin_role),
    ('${EPSILON_MEMBER_ID}', v_admin_role)
  on conflict (organization_member_id, role_id) do nothing;

  insert into public.workspaces (id, name, code, owner_organization_id, is_active)
  values
    ('${WS1}', 'Ambiente 13X51 A', 'G13X51-A', '${ALPHA_ORG}', true),
    ('${WS2}', 'Ambiente 13X51 B', 'G13X51-B', '${ALPHA_ORG}', true);

  insert into public.organization_workspace_links (
    organization_id, workspace_id, is_active, participation_role
  ) values
    ('${ALPHA_ORG}', '${WS1}', true, null),
    ('${BETA_ORG}', '${WS1}', true, 'GERENCIADORA'),
    ('${EPSILON_ORG}', '${WS1}', true, 'CONTRATADA'),
    ('${ALPHA_ORG}', '${WS2}', true, null),
    ('${BETA_ORG}', '${WS2}', true, null);

  insert into public.workspace_memberships (
    organization_member_id, organization_id, workspace_id, is_active
  ) values
    (v_gestor, '${ALPHA_ORG}', '${WS1}', true),
    (v_field, '${ALPHA_ORG}', '${WS1}', true),
    (v_multi_beta, '${BETA_ORG}', '${WS1}', true),
    ('${EPSILON_MEMBER_ID}', '${EPSILON_ORG}', '${WS1}', true),
    (v_gestor, '${ALPHA_ORG}', '${WS2}', true),
    (v_multi_beta, '${BETA_ORG}', '${WS2}', true);

  insert into public.contracts (
    id, client_organization_id, contractor_organization_id, workspace_id,
    contract_number, name, starts_at, is_active
  ) values
    ('${CONTRACT_A}', '${ALPHA_ORG}', '${EPSILON_ORG}', '${WS1}',
     'G13X51-A', '13X.5.1 Contract A', now(), true),
    ('${CONTRACT_WS2}', '${ALPHA_ORG}', '${EPSILON_ORG}', '${WS2}',
     'G13X51-W2', '13X.5.1 Contract WS2', now(), true);

  insert into public.contract_assignments (
    id, organization_member_id, organization_id, contract_id, assignment_role, is_active
  ) values
    ('${ASG_HYDRO}', v_field, '${ALPHA_ORG}', '${CONTRACT_A}', 'FISCAL', true),
    ('${ASG_TUV}', v_multi_beta, '${BETA_ORG}', '${CONTRACT_A}', 'GERENTE', true),
    ('${ASG_AND}', '${EPSILON_MEMBER_ID}', '${EPSILON_ORG}', '${CONTRACT_A}', 'GESTOR', true),
    ('${ASG_WS2_HYDRO}', v_field, '${ALPHA_ORG}', '${CONTRACT_WS2}', 'FISCAL', true);

  raise notice 'EXPORT field=% gestor=% multi_beta=% admin_role=%',
    v_field, v_gestor, v_multi_beta, v_admin_role;
end $$;
`,
    "setup",
  );

  const exported = setupOut.match(
    /EXPORT field=([0-9a-f-]+) gestor=([0-9a-f-]+) multi_beta=([0-9a-f-]+) admin_role=([0-9a-f-]+)/i,
  );
  assert(exported, `EXPORT parse fail: ${setupOut}`);
  const [, fieldMember, gestorMember, multiBeta, adminRole] = exported;

  const hydroSelect = await rest(apiUrl, anonKey, gestor.access_token, {
    method: "GET",
    path: `contract_assignments?contract_id=eq.${CONTRACT_A}&select=id,organization_id,assignment_role`,
  });
  const hydroIds = idsOf(hydroSelect.body);
  assert(hydroSelect.ok, `Hydro SELECT ${JSON.stringify(hydroSelect)}`);
  assert(hydroIds.includes(ASG_HYDRO), "Hydro manager deve ver Fiscal da owner org");
  assert(hydroIds.includes(ASG_TUV), "Hydro manager deve ver assignment GERENCIADORA");
  assert(hydroIds.includes(ASG_AND), "Hydro manager deve ver assignment CONTRATADA");
  console.log("PASS Hydro owner manager SELECT vê os três assignments do Contract A");

  const tuvSelect = await rest(apiUrl, anonKey, multi.access_token, {
    method: "GET",
    path: `contract_assignments?contract_id=eq.${CONTRACT_A}&select=id,organization_id,assignment_role`,
  });
  const tuvIds = idsOf(tuvSelect.body);
  assert(tuvSelect.ok, `GERENCIADORA SELECT ${JSON.stringify(tuvSelect)}`);
  assert(tuvIds.includes(ASG_HYDRO) && tuvIds.includes(ASG_TUV) && tuvIds.includes(ASG_AND),
    `GERENCIADORA deve ver os três: ${JSON.stringify(tuvSelect.body)}`);
  console.log("PASS GERENCIADORA manager SELECT vê os três assignments do Contract A");

  const tuvInsert = await rest(apiUrl, anonKey, multi.access_token, {
    method: "POST",
    path: "contract_assignments",
    body: {
      organization_member_id: fieldMember,
      organization_id: ALPHA_ORG,
      contract_id: CONTRACT_A,
      assignment_role: "GERENTE",
    },
  });
  assert(!writeCreatedRow(tuvInsert), `WRITE INSERT cross-org criou row ${JSON.stringify(tuvInsert)}`);
  assert(
    tuvInsert.status === 403,
    `13X.5.1 INSERT cross-org esperado 403 RLS, obtido ${tuvInsert.status} ${JSON.stringify(tuvInsert.body)}`,
  );
  console.log("PASS GERENCIADORA INSERT assignment de outra org → 403");

  const tuvUpdate = await rest(apiUrl, anonKey, multi.access_token, {
    method: "PATCH",
    path: `contract_assignments?id=eq.${ASG_HYDRO}`,
    body: { is_active: false, revoked_at: new Date().toISOString() },
  });
  const stillActive = await rest(apiUrl, anonKey, gestor.access_token, {
    method: "GET",
    path: `contract_assignments?id=eq.${ASG_HYDRO}&select=id,is_active`,
  });
  assert(stillActive.body?.[0]?.is_active === true, `Hydro assignment não deve ter sido revogado: ${JSON.stringify(stillActive)}`);
  console.log("PASS GERENCIADORA UPDATE assignment de outra org → FORBIDDEN / sem efeito");

  const andSelect = await rest(apiUrl, anonKey, andaime.access_token, {
    method: "GET",
    path: `contract_assignments?contract_id=eq.${CONTRACT_A}&select=id,organization_id`,
  });
  const andIds = idsOf(andSelect.body);
  assert(andSelect.ok, `CONTRATADA SELECT ${JSON.stringify(andSelect)}`);
  assert(andIds.includes(ASG_AND), "CONTRATADA manager deve ver assignment da própria org");
  assert(!andIds.includes(ASG_HYDRO), "CONTRATADA não deve ver Fiscal da owner org");
  assert(!andIds.includes(ASG_TUV), "CONTRATADA não deve ver assignment GERENCIADORA");
  console.log("PASS CONTRATADA manager SELECT só a própria Organization");

  const fieldSelect = await rest(apiUrl, anonKey, field.access_token, {
    method: "GET",
    path: `contract_assignments?contract_id=eq.${CONTRACT_A}&select=id,organization_id`,
  });
  const fieldIds = idsOf(fieldSelect.body);
  assert(fieldSelect.ok, `Campo SELECT ${JSON.stringify(fieldSelect)}`);
  assert(fieldIds.includes(ASG_HYDRO), "Campo deve ver o próprio assignment ativo");
  assert(!fieldIds.includes(ASG_TUV) && !fieldIds.includes(ASG_AND),
    `Campo não deve ver outros: ${JSON.stringify(fieldSelect.body)}`);
  console.log("PASS Campo sem organization.manage só o próprio assignment ativo");

  const nullSelect = await rest(apiUrl, anonKey, multi.access_token, {
    method: "GET",
    path: `contract_assignments?id=eq.${ASG_WS2_HYDRO}&select=id,organization_id`,
  });
  const nullIds = idsOf(nullSelect.body);
  assert(nullSelect.ok, `NULL role SELECT ${JSON.stringify(nullSelect)}`);
  assert(!nullIds.includes(ASG_WS2_HYDRO),
    `participation_role NULL não concede visão global noutro WS: ${JSON.stringify(nullSelect.body)}`);
  console.log("PASS mesma org noutro Workspace sem GERENCIADORA não vê assignment alheio");

  runSqlAsPostgres(
    `
    delete from public.contract_assignments
      where contract_id in ('${CONTRACT_A}','${CONTRACT_WS2}');
    delete from public.member_roles
      where organization_member_id in ('${gestorMember}','${multiBeta}','${EPSILON_MEMBER_ID}')
        and role_id = '${adminRole}';
    delete from public.contracts
      where id in ('${CONTRACT_A}','${CONTRACT_WS2}');
    delete from public.workspace_memberships
      where workspace_id in ('${WS1}','${WS2}');
    delete from public.organization_workspace_links
      where workspace_id in ('${WS1}','${WS2}');
    delete from public.workspaces where id in ('${WS1}','${WS2}');
    delete from public.organization_members where id = '${EPSILON_MEMBER_ID}';
    `,
    "cleanup",
  );

  console.log("ALL GATE 13X.5.1 CHECKS PASSED");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
