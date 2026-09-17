/**
 * Smoke Gate 13X.5.2 — SELECT de contracts para owner/GERENCIADORA no WS.
 *
 * Fixtures usam IDs de seed. Regras NÃO dependem de nome de empresa.
 *
 * Uso: node supabase/scripts/smoke-workspace-gate13x52.mjs
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
const DELTA_ORG = "b0000000-0000-4000-8000-000000000004";
const FIELD_EMAIL = "qa-field@safestop.local";
const GESTOR_EMAIL = "qa-gestor@safestop.local";
const MULTI_EMAIL = "qa-multi@safestop.local";
const ANDAIME_EMAIL = "qa-emptyrole@safestop.local";

const WS1 = "d1352000-0000-4000-8000-000000000001";
const WS2 = "d1352000-0000-4000-8000-000000000002";
const CONTRACT_A = "d1352000-0000-4000-8000-000000000011";
const CONTRACT_B = "d1352000-0000-4000-8000-000000000012";
const CONTRACT_WS2 = "d1352000-0000-4000-8000-000000000013";
const ASG_HYDRO = "d1352000-0000-4000-8000-000000000021";
const ASG_TUV = "d1352000-0000-4000-8000-000000000022";
const ASG_AND = "d1352000-0000-4000-8000-000000000023";
const ASG_WS2_HYDRO = "d1352000-0000-4000-8000-000000000024";
const EPSILON_MEMBER_ID = "c1352000-0000-4000-8000-000000000001";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function runSqlAsPostgres(sql, label) {
  const sqlPath = join(tmpdir(), `safestop-g13x52-${Date.now()}-${label}.sql`);
  writeFileSync(sqlPath, sql, "utf8");
  const containerPath = `/tmp/smoke-g13x52-${label}.sql`;
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

function isLegacyTrigger400(res) {
  const message = typeof res.body === "object" && res.body ? String(res.body.message ?? "") : "";
  return res.status === 400 && message.includes("workspace_id preenchido");
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
  where contract_id in ('${CONTRACT_A}','${CONTRACT_B}','${CONTRACT_WS2}');
delete from public.contracts
  where id in ('${CONTRACT_A}','${CONTRACT_B}','${CONTRACT_WS2}');
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
    raise exception 'Smoke 13X.5.2: members/role não encontrados';
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
    ('${WS1}', 'Ambiente 13X52 A', 'G13X52-A', '${ALPHA_ORG}', true),
    ('${WS2}', 'Ambiente 13X52 B', 'G13X52-B', '${ALPHA_ORG}', true);

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
     'G13X52-A', '13X.5.2 Contract A', now(), true),
    ('${CONTRACT_B}', '${EPSILON_ORG}', '${DELTA_ORG}', '${WS1}',
     'G13X52-B', '13X.5.2 Contract B (não-Hydro)', now(), true),
    ('${CONTRACT_WS2}', '${ALPHA_ORG}', '${EPSILON_ORG}', '${WS2}',
     'G13X52-W2', '13X.5.2 Contract WS2', now(), true);

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

  const hydroContract = await rest(apiUrl, anonKey, gestor.access_token, {
    method: "GET",
    path: `contracts?id=eq.${CONTRACT_A}&select=id,workspace_id`,
  });
  assert(
    hydroContract.ok && hydroContract.body?.[0]?.id === CONTRACT_A && hydroContract.body[0].workspace_id === WS1,
    `Hydro SELECT contract A ${JSON.stringify(hydroContract)}`,
  );
  console.log("PASS Hydro manager SELECT Contract A");

  const govContractA = await rest(apiUrl, anonKey, multi.access_token, {
    method: "GET",
    path: `contracts?id=eq.${CONTRACT_A}&select=id,workspace_id,contractor_organization_id`,
  });
  assert(
    govContractA.ok &&
      Array.isArray(govContractA.body) &&
      govContractA.body.length === 1 &&
      govContractA.body[0].id === CONTRACT_A &&
      govContractA.body[0].workspace_id === WS1,
    `GERENCIADORA SELECT Contract A ${JSON.stringify(govContractA)}`,
  );
  console.log("PASS GERENCIADORA SELECT Contract A (1 row, workspace_id visível)");

  const govContractB = await rest(apiUrl, anonKey, multi.access_token, {
    method: "GET",
    path: `contracts?id=eq.${CONTRACT_B}&select=id`,
  });
  assert(
    govContractB.ok && idsOf(govContractB.body).includes(CONTRACT_B),
    `GERENCIADORA SELECT Contract B (não é client/contractor) ${JSON.stringify(govContractB)}`,
  );
  console.log("PASS GERENCIADORA SELECT Contract B sem ser client/contractor");

  const andContractA = await rest(apiUrl, anonKey, andaime.access_token, {
    method: "GET",
    path: `contracts?id=eq.${CONTRACT_A}&select=id`,
  });
  assert(
    andContractA.ok && idsOf(andContractA.body).includes(CONTRACT_A),
    `CONTRATADA SELECT Contract A ${JSON.stringify(andContractA)}`,
  );
  console.log("PASS CONTRATADA SELECT Contract A (contractor)");

  const fieldWsContracts = await rest(apiUrl, anonKey, field.access_token, {
    method: "GET",
    path: `contracts?workspace_id=eq.${WS1}&select=id`,
  });
  const fieldContractIds = idsOf(fieldWsContracts.body);
  assert(fieldWsContracts.ok, `Campo SELECT contracts WS ${JSON.stringify(fieldWsContracts)}`);
  assert(fieldContractIds.includes(CONTRACT_A), "Campo pode ver Contract A como client (eixo existente)");
  assert(
    fieldContractIds.includes(CONTRACT_B),
    "Campo Hydro owner + occurrence.create vê Contract B via eixo operacional 13X.2.3 (não exige organization.manage)",
  );
  console.log("PASS Campo Hydro: client (A) + operacional owner/create (B); sem organization.manage");

  const hydroAssign = await rest(apiUrl, anonKey, gestor.access_token, {
    method: "GET",
    path: `contract_assignments?contract_id=eq.${CONTRACT_A}&select=id`,
  });
  const hydroAssignIds = idsOf(hydroAssign.body);
  assert(
    hydroAssign.ok &&
      hydroAssignIds.includes(ASG_HYDRO) &&
      hydroAssignIds.includes(ASG_TUV) &&
      hydroAssignIds.includes(ASG_AND),
    `13X.5.1 Hydro SELECT assignments ${JSON.stringify(hydroAssign)}`,
  );
  const govAssign = await rest(apiUrl, anonKey, multi.access_token, {
    method: "GET",
    path: `contract_assignments?contract_id=eq.${CONTRACT_A}&select=id`,
  });
  const govAssignIds = idsOf(govAssign.body);
  assert(
    govAssign.ok &&
      govAssignIds.includes(ASG_HYDRO) &&
      govAssignIds.includes(ASG_TUV) &&
      govAssignIds.includes(ASG_AND),
    `13X.5.1 GERENCIADORA SELECT assignments ${JSON.stringify(govAssign)}`,
  );
  const andAssign = await rest(apiUrl, anonKey, andaime.access_token, {
    method: "GET",
    path: `contract_assignments?contract_id=eq.${CONTRACT_A}&select=id`,
  });
  const andAssignIds = idsOf(andAssign.body);
  assert(andAssignIds.includes(ASG_AND) && !andAssignIds.includes(ASG_HYDRO) && !andAssignIds.includes(ASG_TUV),
    `13X.5.1 CONTRATADA SELECT assignments ${JSON.stringify(andAssign)}`);
  console.log("PASS regressão 13X.5.1 tabela SELECT assignments");

  const ownInsert = await rest(apiUrl, anonKey, multi.access_token, {
    method: "POST",
    path: "contract_assignments",
    body: {
      organization_member_id: multiBeta,
      organization_id: BETA_ORG,
      contract_id: CONTRACT_A,
      assignment_role: "GESTOR",
    },
  });
  assert(writeCreatedRow(ownInsert) && ownInsert.body[0].assignment_role === "GESTOR",
    `GERENCIADORA INSERT própria org ${JSON.stringify(ownInsert)}`);
  console.log("PASS GERENCIADORA INSERT member da própria org em Contract A");

  const crossInsert = await rest(apiUrl, anonKey, multi.access_token, {
    method: "POST",
    path: "contract_assignments",
    body: {
      organization_member_id: fieldMember,
      organization_id: ALPHA_ORG,
      contract_id: CONTRACT_A,
      assignment_role: "GERENTE",
    },
  });
  assert(!writeCreatedRow(crossInsert), `WRITE cross-org criou row: ${JSON.stringify(crossInsert)}`);
  assert(!isLegacyTrigger400(crossInsert), `NÃO 400 trigger legado: ${JSON.stringify(crossInsert)}`);
  assert(crossInsert.status === 403, `esperado 403 RLS, obtido ${crossInsert.status} ${JSON.stringify(crossInsert.body)}`);
  console.log("PASS GERENCIADORA INSERT member Hydro → 403 RLS (não 400 legado)");

  runSqlAsPostgres(
    `
    delete from public.contract_assignments
      where contract_id in ('${CONTRACT_A}','${CONTRACT_B}','${CONTRACT_WS2}');
    delete from public.member_roles
      where organization_member_id in ('${gestorMember}','${multiBeta}','${EPSILON_MEMBER_ID}')
        and role_id = '${adminRole}';
    delete from public.contracts
      where id in ('${CONTRACT_A}','${CONTRACT_B}','${CONTRACT_WS2}');
    delete from public.workspace_memberships
      where workspace_id in ('${WS1}','${WS2}');
    delete from public.organization_workspace_links
      where workspace_id in ('${WS1}','${WS2}');
    delete from public.workspaces where id in ('${WS1}','${WS2}');
    delete from public.organization_members where id = '${EPSILON_MEMBER_ID}';
    `,
    "cleanup",
  );

  console.log("ALL GATE 13X.5.2 CHECKS PASSED");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
