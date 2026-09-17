/**
 * Smoke Gate 13X.2.3 — visibilidade OPERACIONAL de contracts (Create PP).
 *
 * Técnico TÜV (qa-multi / Beta HSE): occurrence.create, sem organization.manage.
 * Executora = Epsilon (stand-in de KW). Regras NÃO usam nome de empresa.
 *
 * Uso: node supabase/scripts/smoke-workspace-gate13x23.mjs
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

const WS1 = "d1323000-0000-4000-8000-000000000001";
const CONTRACT_A = "d1323000-0000-4000-8000-000000000011";
const CONTRACT_B = "d1323000-0000-4000-8000-000000000012";
const EPSILON_MEMBER_ID = "c1323000-0000-4000-8000-000000000001";
const GESTOR_BETA_MEMBER_ID = "c1323000-0000-4000-8000-000000000002";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function runSqlAsPostgres(sql, label) {
  const sqlPath = join(tmpdir(), `safestop-g13x23-${Date.now()}-${label}.sql`);
  writeFileSync(sqlPath, sql, "utf8");
  const containerPath = `/tmp/smoke-g13x23-${label}.sql`;
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
delete from public.contract_assignments where contract_id in ('${CONTRACT_A}','${CONTRACT_B}');
delete from public.contracts where id in ('${CONTRACT_A}','${CONTRACT_B}');
delete from public.workspace_memberships where workspace_id = '${WS1}';
delete from public.organization_workspace_links where workspace_id = '${WS1}';
delete from public.workspaces where id = '${WS1}';
delete from public.member_roles
  where organization_member_id in ('${EPSILON_MEMBER_ID}','${GESTOR_BETA_MEMBER_ID}');
delete from public.organization_members
  where id in ('${EPSILON_MEMBER_ID}','${GESTOR_BETA_MEMBER_ID}');

do $$
declare
  v_field uuid;
  v_gestor_alpha uuid;
  v_multi_beta uuid;
  v_gestor_role uuid;
begin
  select om.id into v_field from public.organization_members om
    where om.organization_id = '${ALPHA_ORG}' and om.profile_id = '${field.user.id}' and om.is_active;
  select om.id into v_gestor_alpha from public.organization_members om
    where om.organization_id = '${ALPHA_ORG}' and om.profile_id = '${gestor.user.id}' and om.is_active;
  select om.id into v_multi_beta from public.organization_members om
    where om.organization_id = '${BETA_ORG}' and om.profile_id = '${multi.user.id}' and om.is_active;
  select r.id into v_gestor_role from public.roles r
    where r.name = 'Gestor' and r.organization_id is null;

  if v_field is null or v_gestor_alpha is null or v_multi_beta is null or v_gestor_role is null then
    raise exception 'Smoke 13X.2.3: members/role não encontrados';
  end if;

  insert into public.organization_members (
    id, organization_id, profile_id, membership_type, is_active
  ) values
    ('${EPSILON_MEMBER_ID}', '${EPSILON_ORG}', '${andaime.user.id}', 'CONTRACTOR', true),
    ('${GESTOR_BETA_MEMBER_ID}', '${BETA_ORG}', '${gestor.user.id}', 'CONTRACTOR', true);

  insert into public.member_roles (organization_member_id, role_id)
  values ('${GESTOR_BETA_MEMBER_ID}', v_gestor_role)
  on conflict (organization_member_id, role_id) do nothing;

  insert into public.workspaces (id, name, code, owner_organization_id, is_active)
  values ('${WS1}', 'Ambiente 13X23', 'G13X23-A', '${ALPHA_ORG}', true);

  insert into public.organization_workspace_links (
    organization_id, workspace_id, is_active, participation_role
  ) values
    ('${ALPHA_ORG}', '${WS1}', true, null),
    ('${BETA_ORG}', '${WS1}', true, 'GERENCIADORA'),
    ('${EPSILON_ORG}', '${WS1}', true, 'CONTRATADA');

  insert into public.workspace_memberships (
    organization_member_id, organization_id, workspace_id, is_active
  ) values
    (v_field, '${ALPHA_ORG}', '${WS1}', true),
    (v_gestor_alpha, '${ALPHA_ORG}', '${WS1}', true),
    (v_multi_beta, '${BETA_ORG}', '${WS1}', true),
    ('${GESTOR_BETA_MEMBER_ID}', '${BETA_ORG}', '${WS1}', true),
    ('${EPSILON_MEMBER_ID}', '${EPSILON_ORG}', '${WS1}', true);

  insert into public.contracts (
    id, client_organization_id, contractor_organization_id, workspace_id,
    contract_number, name, starts_at, is_active
  ) values
    ('${CONTRACT_A}', '${ALPHA_ORG}', '${EPSILON_ORG}', '${WS1}',
     'G13X23-A', '13X.2.3 Hydro x executora', now(), true),
    ('${CONTRACT_B}', '${EPSILON_ORG}', '${DELTA_ORG}', '${WS1}',
     'G13X23-B', '13X.2.3 Contract B', now(), true);

  raise notice 'EXPORT field=% gestor_alpha=% multi_beta=% gestor_role=%',
    v_field, v_gestor_alpha, v_multi_beta, v_gestor_role;
end $$;
`,
    "setup",
  );

  const exported = setupOut.match(
    /EXPORT field=([0-9a-f-]+) gestor_alpha=([0-9a-f-]+) multi_beta=([0-9a-f-]+) gestor_role=([0-9a-f-]+)/i,
  );
  assert(exported, `EXPORT parse fail: ${setupOut}`);
  const [, fieldMember, gestorAlpha, multiBeta, gestorRole] = exported;

  const rpc = await rest(apiUrl, anonKey, multi.access_token, {
    method: "POST",
    path: "rpc/list_operational_workspace_contracts",
    body: { p_workspace_id: WS1 },
  });
  assert(rpc.ok && Array.isArray(rpc.body), `RPC técnico ${JSON.stringify(rpc)}`);
  const execRows = rpc.body.filter((row) => row.contractor_organization_id === EPSILON_ORG);
  assert(execRows.length >= 1, `N>=1 contract da executora: ${JSON.stringify(rpc.body)}`);
  assert(
    typeof execRows[0].contractor_organization_name === "string" &&
      execRows[0].contractor_organization_name.length > 0,
    `nome da executora nulo: ${JSON.stringify(execRows[0])}`,
  );
  assert(
    execRows.every((row) => row.contractor_organization_id !== BETA_ORG),
    "contractor_organization_id não pode ser a GERENCIADORA",
  );
  console.log("PASS Técnico GERENCIADORA RPC: executora visível, contractor ≠ org atuante");

  const kwMemberships = await rest(apiUrl, anonKey, multi.access_token, {
    method: "GET",
    path: `workspace_memberships?workspace_id=eq.${WS1}&organization_id=eq.${EPSILON_ORG}&select=id,organization_member_id`,
  });
  assert(kwMemberships.ok && Array.isArray(kwMemberships.body) && kwMemberships.body.length === 0,
    `Técnico não lista memberships da executora: ${JSON.stringify(kwMemberships)}`);
  console.log("PASS Técnico NÃO SELECT workspace_memberships da executora");

  const assignInsert = await rest(apiUrl, anonKey, multi.access_token, {
    method: "POST",
    path: "contract_assignments",
    body: {
      organization_member_id: fieldMember,
      organization_id: ALPHA_ORG,
      contract_id: CONTRACT_A,
      assignment_role: "FISCAL",
    },
  });
  assert(!writeCreatedRow(assignInsert) && assignInsert.status === 403,
    `INSERT assignment Hydro ${assignInsert.status} ${JSON.stringify(assignInsert.body)}`);
  console.log("PASS Técnico INSERT assignment Hydro → 403");

  const contractInsert = await rest(apiUrl, anonKey, multi.access_token, {
    method: "POST",
    path: "contracts",
    body: {
      client_organization_id: ALPHA_ORG,
      contractor_organization_id: EPSILON_ORG,
      workspace_id: WS1,
      contract_number: "G13X23-X",
      name: "não deve criar",
      starts_at: new Date().toISOString(),
    },
  });
  assert(!writeCreatedRow(contractInsert) && contractInsert.status === 403,
    `INSERT contracts ${contractInsert.status} ${JSON.stringify(contractInsert.body)}`);
  console.log("PASS Técnico INSERT contracts → 403");

  const contractUpdate = await rest(apiUrl, anonKey, multi.access_token, {
    method: "PATCH",
    path: `contracts?id=eq.${CONTRACT_A}`,
    body: { name: "HACK 13X23" },
  });
  const afterUpdate = await rest(apiUrl, anonKey, multi.access_token, {
    method: "GET",
    path: `contracts?id=eq.${CONTRACT_A}&select=id,name`,
  });
  assert(
    afterUpdate.body?.[0]?.name !== "HACK 13X23",
    `UPDATE contracts não deve persistir: ${JSON.stringify({ contractUpdate, afterUpdate })}`,
  );
  assert(
    contractUpdate.status === 403 ||
      (Array.isArray(contractUpdate.body) && contractUpdate.body.length === 0) ||
      contractUpdate.body == null,
    `UPDATE contracts esperado 403/vazio: ${contractUpdate.status} ${JSON.stringify(contractUpdate.body)}`,
  );
  console.log("PASS Técnico UPDATE contracts → 403 / sem efeito");

  const fieldContracts = await rest(apiUrl, anonKey, field.access_token, {
    method: "GET",
    path: `contracts?id=eq.${CONTRACT_A}&select=id,client_organization_id`,
  });
  assert(
    fieldContracts.ok && fieldContracts.body?.[0]?.id === CONTRACT_A,
    `Campo Hydro vê Contract A (client): ${JSON.stringify(fieldContracts)}`,
  );
  const fieldMemberships = await rest(apiUrl, anonKey, field.access_token, {
    method: "GET",
    path: `workspace_memberships?workspace_id=eq.${WS1}&select=organization_member_id,organization_id`,
  });
  const fieldMemberIds = Array.isArray(fieldMemberships.body)
    ? fieldMemberships.body.map((row) => row.organization_member_id)
    : [];
  assert(fieldMemberIds.length === 1 && fieldMemberIds[0] === fieldMember,
    `Campo não vira diretório 13X.5.4: ${JSON.stringify(fieldMemberships)}`);
  console.log("PASS Campo Hydro: Contract A (client) e só o próprio membership");

  const gestorRpc = await rest(apiUrl, anonKey, gestor.access_token, {
    method: "POST",
    path: "rpc/list_operational_workspace_contracts",
    body: { p_workspace_id: WS1 },
  });
  const gestorForbidden =
    !gestorRpc.ok &&
    (gestorRpc.status === 403 ||
      gestorRpc.status === 401 ||
      gestorRpc.status === 400) &&
    JSON.stringify(gestorRpc.body).includes("FORBIDDEN");
  assert(gestorForbidden, `GERENCIADORA sem create esperado FORBIDDEN: ${JSON.stringify(gestorRpc)}`);
  const gestorContractB = await rest(apiUrl, anonKey, gestor.access_token, {
    method: "GET",
    path: `contracts?id=eq.${CONTRACT_B}&select=id`,
  });
  const gestorBIds = Array.isArray(gestorContractB.body) ? gestorContractB.body.map((row) => row.id) : [];
  assert(!gestorBIds.includes(CONTRACT_B),
    `eixo operacional NÃO aplica sem occurrence.create: ${JSON.stringify(gestorContractB)}`);
  console.log("PASS GERENCIADORA sem occurrence.create: RPC FORBIDDEN; 13X.5.2 sem manage");

  runSqlAsPostgres(
    `
    delete from public.contract_assignments where contract_id in ('${CONTRACT_A}','${CONTRACT_B}');
    delete from public.contracts where id in ('${CONTRACT_A}','${CONTRACT_B}');
    delete from public.workspace_memberships where workspace_id = '${WS1}';
    delete from public.member_roles
      where organization_member_id in ('${EPSILON_MEMBER_ID}','${GESTOR_BETA_MEMBER_ID}')
        and role_id = '${gestorRole}';
    delete from public.organization_workspace_links where workspace_id = '${WS1}';
    delete from public.workspaces where id = '${WS1}';
    delete from public.organization_members
      where id in ('${EPSILON_MEMBER_ID}','${GESTOR_BETA_MEMBER_ID}');
    `,
    "cleanup",
  );

  console.log("ALL GATE 13X.2.3 CHECKS PASSED");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
