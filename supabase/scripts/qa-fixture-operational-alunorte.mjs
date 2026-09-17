/**
 * Fixture QA operacional — Hydro Alunorte (LOCAL only).
 *
 * Labels (Hydro, TÜV, …) não autorizam.
 * Uso: node supabase/scripts/qa-fixture-operational-alunorte.mjs
 *
 * Mapeamento cargo PO → RBAC existente (nenhum papel novo):
 *   ADM                    → Administrador da Empresa
 *   Gerente de HSE         → Liderança HSE
 *   Supervisor de HSE      → Supervisor HSE
 *   Técnico de Segurança   → HSE de Campo
 *   Fiscal de contrato     → Fiscal do Contrato
 *   Supervisor de contrato → Supervisor HSE
 *   Gerente de contrato    → Gestor
 *   Gerente de Área        → Gestor
 *   Preposto               → Liderança da Contratada
 *   Supervisor (contratada)→ Supervisor HSE
 *   Encarregado            → HSE de Campo
 *
 * assignment_role (catálogo 13X.0): FISCAL | GERENTE | GESTOR
 *   Fiscal de contrato     → FISCAL
 *   Supervisor de contrato / Supervisor HSE gerenciadora → GERENTE
 *   Gerente de contrato / Preposto → GESTOR
 *
 * Associação formal pessoa × área: NÃO persistida.
 *   organization_contacts.area_id existe para roteamento de comunicação,
 *   não é o conceito de "Gerente de Área" da homologação 13X.5.
 */
import { execFileSync, spawnSync } from "node:child_process";
import { writeFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { loadSupabaseLocalEnv } from "./_local-env.mjs";

const CONTAINER = process.env.SAFESTOP_DB_CONTAINER ?? "supabase_db_safestop";
const PASSWORD = "SafeStop-QA-Local-2026";

const ORG = {
  hydro: "b141f000-0000-4000-8000-000000000001",
  tuv: "b141f000-0000-4000-8000-000000000003",
  arcadis: "b141f000-0000-4000-8000-000000000004",
  kw: "b141f000-0000-4000-8000-000000000011",
  set: "b141f000-0000-4000-8000-000000000012",
  reflamax: "b141f000-0000-4000-8000-000000000013",
  superus: "b141f000-0000-4000-8000-000000000014",
};

const WS = "d141f000-0000-4000-8000-000000000001";

const CONTRACT = {
  c01: "d141f000-0000-4000-8000-000000000011",
  c02: "d141f000-0000-4000-8000-000000000012",
  c03: "d141f000-0000-4000-8000-000000000013",
  c04: "d141f000-0000-4000-8000-000000000014",
  c05: "d141f000-0000-4000-8000-000000000015",
};

const UNIT = "e141f000-0000-4000-8000-000000000001";

const AREA = {
  clarificacao: "f141f000-0000-4000-8000-000000000001",
  precipitacao: "f141f000-0000-4000-8000-000000000002",
  calcinacao: "f141f000-0000-4000-8000-000000000003",
  utilidades: "f141f000-0000-4000-8000-000000000004",
};

const RBAC = {
  admin: "Administrador da Empresa",
  hseLeadership: "Liderança HSE",
  hseSupervisor: "Supervisor HSE",
  field: "HSE de Campo",
  fiscal: "Fiscal do Contrato",
  gestor: "Gestor",
  contractorLead: "Liderança da Contratada",
};

function uid(n) {
  return `a141f000-0000-4000-8000-${String(n).padStart(12, "0")}`;
}

function memberId(userId) {
  return userId.replace(/^a141f000/, "c141f000");
}

function contractorPeople(prefix, label, org, base) {
  return [
    { id: uid(base), email: `${prefix}.admin@safestop.local`, name: `${label} Admin`, org, rbac: RBAC.admin },
    { id: uid(base + 1), email: `${prefix}.preposto@safestop.local`, name: `${label} Preposto`, org, rbac: RBAC.contractorLead },
    { id: uid(base + 2), email: `${prefix}.supervisor@safestop.local`, name: `${label} Supervisor`, org, rbac: RBAC.hseSupervisor },
    { id: uid(base + 3), email: `${prefix}.encarregado@safestop.local`, name: `${label} Encarregado`, org, rbac: RBAC.field },
    { id: uid(base + 4), email: `${prefix}.hse.supervisor@safestop.local`, name: `${label} Supervisor HSE`, org, rbac: RBAC.hseSupervisor },
    { id: uid(base + 5), email: `${prefix}.safety@safestop.local`, name: `${label} Técnico de Segurança`, org, rbac: RBAC.field },
  ];
}

const USERS = [
  { id: uid(101), email: "hydro.admin@safestop.local", name: "Hydro ADM", org: ORG.hydro, rbac: RBAC.admin },
  { id: uid(102), email: "hydro.hse.manager@safestop.local", name: "Hydro Gerente de HSE", org: ORG.hydro, rbac: RBAC.hseLeadership },
  { id: uid(103), email: "hydro.hse.supervisor@safestop.local", name: "Hydro Supervisor de HSE", org: ORG.hydro, rbac: RBAC.hseSupervisor },
  { id: uid(104), email: "hydro.safety@safestop.local", name: "Hydro Técnico de Segurança", org: ORG.hydro, rbac: RBAC.field },
  { id: uid(105), email: "hydro.fiscal1@safestop.local", name: "Fiscal Hydro A", org: ORG.hydro, rbac: RBAC.fiscal },
  { id: uid(106), email: "hydro.fiscal2@safestop.local", name: "Fiscal Hydro B", org: ORG.hydro, rbac: RBAC.fiscal },
  { id: uid(107), email: "hydro.supervisor1@safestop.local", name: "Supervisor Hydro A", org: ORG.hydro, rbac: RBAC.hseSupervisor },
  { id: uid(108), email: "hydro.supervisor2@safestop.local", name: "Supervisor Hydro B", org: ORG.hydro, rbac: RBAC.hseSupervisor },
  { id: uid(109), email: "hydro.gerente1@safestop.local", name: "Gerente Hydro A", org: ORG.hydro, rbac: RBAC.gestor },
  { id: uid(110), email: "hydro.gerente2@safestop.local", name: "Gerente Hydro B", org: ORG.hydro, rbac: RBAC.gestor },
  { id: uid(111), email: "hydro.area1@safestop.local", name: "Gerente de Área A (Clarificação)", org: ORG.hydro, rbac: RBAC.gestor },
  { id: uid(112), email: "hydro.area2@safestop.local", name: "Gerente de Área B (Calcinação)", org: ORG.hydro, rbac: RBAC.gestor },
  { id: uid(201), email: "tuv.admin@safestop.local", name: "TÜV Admin", org: ORG.tuv, rbac: RBAC.admin },
  { id: uid(202), email: "tuv.supervisor@safestop.local", name: "TÜV Supervisor HSE", org: ORG.tuv, rbac: RBAC.hseSupervisor },
  { id: uid(203), email: "tuv.safety@safestop.local", name: "TÜV Técnico de Segurança", org: ORG.tuv, rbac: RBAC.field },
  { id: uid(211), email: "arcadis.admin@safestop.local", name: "Arcadis Admin", org: ORG.arcadis, rbac: RBAC.admin },
  { id: uid(212), email: "arcadis.supervisor@safestop.local", name: "Arcadis Supervisor HSE", org: ORG.arcadis, rbac: RBAC.hseSupervisor },
  { id: uid(213), email: "arcadis.safety@safestop.local", name: "Arcadis Técnico de Segurança", org: ORG.arcadis, rbac: RBAC.field },
  ...contractorPeople("kw", "KW", ORG.kw, 301),
  ...contractorPeople("set", "SET", ORG.set, 311),
  ...contractorPeople("reflamax", "Reflamax", ORG.reflamax, 321),
  ...contractorPeople("superus", "Superus", ORG.superus, 331),
];

const USER = Object.fromEntries(USERS.map((u) => [u.email, u]));

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function runSqlAsPostgres(sql, label) {
  const sqlPath = join(tmpdir(), `safestop-fx-op-${Date.now()}-${label}.sql`);
  const containerPath = `/tmp/qa-fx-op-${label}.sql`;
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
    (u) => `jsonb_build_object('id','${u.id}','email','${u.email}','full_name','${u.name}')`,
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

  insert into public.organizations (id, name, legal_name, document_number, organization_type, is_active)
  values
    ('${ORG.hydro}', 'Hydro', 'Hydro Alunorte QA Operacional Ltda', '72.000.000/0001-01', 'CLIENT', true),
    ('${ORG.tuv}', 'TÜV Rheinland', 'TÜV Rheinland QA Operacional Ltda', '72.000.000/0001-03', 'CLIENT', true),
    ('${ORG.arcadis}', 'Arcadis', 'Arcadis QA Operacional Ltda', '72.000.000/0001-04', 'CLIENT', true),
    ('${ORG.kw}', 'KW Brasil', 'KW Brasil QA Operacional Ltda', '72.000.000/0001-11', 'CONTRACTOR', true),
    ('${ORG.set}', 'SET Linings', 'SET Linings QA Operacional Ltda', '72.000.000/0001-12', 'CONTRACTOR', true),
    ('${ORG.reflamax}', 'Reflamax', 'Reflamax QA Operacional Ltda', '72.000.000/0001-13', 'CONTRACTOR', true),
    ('${ORG.superus}', 'Superus', 'Superus QA Operacional Ltda', '72.000.000/0001-14', 'CONTRACTOR', true)
  on conflict (id) do update set name = excluded.name, is_active = true;

  insert into public.workspaces (id, name, code, owner_organization_id, is_active)
  values ('${WS}', 'Hydro Alunorte', 'W-HYDRO-ALUNORTE', '${ORG.hydro}', true)
  on conflict (id) do update set name = excluded.name, owner_organization_id = excluded.owner_organization_id, is_active = true;

  insert into public.organization_workspace_links (organization_id, workspace_id, is_active, participation_role)
  values
    ('${ORG.hydro}', '${WS}', true, null),
    ('${ORG.tuv}', '${WS}', true, 'GERENCIADORA'),
    ('${ORG.arcadis}', '${WS}', true, 'GERENCIADORA'),
    ('${ORG.kw}', '${WS}', true, 'CONTRATADA'),
    ('${ORG.set}', '${WS}', true, 'CONTRATADA'),
    ('${ORG.reflamax}', '${WS}', true, 'CONTRATADA'),
    ('${ORG.superus}', '${WS}', true, 'CONTRATADA')
  on conflict (organization_id, workspace_id) do update set
    is_active = true,
    participation_role = excluded.participation_role;

  insert into public.units (id, organization_id, workspace_id, name, code, is_active)
  values ('${UNIT}', '${ORG.hydro}', '${WS}', 'Alunorte', 'ALU-OP', true)
  on conflict (id) do update set workspace_id = excluded.workspace_id, name = excluded.name, is_active = true;

  insert into public.areas (id, organization_id, unit_id, workspace_id, name, code, is_active)
  values
    ('${AREA.clarificacao}', '${ORG.hydro}', '${UNIT}', '${WS}', 'Clarificação', 'ALU-CLAR-OP', true),
    ('${AREA.precipitacao}', '${ORG.hydro}', '${UNIT}', '${WS}', 'Precipitação', 'ALU-PREC-OP', true),
    ('${AREA.calcinacao}', '${ORG.hydro}', '${UNIT}', '${WS}', 'Calcinação', 'ALU-CALC-OP', true),
    ('${AREA.utilidades}', '${ORG.hydro}', '${UNIT}', '${WS}', 'Utilidades', 'ALU-UTIL-OP', true)
  on conflict (id) do update set workspace_id = excluded.workspace_id, name = excluded.name, is_active = true;

  insert into public.contracts (
    id, client_organization_id, contractor_organization_id, workspace_id, unit_id,
    contract_number, name, starts_at, is_active
  ) values
    ('${CONTRACT.c01}', '${ORG.hydro}', '${ORG.kw}', '${WS}', '${UNIT}', 'C-01', 'Contract 01 — Hydro × KW Brasil', now(), true),
    ('${CONTRACT.c02}', '${ORG.hydro}', '${ORG.set}', '${WS}', '${UNIT}', 'C-02', 'Contract 02 — Hydro × SET Linings', now(), true),
    ('${CONTRACT.c03}', '${ORG.hydro}', '${ORG.reflamax}', '${WS}', '${UNIT}', 'C-03', 'Contract 03 — Hydro × Reflamax', now(), true),
    ('${CONTRACT.c04}', '${ORG.hydro}', '${ORG.superus}', '${WS}', '${UNIT}', 'C-04', 'Contract 04 — Hydro × Superus', now(), true),
    ('${CONTRACT.c05}', '${ORG.hydro}', '${ORG.kw}', '${WS}', '${UNIT}', 'C-05', 'Contract 05 — Hydro × KW Brasil', now(), true)
  on conflict (id) do update set workspace_id = excluded.workspace_id, is_active = true;
end
$$;
`;
}

function buildMembersSql() {
  const memberRows = USERS.map((u) => `('${memberId(u.id)}', '${u.org}', '${u.id}', 'INTERNAL', true)`).join(",\n    ");

  const roleInserts = USERS.map(
    (u) => `    insert into public.member_roles (organization_member_id, role_id)
    select '${memberId(u.id)}', r.id from public.roles r
    where r.name = '${u.rbac}' and r.organization_id is null
    on conflict do nothing;`,
  ).join("\n");

  const memberships = USERS.map((u) => `('${memberId(u.id)}', '${u.org}', '${WS}', true)`).join(",\n    ");

  const asg = (email, orgId, contractId, role) =>
    `('${memberId(USER[email].id)}', '${orgId}', '${contractId}', '${role}', true)`;

  return `
\\set ON_ERROR_STOP on

insert into public.organization_members (id, organization_id, profile_id, membership_type, is_active)
values
    ${memberRows}
on conflict (id) do update set is_active = true;

${roleInserts}

insert into public.workspace_memberships (organization_member_id, organization_id, workspace_id, is_active)
values
    ${memberships}
on conflict (organization_member_id, workspace_id) do update set is_active = true;

insert into public.contract_assignments (
  organization_member_id, organization_id, contract_id, assignment_role, is_active
) values
  ${asg("hydro.fiscal1@safestop.local", ORG.hydro, CONTRACT.c01, "FISCAL")},
  ${asg("hydro.supervisor1@safestop.local", ORG.hydro, CONTRACT.c01, "GERENTE")},
  ${asg("hydro.gerente1@safestop.local", ORG.hydro, CONTRACT.c01, "GESTOR")},
  ${asg("tuv.supervisor@safestop.local", ORG.tuv, CONTRACT.c01, "GERENTE")},
  ${asg("kw.preposto@safestop.local", ORG.kw, CONTRACT.c01, "GESTOR")},

  ${asg("hydro.fiscal2@safestop.local", ORG.hydro, CONTRACT.c02, "FISCAL")},
  ${asg("hydro.supervisor2@safestop.local", ORG.hydro, CONTRACT.c02, "GERENTE")},
  ${asg("hydro.gerente2@safestop.local", ORG.hydro, CONTRACT.c02, "GESTOR")},
  ${asg("arcadis.supervisor@safestop.local", ORG.arcadis, CONTRACT.c02, "GERENTE")},
  ${asg("set.preposto@safestop.local", ORG.set, CONTRACT.c02, "GESTOR")},

  ${asg("hydro.fiscal1@safestop.local", ORG.hydro, CONTRACT.c03, "FISCAL")},
  ${asg("tuv.safety@safestop.local", ORG.tuv, CONTRACT.c03, "GERENTE")},
  ${asg("reflamax.preposto@safestop.local", ORG.reflamax, CONTRACT.c03, "GESTOR")},

  ${asg("hydro.fiscal2@safestop.local", ORG.hydro, CONTRACT.c04, "FISCAL")},
  ${asg("arcadis.safety@safestop.local", ORG.arcadis, CONTRACT.c04, "GERENTE")},
  ${asg("superus.preposto@safestop.local", ORG.superus, CONTRACT.c04, "GESTOR")},

  ${asg("hydro.fiscal2@safestop.local", ORG.hydro, CONTRACT.c05, "FISCAL")},
  ${asg("tuv.safety@safestop.local", ORG.tuv, CONTRACT.c05, "GERENTE")},
  ${asg("kw.preposto@safestop.local", ORG.kw, CONTRACT.c05, "GESTOR")}
on conflict (organization_member_id, contract_id, assignment_role) do update set is_active = true;
`;
}

async function main() {
  const { apiUrl, anonKey } = loadSupabaseLocalEnv();
  if (!apiUrl.includes("127.0.0.1") && !apiUrl.includes("localhost")) {
    throw new Error(`Abortado: API_URL não é local (${apiUrl})`);
  }

  console.log("Aplicando fixture operacional Hydro Alunorte (SQL)...");
  runSqlAsPostgres(buildFixtureSql(), "orgs");
  runSqlAsPostgres(buildMembersSql(), "members");
  console.log("Fixture aplicada.");

  const hydroAdmin = await signIn(apiUrl, anonKey, "hydro.admin@safestop.local");
  const tuvAdmin = await signIn(apiUrl, anonKey, "tuv.admin@safestop.local");
  const kwAdmin = await signIn(apiUrl, anonKey, "kw.admin@safestop.local");
  const hydroFiscal = await signIn(apiUrl, anonKey, "hydro.fiscal1@safestop.local");

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

  await check("A Hydro admin vê 5 contracts do Ambiente", async () => {
    const { status, body } = await rest(apiUrl, anonKey, hydroAdmin.access_token, {
      method: "GET",
      path: `contracts?workspace_id=eq.${WS}&select=id,contract_number`,
    });
    assert(status === 200, `HTTP ${status}`);
    assert(ids(body).length === 5, `got ${ids(body).length}`);
  });

  await check("A Hydro admin assignments C-01 = Hydro+TÜV+KW", async () => {
    const { status, body } = await rest(apiUrl, anonKey, hydroAdmin.access_token, {
      method: "GET",
      path: `contract_assignments?contract_id=eq.${CONTRACT.c01}&select=organization_id,assignment_role`,
    });
    assert(status === 200, `HTTP ${status}`);
    const orgs = orgsOf(body);
    assert(orgs.includes(ORG.hydro) && orgs.includes(ORG.tuv) && orgs.includes(ORG.kw), `orgs=${orgs.join(",")}`);
  });

  await check("A Hydro admin memberships só Hydro", async () => {
    const { status, body } = await rest(apiUrl, anonKey, hydroAdmin.access_token, {
      method: "GET",
      path: `workspace_memberships?workspace_id=eq.${WS}&select=organization_id`,
    });
    assert(status === 200, `HTTP ${status}`);
    const orgs = orgsOf(body);
    assert(orgs.length === 1 && orgs[0] === ORG.hydro, `orgs=${orgs.join(",")}`);
  });

  await check("A Hydro admin INSERT próprio permitido", async () => {
    const { status, body } = await rest(apiUrl, anonKey, hydroAdmin.access_token, {
      method: "POST",
      path: "contract_assignments",
      body: {
        organization_member_id: memberId(USER["hydro.safety@safestop.local"].id),
        organization_id: ORG.hydro,
        contract_id: CONTRACT.c01,
        assignment_role: "FISCAL",
        is_active: true,
      },
    });
    assert(status === 201 || status === 200, `HTTP ${status} ${JSON.stringify(body)}`);
  });

  await check("A Hydro admin INSERT TÜV rejeitado", async () => {
    const { status } = await rest(apiUrl, anonKey, hydroAdmin.access_token, {
      method: "POST",
      path: "contract_assignments",
      body: {
        organization_member_id: memberId(USER["tuv.supervisor@safestop.local"].id),
        organization_id: ORG.tuv,
        contract_id: CONTRACT.c01,
        assignment_role: "FISCAL",
        is_active: true,
      },
    });
    assert(status === 403 || status === 401, `esperado 403, HTTP ${status}`);
  });

  await check("B TÜV admin vê contracts (GERENCIADORA)", async () => {
    const { status, body } = await rest(apiUrl, anonKey, tuvAdmin.access_token, {
      method: "GET",
      path: `contracts?workspace_id=eq.${WS}&select=id`,
    });
    assert(status === 200, `HTTP ${status}`);
    assert(ids(body).length === 5, `got ${ids(body).length}`);
  });

  await check("B TÜV admin memberships só TÜV", async () => {
    const { status, body } = await rest(apiUrl, anonKey, tuvAdmin.access_token, {
      method: "GET",
      path: `workspace_memberships?workspace_id=eq.${WS}&select=organization_id`,
    });
    assert(status === 200, `HTTP ${status}`);
    const orgs = orgsOf(body);
    assert(orgs.length === 1 && orgs[0] === ORG.tuv, `orgs=${orgs.join(",")}`);
  });

  await check("B TÜV admin INSERT próprio permitido", async () => {
    const { status, body } = await rest(apiUrl, anonKey, tuvAdmin.access_token, {
      method: "POST",
      path: "contract_assignments",
      body: {
        organization_member_id: memberId(USER["tuv.admin@safestop.local"].id),
        organization_id: ORG.tuv,
        contract_id: CONTRACT.c01,
        assignment_role: "FISCAL",
        is_active: true,
      },
    });
    assert(status === 201 || status === 200, `HTTP ${status} ${JSON.stringify(body)}`);
  });

  await check("B TÜV admin INSERT Hydro rejeitado", async () => {
    const { status } = await rest(apiUrl, anonKey, tuvAdmin.access_token, {
      method: "POST",
      path: "contract_assignments",
      body: {
        organization_member_id: memberId(USER["hydro.fiscal1@safestop.local"].id),
        organization_id: ORG.hydro,
        contract_id: CONTRACT.c01,
        assignment_role: "GESTOR",
        is_active: true,
      },
    });
    assert(status === 403 || status === 401, `esperado 403, HTTP ${status}`);
  });

  await check("C KW admin vê só C-01 e C-05", async () => {
    const { status, body } = await rest(apiUrl, anonKey, kwAdmin.access_token, {
      method: "GET",
      path: `contracts?workspace_id=eq.${WS}&select=id,contract_number,contractor_organization_id`,
    });
    assert(status === 200, `HTTP ${status}`);
    const got = Array.isArray(body) ? body : [];
    assert(got.every((row) => row.contractor_organization_id === ORG.kw), JSON.stringify(got));
    const numbers = got.map((row) => row.contract_number).sort();
    assert(JSON.stringify(numbers) === JSON.stringify(["C-01", "C-05"]), `numbers=${numbers.join(",")}`);
  });

  await check("C KW admin memberships só KW", async () => {
    const { status, body } = await rest(apiUrl, anonKey, kwAdmin.access_token, {
      method: "GET",
      path: `workspace_memberships?workspace_id=eq.${WS}&select=organization_id`,
    });
    assert(status === 200, `HTTP ${status}`);
    const orgs = orgsOf(body);
    assert(orgs.length === 1 && orgs[0] === ORG.kw, `orgs=${orgs.join(",")}`);
  });

  await check("C KW admin INSERT próprio permitido", async () => {
    const { status, body } = await rest(apiUrl, anonKey, kwAdmin.access_token, {
      method: "POST",
      path: "contract_assignments",
      body: {
        organization_member_id: memberId(USER["kw.encarregado@safestop.local"].id),
        organization_id: ORG.kw,
        contract_id: CONTRACT.c01,
        assignment_role: "FISCAL",
        is_active: true,
      },
    });
    assert(status === 201 || status === 200, `HTTP ${status} ${JSON.stringify(body)}`);
  });

  await check("C KW admin INSERT Hydro rejeitado", async () => {
    const { status } = await rest(apiUrl, anonKey, kwAdmin.access_token, {
      method: "POST",
      path: "contract_assignments",
      body: {
        organization_member_id: memberId(USER["hydro.fiscal1@safestop.local"].id),
        organization_id: ORG.hydro,
        contract_id: CONTRACT.c01,
        assignment_role: "FISCAL",
        is_active: true,
      },
    });
    assert(status === 403 || status === 401, `esperado 403, HTTP ${status}`);
  });

  await check("D campo sem organization.manage não administra", async () => {
    const { status } = await rest(apiUrl, anonKey, hydroFiscal.access_token, {
      method: "POST",
      path: "contract_assignments",
      body: {
        organization_member_id: memberId(USER["hydro.fiscal1@safestop.local"].id),
        organization_id: ORG.hydro,
        contract_id: CONTRACT.c02,
        assignment_role: "FISCAL",
        is_active: true,
      },
    });
    assert(status === 403 || status === 401, `esperado 403, HTTP ${status}`);
  });

  await check("C-01 e C-05 independentes; mesmo Preposto KW nos dois", async () => {
    const preposto = memberId(USER["kw.preposto@safestop.local"].id);
    const a = await rest(apiUrl, anonKey, hydroAdmin.access_token, {
      method: "GET",
      path: `contract_assignments?contract_id=eq.${CONTRACT.c01}&select=organization_member_id,assignment_role`,
    });
    const b = await rest(apiUrl, anonKey, hydroAdmin.access_token, {
      method: "GET",
      path: `contract_assignments?contract_id=eq.${CONTRACT.c05}&select=organization_member_id,assignment_role`,
    });
    assert(a.status === 200 && b.status === 200, `HTTP ${a.status}/${b.status}`);
    const aMembers = ids(a.body, "organization_member_id");
    const bMembers = ids(b.body, "organization_member_id");
    assert(aMembers.includes(preposto) && bMembers.includes(preposto), "preposto ausente");
    const fiscalA = memberId(USER["hydro.fiscal1@safestop.local"].id);
    const fiscalB = memberId(USER["hydro.fiscal2@safestop.local"].id);
    assert(aMembers.includes(fiscalA), "C-01 sem Fiscal A");
    assert(bMembers.includes(fiscalB), "C-05 sem Fiscal B");
    assert(!bMembers.includes(fiscalA), "C-05 herdou Fiscal A");
  });

  const failed = results.filter((row) => !row.ok);
  console.log("\n--- RESUMO FIXTURE OPERACIONAL ---");
  for (const row of results) {
    console.log(`${row.ok ? "PASS" : "FAIL"} ${row.name}`);
  }
  if (failed.length > 0) {
    console.error(`\n${failed.length} assert(s) falharam.`);
    process.exit(1);
  }
  console.log("\nTodos os asserts da fixture operacional passaram.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
