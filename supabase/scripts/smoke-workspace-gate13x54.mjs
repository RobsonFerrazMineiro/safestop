/**
 * Smoke Gate 13X.5.4 — SELECT de workspace_memberships colegas da mesma org.
 *
 * Uso: node supabase/scripts/smoke-workspace-gate13x54.mjs
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

const WS1 = "d1354000-0000-4000-8000-000000000001";
const EPSILON_MEMBER_ID = "c1354000-0000-4000-8000-000000000001";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function runSqlAsPostgres(sql, label) {
  const sqlPath = join(tmpdir(), `safestop-g13x54-${Date.now()}-${label}.sql`);
  writeFileSync(sqlPath, sql, "utf8");
  const containerPath = `/tmp/smoke-g13x54-${label}.sql`;
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

function orgsOf(body) {
  return Array.isArray(body) ? body.map((row) => row.organization_id) : [];
}

function memberIdsOf(body) {
  return Array.isArray(body) ? body.map((row) => row.organization_member_id) : [];
}

async function listWs1(apiUrl, anonKey, token) {
  return rest(apiUrl, anonKey, token, {
    method: "GET",
    path: `workspace_memberships?workspace_id=eq.${WS1}&select=id,organization_id,organization_member_id,is_active`,
  });
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
delete from public.workspace_memberships where workspace_id = '${WS1}';
delete from public.organization_workspace_links where workspace_id = '${WS1}';
delete from public.workspaces where id = '${WS1}';
delete from public.member_roles where organization_member_id = '${EPSILON_MEMBER_ID}';
delete from public.organization_members where id = '${EPSILON_MEMBER_ID}';

do $$
declare
  v_field uuid;
  v_gestor uuid;
  v_multi_beta uuid;
  v_empty_alpha uuid;
  v_admin_role uuid;
begin
  select om.id into v_field from public.organization_members om
    where om.organization_id = '${ALPHA_ORG}' and om.profile_id = '${field.user.id}' and om.is_active;
  select om.id into v_gestor from public.organization_members om
    where om.organization_id = '${ALPHA_ORG}' and om.profile_id = '${gestor.user.id}' and om.is_active;
  select om.id into v_multi_beta from public.organization_members om
    where om.organization_id = '${BETA_ORG}' and om.profile_id = '${multi.user.id}' and om.is_active;
  select om.id into v_empty_alpha from public.organization_members om
    where om.organization_id = '${ALPHA_ORG}' and om.profile_id = '${andaime.user.id}' and om.is_active;
  select r.id into v_admin_role from public.roles r
    where r.name = 'Administrador da Empresa' and r.organization_id is null;

  if v_field is null or v_gestor is null or v_multi_beta is null or v_empty_alpha is null or v_admin_role is null then
    raise exception 'Smoke 13X.5.4: members/role não encontrados';
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
  values ('${WS1}', 'Ambiente 13X54', 'G13X54-A', '${ALPHA_ORG}', true);

  insert into public.organization_workspace_links (
    organization_id, workspace_id, is_active, participation_role
  ) values
    ('${ALPHA_ORG}', '${WS1}', true, null),
    ('${BETA_ORG}', '${WS1}', true, 'GERENCIADORA'),
    ('${EPSILON_ORG}', '${WS1}', true, 'CONTRATADA');

  insert into public.workspace_memberships (
    organization_member_id, organization_id, workspace_id, is_active
  ) values
    (v_gestor, '${ALPHA_ORG}', '${WS1}', true),
    (v_field, '${ALPHA_ORG}', '${WS1}', true),
    (v_multi_beta, '${BETA_ORG}', '${WS1}', true),
    ('${EPSILON_MEMBER_ID}', '${EPSILON_ORG}', '${WS1}', true);

  raise notice 'EXPORT field=% gestor=% multi_beta=% empty_alpha=% admin_role=%',
    v_field, v_gestor, v_multi_beta, v_empty_alpha, v_admin_role;
end $$;
`,
    "setup",
  );

  const exported = setupOut.match(
    /EXPORT field=([0-9a-f-]+) gestor=([0-9a-f-]+) multi_beta=([0-9a-f-]+) empty_alpha=([0-9a-f-]+) admin_role=([0-9a-f-]+)/i,
  );
  assert(exported, `EXPORT parse fail: ${setupOut}`);
  const [, fieldMember, gestorMember, multiBeta, emptyAlpha, adminRole] = exported;

  const hydro = await listWs1(apiUrl, anonKey, gestor.access_token);
  const hydroOrgs = orgsOf(hydro.body);
  const hydroMembers = memberIdsOf(hydro.body);
  assert(hydro.ok, `Hydro SELECT ${JSON.stringify(hydro)}`);
  assert(hydroMembers.includes(gestorMember) && hydroMembers.includes(fieldMember),
    `Hydro manager deve ver colegas Hydro: ${JSON.stringify(hydro.body)}`);
  assert(hydroMembers.length >= 2, `Hydro N>=2, obtido ${hydroMembers.length}`);
  assert(!hydroOrgs.includes(BETA_ORG), "Owner NÃO lista memberships GERENCIADORA");
  assert(!hydroOrgs.includes(EPSILON_ORG), "Owner NÃO lista memberships CONTRATADA");
  assert(hydroOrgs.every((id) => id === ALPHA_ORG), "Hydro SELECT só a própria org");
  console.log("PASS Hydro manager: N Hydro no WS1; 0 Beta; 0 Epsilon (sem wildcard owner)");

  const gov = await listWs1(apiUrl, anonKey, multi.access_token);
  const govOrgs = orgsOf(gov.body);
  const govMembers = memberIdsOf(gov.body);
  assert(gov.ok, `GERENCIADORA SELECT ${JSON.stringify(gov)}`);
  assert(govMembers.includes(multiBeta), "GERENCIADORA deve ver membership da própria org");
  assert(!govOrgs.includes(ALPHA_ORG), "GERENCIADORA NÃO lista memberships Hydro");
  assert(!govOrgs.includes(EPSILON_ORG), "GERENCIADORA NÃO lista memberships CONTRATADA");
  assert(govOrgs.every((id) => id === BETA_ORG), "GERENCIADORA SELECT só a própria org");
  console.log("PASS GERENCIADORA: N Beta; 0 Hydro; 0 Epsilon (participation_role não amplia diretório)");

  const and = await listWs1(apiUrl, anonKey, andaime.access_token);
  const andOrgs = orgsOf(and.body);
  const andMembers = memberIdsOf(and.body);
  assert(and.ok, `CONTRATADA SELECT ${JSON.stringify(and)}`);
  assert(andMembers.includes(EPSILON_MEMBER_ID), "CONTRATADA manager deve ver a própria membership");
  assert(!andOrgs.includes(ALPHA_ORG), "CONTRATADA NÃO lista Hydro");
  assert(!andOrgs.includes(BETA_ORG), "CONTRATADA NÃO lista GERENCIADORA");
  assert(andOrgs.every((id) => id === EPSILON_ORG), "CONTRATADA SELECT só a própria org");
  console.log("PASS CONTRATADA manager: N Epsilon; 0 Hydro; 0 Beta");

  const campo = await listWs1(apiUrl, anonKey, field.access_token);
  const campoMembers = memberIdsOf(campo.body);
  const campoOrgs = orgsOf(campo.body);
  assert(campo.ok, `Campo SELECT ${JSON.stringify(campo)}`);
  assert(campoMembers.length === 1 && campoMembers[0] === fieldMember,
    `Campo só o próprio grant: ${JSON.stringify(campo.body)}`);
  assert(!campoMembers.includes(gestorMember), "Campo não vê outro Hydro");
  assert(campoOrgs.every((id) => id === ALPHA_ORG), "Campo não vê outras Organizations");
  console.log("PASS Campo Hydro sem manage: 1 row (si); 0 outros Hydro; 0 outras orgs");

  const insertJwt = await rest(apiUrl, anonKey, gestor.access_token, {
    method: "POST",
    path: "workspace_memberships",
    body: {
      organization_member_id: emptyAlpha,
      organization_id: ALPHA_ORG,
      workspace_id: WS1,
      is_active: true,
    },
  });
  assert(insertJwt.status === 403, `INSERT membership JWT esperado 403, obtido ${insertJwt.status} ${JSON.stringify(insertJwt.body)}`);
  console.log("PASS INSERT workspace_memberships por JWT manager → 403 (13B intacto)");

  runSqlAsPostgres(
    `
    delete from public.workspace_memberships where workspace_id = '${WS1}';
    delete from public.member_roles
      where organization_member_id in ('${gestorMember}','${multiBeta}','${EPSILON_MEMBER_ID}')
        and role_id = '${adminRole}';
    delete from public.organization_workspace_links where workspace_id = '${WS1}';
    delete from public.workspaces where id = '${WS1}';
    delete from public.organization_members where id = '${EPSILON_MEMBER_ID}';
    `,
    "cleanup",
  );

  console.log("ALL GATE 13X.5.4 CHECKS PASSED");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
