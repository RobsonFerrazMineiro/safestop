/**
 * SUPERSEDED pela fixture operacional Hydro Alunorte:
 *   node supabase/scripts/qa-fixture-operational-alunorte.mjs
 *
 * Fixture QA 13X.5 — multiempresa / multiworkspace (LOCAL only).
 *
 * Labels (Hydro, TÜV, …) não autorizam. Autorização = Organization × Workspace
 * × participation_role × membership × Contract × assignment × RBAC.
 *
 * Uso: node supabase/scripts/qa-fixture-13x5-multiempresa.mjs
 */
import { execFileSync, spawnSync } from "node:child_process";
import { writeFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { loadSupabaseLocalEnv } from "./_local-env.mjs";

const CONTAINER = process.env.SAFESTOP_DB_CONTAINER ?? "supabase_db_safestop";
const PASSWORD = "SafeStop-QA-Local-2026";

const ORG = {
  hydro: "b135f000-0000-4000-8000-000000000001",
  beta: "b135f000-0000-4000-8000-000000000002",
  tuv: "b135f000-0000-4000-8000-000000000003",
  arcadis: "b135f000-0000-4000-8000-000000000004",
  kw: "b135f000-0000-4000-8000-000000000011",
  omega: "b135f000-0000-4000-8000-000000000012",
  set: "b135f000-0000-4000-8000-000000000013",
  superus: "b135f000-0000-4000-8000-000000000014",
  reflamax: "b135f000-0000-4000-8000-000000000015",
  atlas: "b135f000-0000-4000-8000-000000000016",
};

const WS = {
  w1: "d135f000-0000-4000-8000-000000000001",
  w2: "d135f000-0000-4000-8000-000000000002",
};

const CONTRACT = {
  w1c1: "d135f000-0000-4000-8000-000000000011",
  w1c2: "d135f000-0000-4000-8000-000000000012",
  w1c3: "d135f000-0000-4000-8000-000000000013",
  w1c4: "d135f000-0000-4000-8000-000000000014",
  w2c1: "d135f000-0000-4000-8000-000000000021",
  w2c2: "d135f000-0000-4000-8000-000000000022",
  w2c3: "d135f000-0000-4000-8000-000000000023",
  w2c4: "d135f000-0000-4000-8000-000000000024",
};

const UNIT = {
  w1: "e135f000-0000-4000-8000-000000000001",
  w2: "e135f000-0000-4000-8000-000000000002",
};

const USERS = [
  { id: "a135f000-0000-4000-8000-000000000101", email: "hydro.manager@safestop.local", name: "Hydro Manager", org: ORG.hydro, kind: "manager" },
  { id: "a135f000-0000-4000-8000-000000000102", email: "hydro.field@safestop.local", name: "Hydro Field", org: ORG.hydro, kind: "field" },
  { id: "a135f000-0000-4000-8000-000000000103", email: "tuv.manager@safestop.local", name: "TUV Manager", org: ORG.tuv, kind: "manager" },
  { id: "a135f000-0000-4000-8000-000000000104", email: "tuv.hse@safestop.local", name: "TUV HSE", org: ORG.tuv, kind: "hse" },
  { id: "a135f000-0000-4000-8000-000000000105", email: "arcadis.manager@safestop.local", name: "Arcadis Manager", org: ORG.arcadis, kind: "manager" },
  { id: "a135f000-0000-4000-8000-000000000106", email: "arcadis.hse@safestop.local", name: "Arcadis HSE", org: ORG.arcadis, kind: "hse" },
  { id: "a135f000-0000-4000-8000-000000000107", email: "kw.manager@safestop.local", name: "KW Manager", org: ORG.kw, kind: "manager" },
  { id: "a135f000-0000-4000-8000-000000000108", email: "kw.field@safestop.local", name: "KW Field", org: ORG.kw, kind: "field" },
  { id: "a135f000-0000-4000-8000-000000000109", email: "omega.manager@safestop.local", name: "Omega Manager", org: ORG.omega, kind: "manager" },
  { id: "a135f000-0000-4000-8000-000000000110", email: "omega.field@safestop.local", name: "Omega Field", org: ORG.omega, kind: "field" },
  { id: "a135f000-0000-4000-8000-000000000111", email: "set.manager@safestop.local", name: "SET Manager", org: ORG.set, kind: "manager" },
  { id: "a135f000-0000-4000-8000-000000000112", email: "set.field@safestop.local", name: "SET Field", org: ORG.set, kind: "field" },
  { id: "a135f000-0000-4000-8000-000000000113", email: "superus.manager@safestop.local", name: "Superus Manager", org: ORG.superus, kind: "manager" },
  { id: "a135f000-0000-4000-8000-000000000114", email: "superus.field@safestop.local", name: "Superus Field", org: ORG.superus, kind: "field" },
  { id: "a135f000-0000-4000-8000-000000000115", email: "reflamax.manager@safestop.local", name: "Reflamax Manager", org: ORG.reflamax, kind: "manager" },
  { id: "a135f000-0000-4000-8000-000000000116", email: "reflamax.field@safestop.local", name: "Reflamax Field", org: ORG.reflamax, kind: "field" },
  { id: "a135f000-0000-4000-8000-000000000117", email: "atlas.manager@safestop.local", name: "Atlas Manager", org: ORG.atlas, kind: "manager" },
  { id: "a135f000-0000-4000-8000-000000000118", email: "atlas.field@safestop.local", name: "Atlas Field", org: ORG.atlas, kind: "field" },
  { id: "a135f000-0000-4000-8000-000000000119", email: "beta.manager@safestop.local", name: "Beta Manager", org: ORG.beta, kind: "manager" },
  { id: "a135f000-0000-4000-8000-000000000120", email: "beta.field@safestop.local", name: "Beta Field", org: ORG.beta, kind: "field" },
];

function memberId(userId) {
  return userId.replace(/^a135f000/, "c135f000");
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function runSqlAsPostgres(sql, label) {
  const sqlPath = join(tmpdir(), `safestop-fx13x5-${Date.now()}-${label}.sql`);
  const containerPath = `/tmp/qa-fx13x5-${label}.sql`;
  writeFileSync(sqlPath, sql, "utf8");
  try {
    execFileSync("docker", ["cp", sqlPath, `${CONTAINER}:${containerPath}`], { stdio: "inherit" });
    const result = spawnSync(
      "docker",
      ["exec", "-i", CONTAINER, "psql", "-U", "postgres", "-d", "postgres", "-v", "ON_ERROR_STOP=1", "-f", containerPath],
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

async function signIn(apiUrl, anonKey, email) {
  const res = await fetch(`${apiUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: anonKey, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: PASSWORD }),
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

function ids(body, key = "id") {
  return Array.isArray(body) ? body.map((row) => row[key]).sort() : [];
}

function orgsOf(body) {
  return Array.isArray(body) ? [...new Set(body.map((row) => row.organization_id))].sort() : [];
}

function buildFixtureSql() {
  const userJson = USERS.map(
    (u) =>
      `jsonb_build_object('id','${u.id}','email','${u.email}','full_name','${u.name}')`,
  ).join(",\n    ");

  return `
\\set ON_ERROR_STOP on

do $$
declare
  v_password text := '${PASSWORD}';
  v_users jsonb := jsonb_build_array(${userJson});
  v_user jsonb;
  v_user_id uuid;
  v_email text;
  v_full_name text;
  v_admin uuid;
  v_field uuid;
  v_hse uuid;
begin
  for v_user in select value from jsonb_array_elements(v_users)
  loop
    v_user_id := (v_user ->> 'id')::uuid;
    v_email := v_user ->> 'email';
    v_full_name := v_user ->> 'full_name';

    if not exists (select 1 from auth.users where id = v_user_id) then
      insert into auth.users (
        instance_id, id, aud, role, email, encrypted_password,
        email_confirmed_at, recovery_sent_at, last_sign_in_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
        confirmation_token, email_change, email_change_token_new, recovery_token
      ) values (
        '00000000-0000-0000-0000-000000000000',
        v_user_id, 'authenticated', 'authenticated', v_email,
        extensions.crypt(v_password, extensions.gen_salt('bf')),
        now(), now(), now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('full_name', v_full_name),
        now(), now(), '', '', '', ''
      );

      insert into auth.identities (
        id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
      ) values (
        v_user_id, v_user_id, v_user_id::text,
        jsonb_build_object('sub', v_user_id::text, 'email', v_email, 'email_verified', true, 'phone_verified', false),
        'email', now(), now(), now()
      );
    end if;
  end loop;

  select id into v_admin from public.roles where name = 'Administrador da Empresa' and organization_id is null;
  select id into v_field from public.roles where name = 'HSE de Campo' and organization_id is null;
  select id into v_hse from public.roles where name = 'Supervisor HSE' and organization_id is null;

  if v_admin is null or v_field is null or v_hse is null then
    raise exception 'Fixture 13X.5: papéis de sistema ausentes';
  end if;

  insert into public.organizations (id, name, legal_name, document_number, organization_type, is_active)
  values
    ('${ORG.hydro}', 'Hydro', 'Hydro Alunorte QA Ltda', '71.000.000/0001-01', 'CLIENT', true),
    ('${ORG.beta}', 'Beta Industrial', 'Beta Industrial QA Ltda', '71.000.000/0001-02', 'CLIENT', true),
    ('${ORG.tuv}', 'TÜV Rheinland', 'TÜV Rheinland QA Ltda', '71.000.000/0001-03', 'CLIENT', true),
    ('${ORG.arcadis}', 'Arcadis', 'Arcadis QA Ltda', '71.000.000/0001-04', 'CLIENT', true),
    ('${ORG.kw}', 'KW Brasil', 'KW Brasil QA Ltda', '71.000.000/0001-11', 'CONTRACTOR', true),
    ('${ORG.omega}', 'Omega', 'Omega Serviços QA Ltda', '71.000.000/0001-12', 'CONTRACTOR', true),
    ('${ORG.set}', 'SET Linings', 'SET Linings QA Ltda', '71.000.000/0001-13', 'CONTRACTOR', true),
    ('${ORG.superus}', 'Superus', 'Superus QA Ltda', '71.000.000/0001-14', 'CONTRACTOR', true),
    ('${ORG.reflamax}', 'Reflamax', 'Reflamax QA Ltda', '71.000.000/0001-15', 'CONTRACTOR', true),
    ('${ORG.atlas}', 'Atlas Andaimes', 'Atlas Andaimes QA Ltda', '71.000.000/0001-16', 'CONTRACTOR', true)
  on conflict (id) do update set name = excluded.name, is_active = true;

  insert into public.workspaces (id, name, code, owner_organization_id, is_active)
  values
    ('${WS.w1}', 'Hydro Alunorte', 'W1-HYDRO-ALUNORTE', '${ORG.hydro}', true),
    ('${WS.w2}', 'Planta Industrial Beta', 'W2-BETA-PLANTA', '${ORG.beta}', true)
  on conflict (id) do update set name = excluded.name, owner_organization_id = excluded.owner_organization_id, is_active = true;

  insert into public.organization_workspace_links (organization_id, workspace_id, is_active, participation_role)
  values
    ('${ORG.hydro}', '${WS.w1}', true, null),
    ('${ORG.tuv}', '${WS.w1}', true, 'GERENCIADORA'),
    ('${ORG.kw}', '${WS.w1}', true, 'CONTRATADA'),
    ('${ORG.set}', '${WS.w1}', true, 'CONTRATADA'),
    ('${ORG.reflamax}', '${WS.w1}', true, 'CONTRATADA'),
    ('${ORG.atlas}', '${WS.w1}', true, 'CONTRATADA'),
    ('${ORG.arcadis}', '${WS.w1}', true, null),
    ('${ORG.beta}', '${WS.w2}', true, null),
    ('${ORG.arcadis}', '${WS.w2}', true, 'GERENCIADORA'),
    ('${ORG.omega}', '${WS.w2}', true, 'CONTRATADA'),
    ('${ORG.superus}', '${WS.w2}', true, 'CONTRATADA'),
    ('${ORG.kw}', '${WS.w2}', true, 'CONTRATADA'),
    ('${ORG.reflamax}', '${WS.w2}', true, 'CONTRATADA'),
    ('${ORG.atlas}', '${WS.w2}', true, 'CONTRATADA'),
    ('${ORG.tuv}', '${WS.w2}', true, null)
  on conflict (organization_id, workspace_id) do update set
    is_active = true,
    participation_role = excluded.participation_role;

  insert into public.units (id, organization_id, workspace_id, name, code, is_active)
  values
    ('${UNIT.w1}', '${ORG.hydro}', '${WS.w1}', 'Alunorte', 'ALU-W1', true),
    ('${UNIT.w2}', '${ORG.beta}', '${WS.w2}', 'Planta Beta', 'BETA-W2', true)
  on conflict (id) do update set workspace_id = excluded.workspace_id, name = excluded.name, is_active = true;

  insert into public.areas (id, organization_id, unit_id, workspace_id, name, code, is_active)
  values
    ('f135f000-0000-4000-8000-000000000001', '${ORG.hydro}', '${UNIT.w1}', '${WS.w1}', 'Clarificação', 'W1-CLAR', true),
    ('f135f000-0000-4000-8000-000000000002', '${ORG.hydro}', '${UNIT.w1}', '${WS.w1}', 'Precipitação', 'W1-PREC', true),
    ('f135f000-0000-4000-8000-000000000003', '${ORG.hydro}', '${UNIT.w1}', '${WS.w1}', 'Calcinação', 'W1-CALC', true),
    ('f135f000-0000-4000-8000-000000000004', '${ORG.hydro}', '${UNIT.w1}', '${WS.w1}', 'Utilidades', 'W1-UTIL', true),
    ('f135f000-0000-4000-8000-000000000011', '${ORG.beta}', '${UNIT.w2}', '${WS.w2}', 'Produção', 'W2-PROD', true)
  on conflict (id) do update set workspace_id = excluded.workspace_id, name = excluded.name, is_active = true;

  insert into public.contracts (
    id, client_organization_id, contractor_organization_id, workspace_id, unit_id,
    contract_number, name, starts_at, is_active
  ) values
    ('${CONTRACT.w1c1}', '${ORG.hydro}', '${ORG.kw}', '${WS.w1}', '${UNIT.w1}', 'W1-C1', 'Hydro × KW Brasil', now(), true),
    ('${CONTRACT.w1c2}', '${ORG.hydro}', '${ORG.set}', '${WS.w1}', '${UNIT.w1}', 'W1-C2', 'Hydro × SET Linings', now(), true),
    ('${CONTRACT.w1c3}', '${ORG.hydro}', '${ORG.reflamax}', '${WS.w1}', '${UNIT.w1}', 'W1-C3', 'Hydro × Reflamax', now(), true),
    ('${CONTRACT.w1c4}', '${ORG.hydro}', '${ORG.atlas}', '${WS.w1}', '${UNIT.w1}', 'W1-C4', 'Hydro × Atlas Andaimes', now(), true),
    ('${CONTRACT.w2c1}', '${ORG.beta}', '${ORG.omega}', '${WS.w2}', '${UNIT.w2}', 'W2-C1', 'Beta × Omega', now(), true),
    ('${CONTRACT.w2c2}', '${ORG.beta}', '${ORG.superus}', '${WS.w2}', '${UNIT.w2}', 'W2-C2', 'Beta × Superus', now(), true),
    ('${CONTRACT.w2c3}', '${ORG.beta}', '${ORG.kw}', '${WS.w2}', '${UNIT.w2}', 'W2-C3', 'Beta × KW Brasil', now(), true),
    ('${CONTRACT.w2c4}', '${ORG.beta}', '${ORG.reflamax}', '${WS.w2}', '${UNIT.w2}', 'W2-C4', 'Beta × Reflamax', now(), true)
  on conflict (id) do update set workspace_id = excluded.workspace_id, is_active = true;
end
$$;
`;
}

function buildMembersSql() {
  const memberRows = USERS.map((u) => {
    const mid = memberId(u.id);
    return `('${mid}', '${u.org}', '${u.id}', 'INTERNAL', true)`;
  }).join(",\n    ");

  const roleCases = USERS.map((u) => {
    const mid = memberId(u.id);
    const role =
      u.kind === "manager" ? "Administrador da Empresa" : u.kind === "hse" ? "Supervisor HSE" : "HSE de Campo";
    return `    insert into public.member_roles (organization_member_id, role_id)
    select '${mid}', r.id from public.roles r
    where r.name = '${role}' and r.organization_id is null
    on conflict do nothing;`;
  }).join("\n");

  const w1Orgs = [ORG.hydro, ORG.tuv, ORG.kw, ORG.set, ORG.reflamax, ORG.atlas, ORG.arcadis];
  const w2Orgs = [ORG.beta, ORG.arcadis, ORG.omega, ORG.superus, ORG.kw, ORG.reflamax, ORG.atlas, ORG.tuv];

  const w1Memberships = USERS.filter((u) => w1Orgs.includes(u.org))
    .map((u) => `('${memberId(u.id)}', '${u.org}', '${WS.w1}', true)`)
    .join(",\n    ");
  const w2Memberships = USERS.filter((u) => w2Orgs.includes(u.org))
    .map((u) => `('${memberId(u.id)}', '${u.org}', '${WS.w2}', true)`)
    .join(",\n    ");

  const asg = (userId, orgId, contractId, role) =>
    `('${memberId(userId)}', '${orgId}', '${contractId}', '${role}', true)`;

  const hydroField = "a135f000-0000-4000-8000-000000000102";
  const tuvHse = "a135f000-0000-4000-8000-000000000104";
  const kwField = "a135f000-0000-4000-8000-000000000108";
  const setField = "a135f000-0000-4000-8000-000000000112";
  const reflamaxField = "a135f000-0000-4000-8000-000000000116";
  const atlasField = "a135f000-0000-4000-8000-000000000118";
  const betaField = "a135f000-0000-4000-8000-000000000120";
  const arcadisHse = "a135f000-0000-4000-8000-000000000106";
  const omegaField = "a135f000-0000-4000-8000-000000000110";
  const superusField = "a135f000-0000-4000-8000-000000000114";

  return `
\\set ON_ERROR_STOP on

insert into public.organization_members (id, organization_id, profile_id, membership_type, is_active)
values
    ${memberRows}
on conflict (id) do update set is_active = true;

${roleCases}

insert into public.workspace_memberships (organization_member_id, organization_id, workspace_id, is_active)
values
    ${w1Memberships},
    ${w2Memberships}
on conflict (organization_member_id, workspace_id) do update set is_active = true;

insert into public.contract_assignments (
  organization_member_id, organization_id, contract_id, assignment_role, is_active
) values
  ${asg(hydroField, ORG.hydro, CONTRACT.w1c1, "FISCAL")},
  ${asg(tuvHse, ORG.tuv, CONTRACT.w1c1, "GERENTE")},
  ${asg(kwField, ORG.kw, CONTRACT.w1c1, "GESTOR")},
  ${asg(hydroField, ORG.hydro, CONTRACT.w1c2, "FISCAL")},
  ${asg(tuvHse, ORG.tuv, CONTRACT.w1c2, "GERENTE")},
  ${asg(setField, ORG.set, CONTRACT.w1c2, "GESTOR")},
  ${asg(hydroField, ORG.hydro, CONTRACT.w1c3, "FISCAL")},
  ${asg(tuvHse, ORG.tuv, CONTRACT.w1c3, "GERENTE")},
  ${asg(reflamaxField, ORG.reflamax, CONTRACT.w1c3, "GESTOR")},
  ${asg(hydroField, ORG.hydro, CONTRACT.w1c4, "FISCAL")},
  ${asg(tuvHse, ORG.tuv, CONTRACT.w1c4, "GERENTE")},
  ${asg(atlasField, ORG.atlas, CONTRACT.w1c4, "GESTOR")},
  ${asg(betaField, ORG.beta, CONTRACT.w2c1, "FISCAL")},
  ${asg(arcadisHse, ORG.arcadis, CONTRACT.w2c1, "GERENTE")},
  ${asg(omegaField, ORG.omega, CONTRACT.w2c1, "GESTOR")},
  ${asg(betaField, ORG.beta, CONTRACT.w2c2, "FISCAL")},
  ${asg(arcadisHse, ORG.arcadis, CONTRACT.w2c2, "GERENTE")},
  ${asg(superusField, ORG.superus, CONTRACT.w2c2, "GESTOR")},
  ${asg(betaField, ORG.beta, CONTRACT.w2c3, "FISCAL")},
  ${asg(arcadisHse, ORG.arcadis, CONTRACT.w2c3, "GERENTE")},
  ${asg(kwField, ORG.kw, CONTRACT.w2c3, "GESTOR")},
  ${asg(betaField, ORG.beta, CONTRACT.w2c4, "FISCAL")},
  ${asg(arcadisHse, ORG.arcadis, CONTRACT.w2c4, "GERENTE")},
  ${asg(reflamaxField, ORG.reflamax, CONTRACT.w2c4, "GESTOR")}
on conflict (organization_member_id, contract_id, assignment_role) do update set is_active = true;
`;
}

async function main() {
  const { apiUrl, anonKey } = loadSupabaseLocalEnv();
  if (!apiUrl.includes("127.0.0.1") && !apiUrl.includes("localhost")) {
    throw new Error(`Abortado: API_URL não é local (${apiUrl})`);
  }

  console.log("Aplicando fixture 13X.5 multiempresa (SQL)...");
  runSqlAsPostgres(buildFixtureSql(), "orgs");
  runSqlAsPostgres(buildMembersSql(), "members");
  console.log("Fixture aplicada.");

  const hydroMgr = await signIn(apiUrl, anonKey, "hydro.manager@safestop.local");
  const tuvMgr = await signIn(apiUrl, anonKey, "tuv.manager@safestop.local");
  const atlasMgr = await signIn(apiUrl, anonKey, "atlas.manager@safestop.local");
  const betaMgr = await signIn(apiUrl, anonKey, "beta.manager@safestop.local");
  const arcadisMgr = await signIn(apiUrl, anonKey, "arcadis.manager@safestop.local");
  const kwMgr = await signIn(apiUrl, anonKey, "kw.manager@safestop.local");

  const results = [];

  async function check(name, fn) {
    try {
      await fn();
      results.push({ name, ok: true });
      console.log(`PASS ${name}`);
    } catch (error) {
      results.push({ name, ok: false, error: error instanceof Error ? error.message : String(error) });
      console.error(`FAIL ${name}: ${error instanceof Error ? error.message : error}`);
    }
  }

  await check("W1 hydro.manager vê W1-C1..C4", async () => {
    const { status, body } = await rest(apiUrl, anonKey, hydroMgr.access_token, {
      method: "GET",
      path: `contracts?workspace_id=eq.${WS.w1}&select=id,contract_number,workspace_id`,
    });
    assert(status === 200, `HTTP ${status}`);
    const got = ids(body).sort();
    const expected = [CONTRACT.w1c1, CONTRACT.w1c2, CONTRACT.w1c3, CONTRACT.w1c4].sort();
    assert(JSON.stringify(got) === JSON.stringify(expected), `contracts=${JSON.stringify(ids(body, "contract_number"))}`);
  });

  await check("W1 hydro.manager assignments W1-C1 = Hydro+TÜV+KW", async () => {
    const { status, body } = await rest(apiUrl, anonKey, hydroMgr.access_token, {
      method: "GET",
      path: `contract_assignments?contract_id=eq.${CONTRACT.w1c1}&select=organization_id,assignment_role`,
    });
    assert(status === 200, `HTTP ${status}`);
    const orgs = orgsOf(body);
    assert(orgs.includes(ORG.hydro) && orgs.includes(ORG.tuv) && orgs.includes(ORG.kw), `orgs=${orgs.join(",")}`);
    assert(orgs.length === 3, `expected 3 orgs, got ${orgs.length}`);
  });

  await check("W1 hydro.manager memberships só Hydro", async () => {
    const { status, body } = await rest(apiUrl, anonKey, hydroMgr.access_token, {
      method: "GET",
      path: `workspace_memberships?workspace_id=eq.${WS.w1}&select=organization_id,organization_member_id`,
    });
    assert(status === 200, `HTTP ${status}`);
    const orgs = orgsOf(body);
    assert(orgs.length === 1 && orgs[0] === ORG.hydro, `orgs=${orgs.join(",")}`);
    assert(!orgs.includes(ORG.tuv) && !orgs.includes(ORG.atlas), "vazou TÜV/Atlas");
  });

  await check("W1 tuv.manager vê contratos W1 (GERENCIADORA)", async () => {
    const { status, body } = await rest(apiUrl, anonKey, tuvMgr.access_token, {
      method: "GET",
      path: `contracts?workspace_id=eq.${WS.w1}&select=id`,
    });
    assert(status === 200, `HTTP ${status}`);
    assert(ids(body).length === 4, `got ${ids(body).length}`);
  });

  await check("W1 tuv.manager assignments W1-C1 visão Contract-scoped", async () => {
    const { status, body } = await rest(apiUrl, anonKey, tuvMgr.access_token, {
      method: "GET",
      path: `contract_assignments?contract_id=eq.${CONTRACT.w1c1}&select=organization_id`,
    });
    assert(status === 200, `HTTP ${status}`);
    const orgs = orgsOf(body);
    assert(orgs.includes(ORG.hydro) && orgs.includes(ORG.tuv) && orgs.includes(ORG.kw), `orgs=${orgs.join(",")}`);
  });

  await check("W1 tuv.manager memberships só TÜV", async () => {
    const { status, body } = await rest(apiUrl, anonKey, tuvMgr.access_token, {
      method: "GET",
      path: `workspace_memberships?workspace_id=eq.${WS.w1}&select=organization_id`,
    });
    assert(status === 200, `HTTP ${status}`);
    const orgs = orgsOf(body);
    assert(orgs.length === 1 && orgs[0] === ORG.tuv, `orgs=${orgs.join(",")}`);
  });

  await check("W1 tuv.manager INSERT assignment TÜV permitido", async () => {
    const tuvManagerMember = memberId("a135f000-0000-4000-8000-000000000103");
    const { status, body } = await rest(apiUrl, anonKey, tuvMgr.access_token, {
      method: "POST",
      path: "contract_assignments",
      body: {
        organization_member_id: tuvManagerMember,
        organization_id: ORG.tuv,
        contract_id: CONTRACT.w1c1,
        assignment_role: "FISCAL",
        is_active: true,
      },
    });
    assert(status === 201 || status === 200, `HTTP ${status} ${JSON.stringify(body)}`);
  });

  await check("W1 tuv.manager INSERT assignment Hydro rejeitado", async () => {
    const hydroFieldMember = memberId("a135f000-0000-4000-8000-000000000102");
    const { status } = await rest(apiUrl, anonKey, tuvMgr.access_token, {
      method: "POST",
      path: "contract_assignments",
      body: {
        organization_member_id: hydroFieldMember,
        organization_id: ORG.hydro,
        contract_id: CONTRACT.w1c1,
        assignment_role: "GESTOR",
        is_active: true,
      },
    });
    assert(status === 403 || status === 401 || status === 409, `esperado 403, HTTP ${status}`);
  });

  await check("W1 tuv.manager INSERT assignment Atlas rejeitado", async () => {
    const atlasFieldMember = memberId("a135f000-0000-4000-8000-000000000118");
    const { status } = await rest(apiUrl, anonKey, tuvMgr.access_token, {
      method: "POST",
      path: "contract_assignments",
      body: {
        organization_member_id: atlasFieldMember,
        organization_id: ORG.atlas,
        contract_id: CONTRACT.w1c1,
        assignment_role: "FISCAL",
        is_active: true,
      },
    });
    assert(status === 403 || status === 401, `esperado 403, HTTP ${status}`);
  });

  await check("W1 atlas.manager sem visão global de contratos", async () => {
    const { status, body } = await rest(apiUrl, anonKey, atlasMgr.access_token, {
      method: "GET",
      path: `contracts?workspace_id=eq.${WS.w1}&select=id,contractor_organization_id`,
    });
    assert(status === 200, `HTTP ${status}`);
    const got = Array.isArray(body) ? body : [];
    assert(got.every((row) => row.contractor_organization_id === ORG.atlas), `viu contratos não-Atlas: ${JSON.stringify(got)}`);
    assert(got.some((row) => row.id === CONTRACT.w1c4), "não viu W1-C4");
    assert(!got.some((row) => row.id === CONTRACT.w1c1), "vazou W1-C1");
  });

  await check("W1 atlas.manager memberships só Atlas", async () => {
    const { status, body } = await rest(apiUrl, anonKey, atlasMgr.access_token, {
      method: "GET",
      path: `workspace_memberships?workspace_id=eq.${WS.w1}&select=organization_id`,
    });
    assert(status === 200, `HTTP ${status}`);
    const orgs = orgsOf(body);
    assert(orgs.length === 1 && orgs[0] === ORG.atlas, `orgs=${orgs.join(",")}`);
  });

  await check("W2 beta.manager vê W2-C1..C4", async () => {
    const { status, body } = await rest(apiUrl, anonKey, betaMgr.access_token, {
      method: "GET",
      path: `contracts?workspace_id=eq.${WS.w2}&select=id`,
    });
    assert(status === 200, `HTTP ${status}`);
    assert(ids(body).length === 4, `got ${ids(body).length}`);
  });

  await check("W2 arcadis.manager GERENCIADORA vê 4 contratos W2", async () => {
    const { status, body } = await rest(apiUrl, anonKey, arcadisMgr.access_token, {
      method: "GET",
      path: `contracts?workspace_id=eq.${WS.w2}&select=id`,
    });
    assert(status === 200, `HTTP ${status}`);
    assert(ids(body).length === 4, `got ${ids(body).length}`);
  });

  await check("role não-global: tuv.manager NÃO vê W2 como GERENCIADORA", async () => {
    const { status, body } = await rest(apiUrl, anonKey, tuvMgr.access_token, {
      method: "GET",
      path: `contracts?workspace_id=eq.${WS.w2}&select=id,contractor_organization_id`,
    });
    assert(status === 200, `HTTP ${status}`);
    const got = Array.isArray(body) ? body : [];
    assert(got.length === 0, `TÜV viu ${got.length} contratos W2 com participation_role NULL`);
  });

  await check("role não-global: arcadis.manager NÃO vê W1 como GERENCIADORA", async () => {
    const { status, body } = await rest(apiUrl, anonKey, arcadisMgr.access_token, {
      method: "GET",
      path: `contracts?workspace_id=eq.${WS.w1}&select=id`,
    });
    assert(status === 200, `HTTP ${status}`);
    const got = Array.isArray(body) ? body : [];
    assert(got.length === 0, `Arcadis viu ${got.length} contratos W1 com participation_role NULL`);
  });

  await check("isolamento: hydro.manager não vê contratos W2", async () => {
    const { status, body } = await rest(apiUrl, anonKey, hydroMgr.access_token, {
      method: "GET",
      path: `contracts?workspace_id=eq.${WS.w2}&select=id`,
    });
    assert(status === 200, `HTTP ${status}`);
    assert(ids(body).length === 0, `Hydro viu W2: ${ids(body).join(",")}`);
  });

  await check("isolamento: beta.manager não vê contratos W1", async () => {
    const { status, body } = await rest(apiUrl, anonKey, betaMgr.access_token, {
      method: "GET",
      path: `contracts?workspace_id=eq.${WS.w1}&select=id`,
    });
    assert(status === 200, `HTTP ${status}`);
    assert(ids(body).length === 0, `Beta viu W1`);
  });

  await check("isolamento: kw.manager vê só contratos em que KW é contractor", async () => {
    const { status, body } = await rest(apiUrl, anonKey, kwMgr.access_token, {
      method: "GET",
      path: `contracts?or=(workspace_id.eq.${WS.w1},workspace_id.eq.${WS.w2})&select=id,workspace_id,contractor_organization_id`,
    });
    assert(status === 200, `HTTP ${status}`);
    const got = Array.isArray(body) ? body : [];
    assert(got.every((row) => row.contractor_organization_id === ORG.kw), JSON.stringify(got));
    const wss = [...new Set(got.map((row) => row.workspace_id))];
    assert(wss.includes(WS.w1) && wss.includes(WS.w2), `KW deveria ver W1-C1 e W2-C3; wss=${wss.join(",")}`);
  });

  await check("isolamento: atlas.manager memberships W2 só Atlas", async () => {
    const { status, body } = await rest(apiUrl, anonKey, atlasMgr.access_token, {
      method: "GET",
      path: `workspace_memberships?workspace_id=eq.${WS.w2}&select=organization_id`,
    });
    assert(status === 200, `HTTP ${status}`);
    const orgs = orgsOf(body);
    assert(orgs.length === 1 && orgs[0] === ORG.atlas, `orgs=${orgs.join(",")}`);
  });

  const failed = results.filter((row) => !row.ok);
  console.log("\n--- RESUMO FIXTURE/ASSERTS ---");
  for (const row of results) {
    console.log(`${row.ok ? "PASS" : "FAIL"} ${row.name}`);
  }
  if (failed.length > 0) {
    console.error(`\n${failed.length} assert(s) falharam.`);
    process.exit(1);
  }
  console.log("\nTodos os asserts da fixture passaram.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
