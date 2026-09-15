/**
 * Smoke Gate 13X.5 — administração JWT de contract_assignments.
 *
 * Uso: node supabase/scripts/smoke-workspace-gate13x5.mjs
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
const GAMMA_ORG = "b0000000-0000-4000-8000-000000000003";
const FIELD_EMAIL = "qa-field@safestop.local";
const GESTOR_EMAIL = "qa-gestor@safestop.local";
const MULTI_EMAIL = "qa-multi@safestop.local";

const WS = "d1350000-0000-4000-8000-000000000001";
const CONTRACT_A = "d1350000-0000-4000-8000-000000000011";
const CONTRACT_B = "d1350000-0000-4000-8000-000000000012";
const CONTRACT_LEGACY = "d1350000-0000-4000-8000-000000000013";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function runSqlAsPostgres(sql, label) {
  const sqlPath = join(tmpdir(), `safestop-g13x5-${Date.now()}-${label}.sql`);
  writeFileSync(sqlPath, sql, "utf8");
  const containerPath = `/tmp/smoke-g13x5-${label}.sql`;
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

async function main() {
  const { apiUrl, anonKey } = loadSupabaseLocalEnv();
  const field = await signIn(apiUrl, anonKey, FIELD_EMAIL, LOCAL_PASSWORD);
  const gestor = await signIn(apiUrl, anonKey, GESTOR_EMAIL, LOCAL_PASSWORD);
  const multi = await signIn(apiUrl, anonKey, MULTI_EMAIL, LOCAL_PASSWORD);

  const setupOut = runSqlAsPostgres(
    `
\\set ON_ERROR_STOP on
delete from public.contract_assignments
  where contract_id in ('${CONTRACT_A}','${CONTRACT_B}','${CONTRACT_LEGACY}');
delete from public.contracts
  where id in ('${CONTRACT_A}','${CONTRACT_B}','${CONTRACT_LEGACY}');
delete from public.workspace_memberships where workspace_id = '${WS}';
delete from public.organization_workspace_links where workspace_id = '${WS}';
delete from public.workspaces where id = '${WS}';

do $$
declare
  v_field uuid;
  v_gestor uuid;
  v_multi_beta uuid;
  v_multi_gamma uuid;
  v_admin_role uuid;
begin
  select om.id into v_field from public.organization_members om
    where om.organization_id = '${ALPHA_ORG}' and om.profile_id = '${field.user.id}' and om.is_active;
  select om.id into v_gestor from public.organization_members om
    where om.organization_id = '${ALPHA_ORG}' and om.profile_id = '${gestor.user.id}' and om.is_active;
  select om.id into v_multi_beta from public.organization_members om
    where om.organization_id = '${BETA_ORG}' and om.profile_id = '${multi.user.id}' and om.is_active;
  select om.id into v_multi_gamma from public.organization_members om
    where om.organization_id = '${GAMMA_ORG}' and om.profile_id = '${multi.user.id}' and om.is_active;
  select r.id into v_admin_role from public.roles r
    where r.name = 'Administrador da Empresa' and r.organization_id is null;

  if v_field is null or v_gestor is null or v_multi_beta is null or v_admin_role is null then
    raise exception 'Smoke 13X.5: members/role não encontrados';
  end if;

  insert into public.member_roles (organization_member_id, role_id)
  values (v_gestor, v_admin_role)
  on conflict (organization_member_id, role_id) do nothing;

  insert into public.workspaces (id, name, code, owner_organization_id, is_active)
  values ('${WS}', 'Hydro Alunorte 13X5', 'G13X5-WS', '${ALPHA_ORG}', true);

  insert into public.organization_workspace_links (organization_id, workspace_id, is_active)
  values ('${ALPHA_ORG}', '${WS}', true), ('${BETA_ORG}', '${WS}', true);

  insert into public.workspace_memberships (
    organization_member_id, organization_id, workspace_id, is_active
  ) values
    (v_gestor, '${ALPHA_ORG}', '${WS}', true),
    (v_field, '${ALPHA_ORG}', '${WS}', true),
    (v_multi_beta, '${BETA_ORG}', '${WS}', true);

  insert into public.contracts (
    id, client_organization_id, contractor_organization_id, workspace_id,
    contract_number, name, starts_at, is_active
  ) values
    ('${CONTRACT_A}', '${ALPHA_ORG}', '${BETA_ORG}', '${WS}',
     'G13X5-A', '13X.5 Contrato TÜV A', now(), true),
    ('${CONTRACT_B}', '${ALPHA_ORG}', '${BETA_ORG}', '${WS}',
     'G13X5-B', '13X.5 Contrato TÜV B', now(), true),
    ('${CONTRACT_LEGACY}', '${ALPHA_ORG}', '${BETA_ORG}', null,
     'G13X5-LEG', '13X.5 Contrato legado', now(), true);

  raise notice 'EXPORT field=% gestor=% multi_beta=% multi_gamma=% admin_role=%',
    v_field, v_gestor, v_multi_beta, v_multi_gamma, v_admin_role;
end $$;
`,
    "setup",
  );

  const exported = setupOut.match(
    /EXPORT field=([0-9a-f-]+) gestor=([0-9a-f-]+) multi_beta=([0-9a-f-]+) multi_gamma=([0-9a-f-]+) admin_role=([0-9a-f-]+)/i,
  );
  assert(exported, `EXPORT parse fail: ${setupOut}`);
  const [, fieldMember, gestorMember, multiBeta, multiGamma, adminRole] = exported;

  const n1 = await rest(apiUrl, anonKey, multi.access_token, {
    method: "POST",
    path: "contract_assignments",
    body: {
      organization_member_id: multiBeta,
      organization_id: BETA_ORG,
      contract_id: CONTRACT_A,
      assignment_role: "GESTOR",
    },
  });
  assert(n1.status === 403 || n1.status === 401, `N1 ${n1.status} ${JSON.stringify(n1.body)}`);
  console.log("PASS N1 qa-multi sem organization.manage");

  const a1 = await rest(apiUrl, anonKey, gestor.access_token, {
    method: "POST",
    path: "contract_assignments",
    body: {
      organization_member_id: fieldMember,
      organization_id: ALPHA_ORG,
      contract_id: CONTRACT_A,
      assignment_role: "FISCAL",
    },
  });
  assert(a1.ok && a1.body?.[0]?.assignment_role === "FISCAL", `A1 ${JSON.stringify(a1)}`);
  const fiscalId = a1.body[0].id;
  console.log("PASS A1 Fiscal Hydro → Contract TÜV (sem platform admin)");

  const a2a = await rest(apiUrl, anonKey, gestor.access_token, {
    method: "POST",
    path: "contract_assignments",
    body: {
      organization_member_id: fieldMember,
      organization_id: ALPHA_ORG,
      contract_id: CONTRACT_A,
      assignment_role: "GERENTE",
    },
  });
  const a2b = await rest(apiUrl, anonKey, gestor.access_token, {
    method: "POST",
    path: "contract_assignments",
    body: {
      organization_member_id: fieldMember,
      organization_id: ALPHA_ORG,
      contract_id: CONTRACT_B,
      assignment_role: "GERENTE",
    },
  });
  assert(a2a.ok && a2b.ok && a2a.body[0].id !== a2b.body[0].id, `A2 ${JSON.stringify({ a2a, a2b })}`);
  console.log("PASS A2 Gerente Hydro em dois contratos");

  runSqlAsPostgres(
    `
    insert into public.member_roles (organization_member_id, role_id)
    values ('${multiBeta}', '${adminRole}')
    on conflict (organization_member_id, role_id) do nothing;
    `,
    "grant-tuv-admin",
  );

  const a3 = await rest(apiUrl, anonKey, multi.access_token, {
    method: "POST",
    path: "contract_assignments",
    body: {
      organization_member_id: multiBeta,
      organization_id: BETA_ORG,
      contract_id: CONTRACT_A,
      assignment_role: "GESTOR",
    },
  });
  assert(a3.ok && a3.body?.[0]?.assignment_role === "GESTOR", `A3 ${JSON.stringify(a3)}`);
  console.log("PASS A3 TÜV manager → membro TÜV GESTOR no próprio contrato");

  const n2 = await rest(apiUrl, anonKey, multi.access_token, {
    method: "POST",
    path: "contract_assignments",
    body: {
      organization_member_id: fieldMember,
      organization_id: ALPHA_ORG,
      contract_id: CONTRACT_A,
      assignment_role: "GERENTE",
    },
  });
  assert(n2.status === 403, `N2 ${n2.status} ${JSON.stringify(n2.body)}`);
  console.log("PASS N2 TÜV manager não administra member Hydro");

  const s1 = await rest(apiUrl, anonKey, gestor.access_token, {
    method: "GET",
    path: `contract_assignments?contract_id=eq.${CONTRACT_A}&organization_id=eq.${ALPHA_ORG}&assignment_role=eq.FISCAL&select=id,assignment_role`,
  });
  assert(
    s1.ok && Array.isArray(s1.body) && s1.body.some((row) => row.id === fiscalId),
    `S1 ${JSON.stringify(s1)}`,
  );
  console.log("PASS S1 manager Hydro lista Fiscal Hydro no contrato TÜV");

  const s2 = await rest(apiUrl, anonKey, field.access_token, {
    method: "GET",
    path: `contract_assignments?id=eq.${fiscalId}&select=id,is_active`,
  });
  assert(s2.ok && s2.body?.[0]?.id === fiscalId, `S2 ${JSON.stringify(s2)}`);
  console.log("PASS S2 membro vê o próprio assignment ativo");

  const u1 = await rest(apiUrl, anonKey, gestor.access_token, {
    method: "PATCH",
    path: `contract_assignments?id=eq.${fiscalId}`,
    body: { is_active: false, revoked_at: new Date().toISOString() },
  });
  assert(u1.ok && u1.body?.[0]?.is_active === false, `U1 ${JSON.stringify(u1)}`);
  console.log("PASS U1 soft revoke");

  const l1jwt = await rest(apiUrl, anonKey, gestor.access_token, {
    method: "POST",
    path: "contract_assignments",
    body: {
      organization_member_id: fieldMember,
      organization_id: ALPHA_ORG,
      contract_id: CONTRACT_LEGACY,
      assignment_role: "FISCAL",
    },
  });
  assert(!l1jwt.ok, `L1 jwt ${l1jwt.status} ${JSON.stringify(l1jwt.body)}`);
  console.log("PASS L1 JWT contrato legado rejeitado");

  const l1pg = runSqlAsPostgres(
    `
    do $$
    begin
      begin
        insert into public.contract_assignments (
          organization_member_id, organization_id, contract_id, assignment_role
        ) values ('${fieldMember}', '${ALPHA_ORG}', '${CONTRACT_LEGACY}', 'FISCAL');
        raise exception 'FAIL L1 trigger';
      exception
        when others then
          if sqlerrm like '%workspace_id%' then
            raise notice 'PASS L1 trigger legado';
          else
            raise;
          end if;
      end;
    end $$;
    `,
    "l1-trigger",
  );
  assert(l1pg.includes("PASS L1 trigger legado"), l1pg);
  console.log("PASS L1 trigger postgres contrato legado");

  assert(multiGamma && multiGamma !== "null", "gamma member");
  const l2pg = runSqlAsPostgres(
    `
    do $$
    begin
      begin
        insert into public.contract_assignments (
          organization_member_id, organization_id, contract_id, assignment_role
        ) values ('${multiGamma}', '${GAMMA_ORG}', '${CONTRACT_A}', 'GESTOR');
        raise exception 'FAIL L2 trigger';
      exception
        when others then
          if sqlerrm like '%nao participa%' or sqlerrm like '%não participa%' then
            raise notice 'PASS L2 trigger sem link';
          else
            raise;
          end if;
      end;
    end $$;
    `,
    "l2-trigger",
  );
  assert(l2pg.includes("PASS L2 trigger sem link"), l2pg);
  console.log("PASS L2 org sem link Workspace");

  runSqlAsPostgres(
    `
    delete from public.contract_assignments
      where contract_id in ('${CONTRACT_A}','${CONTRACT_B}','${CONTRACT_LEGACY}');
    delete from public.member_roles
      where organization_member_id in ('${gestorMember}','${multiBeta}')
        and role_id = '${adminRole}';
    delete from public.contracts
      where id in ('${CONTRACT_A}','${CONTRACT_B}','${CONTRACT_LEGACY}');
    delete from public.workspace_memberships where workspace_id = '${WS}';
    delete from public.organization_workspace_links where workspace_id = '${WS}';
    delete from public.workspaces where id = '${WS}';
    `,
    "cleanup",
  );

  console.log("ALL GATE 13X.5 CHECKS PASSED");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
