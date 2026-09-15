/**
 * Smoke estrutural — Gate 13X.1 (Contract×Workspace + assignments + origin).
 * Postgres local (bypass RLS) para integridade; limpa registros criados.
 *
 * Uso: node supabase/scripts/smoke-workspace-gate13x1.mjs
 */
import { execFileSync } from "node:child_process";
import { writeFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CONTAINER = process.env.SAFESTOP_DB_CONTAINER ?? "supabase_db_safestop";

const SQL = `
\\set ON_ERROR_STOP on

do $$
declare
  v_org_a uuid := 'b0000000-0000-4000-8000-000000000001';
  v_org_b uuid := 'b0000000-0000-4000-8000-000000000002';
  v_member_a uuid;
  v_member_b uuid;
  v_ws uuid;
  v_link_a uuid;
  v_link_b uuid;
  v_c1 uuid;
  v_c2 uuid;
  v_c_legacy uuid;
  v_asg uuid;
  v_occ uuid;
  v_created_by uuid;
  v_area uuid := 'f0000000-0000-4000-8000-000000000001';
begin
  select id into v_member_a
  from public.organization_members
  where organization_id = v_org_a and is_active = true
  limit 1;

  select id into v_member_b
  from public.organization_members
  where organization_id = v_org_b and is_active = true
  limit 1;

  if v_member_a is null or v_member_b is null then
    raise exception 'Smoke 13X.1: seed sem organization_members Alpha/Beta';
  end if;

  insert into public.workspaces (name, code, owner_organization_id, is_active)
  values ('Gate13X1 Smoke WS', 'G13X1-SMOKE-WS', v_org_a, true)
  returning id into v_ws;

  insert into public.organization_workspace_links (organization_id, workspace_id)
  values (v_org_a, v_ws)
  returning id into v_link_a;

  insert into public.organization_workspace_links (organization_id, workspace_id)
  values (v_org_b, v_ws)
  returning id into v_link_b;

  -- 2 contracts no mesmo WS para a mesma org titular (contratada = Beta)
  insert into public.contracts (
    client_organization_id, contractor_organization_id, workspace_id,
    contract_number, name, starts_at, is_active
  ) values (
    v_org_a, v_org_b, v_ws,
    'G13X1-A', '13X.1 Contrato A mesmo WS', now(), true
  ) returning id into v_c1;

  insert into public.contracts (
    client_organization_id, contractor_organization_id, workspace_id,
    contract_number, name, starts_at, is_active
  ) values (
    v_org_a, v_org_b, v_ws,
    'G13X1-B', '13X.1 Contrato B mesmo WS', now(), true
  ) returning id into v_c2;
  raise notice 'PASS two contracts same workspace same titular org';

  -- unique parcial: mesmo WS + contractor + number
  begin
    insert into public.contracts (
      client_organization_id, contractor_organization_id, workspace_id,
      contract_number, name, starts_at, is_active
    ) values (
      v_org_a, v_org_b, v_ws,
      'G13X1-A', '13X.1 duplicado numero', now(), true
    );
    raise exception 'FAIL: unique workspace+contractor+number deveria falhar';
  exception
    when unique_violation then
      raise notice 'PASS reject duplicate workspace contractor number';
  end;

  -- assignment válido (member Beta no contrato do WS onde Beta tem link)
  insert into public.contract_assignments (
    organization_member_id, organization_id, contract_id, assignment_role, is_active
  ) values (v_member_b, v_org_b, v_c1, 'FISCAL', true)
  returning id into v_asg;
  raise notice 'PASS valid contract assignment';

  -- duplicado role+member+contract
  begin
    insert into public.contract_assignments (
      organization_member_id, organization_id, contract_id, assignment_role
    ) values (v_member_b, v_org_b, v_c1, 'FISCAL');
    raise exception 'FAIL: assignment duplicado deveria falhar';
  exception
    when unique_violation then
      raise notice 'PASS reject duplicate member+contract+role';
  end;

  -- mesmo member, mesmo contract, outro role (permitido)
  insert into public.contract_assignments (
    organization_member_id, organization_id, contract_id, assignment_role
  ) values (v_member_b, v_org_b, v_c1, 'GERENTE');
  raise notice 'PASS second role same member+contract';

  -- contrato legado sem workspace_id: assignment rejeitado
  insert into public.contracts (
    client_organization_id, contractor_organization_id,
    contract_number, name, starts_at, is_active
  ) values (
    v_org_a, v_org_b, 'G13X1-LEG', '13X.1 Contrato legado sem WS', now(), true
  ) returning id into v_c_legacy;

  begin
    insert into public.contract_assignments (
      organization_member_id, organization_id, contract_id, assignment_role
    ) values (v_member_b, v_org_b, v_c_legacy, 'FISCAL');
    raise exception 'FAIL: assignment em contrato sem workspace_id deveria falhar';
  exception
    when others then
      if sqlerrm like '%workspace_id%' then
        raise notice 'PASS reject assignment on legacy contract without workspace_id';
      else
        raise;
      end if;
  end;

  -- org sem link: WS2 só Alpha; member Beta
  declare
    v_ws2 uuid;
    v_c3 uuid;
  begin
    insert into public.workspaces (name, code, owner_organization_id, is_active)
    values ('Gate13X1 Smoke WS2', 'G13X1-SMOKE-WS2', v_org_a, true)
    returning id into v_ws2;

    insert into public.organization_workspace_links (organization_id, workspace_id)
    values (v_org_a, v_ws2);

    insert into public.contracts (
      client_organization_id, contractor_organization_id, workspace_id,
      contract_number, name, starts_at, is_active
    ) values (
      v_org_a, v_org_b, v_ws2,
      'G13X1-C', '13X.1 Contrato WS sem link Beta', now(), true
    ) returning id into v_c3;

    begin
      insert into public.contract_assignments (
        organization_member_id, organization_id, contract_id, assignment_role
      ) values (v_member_b, v_org_b, v_c3, 'FISCAL');
      raise exception 'FAIL: assignment org sem link deveria falhar';
    exception
      when others then
        if sqlerrm like '%nao participa%' or sqlerrm like '%não participa%' then
          raise notice 'PASS reject assignment org without workspace link';
        else
          raise;
        end if;
    end;

    delete from public.contracts where id = v_c3;
    delete from public.organization_workspace_links where workspace_id = v_ws2;
    delete from public.workspaces where id = v_ws2;
  end;

  -- origin_organization_id FK
  select created_by into v_created_by from public.occurrences limit 1;
  if v_created_by is null then
    select profile_id into v_created_by
    from public.organization_members
    where id = v_member_a;
  end if;

  begin
    insert into public.occurrences (
      organization_id, area_id, public_code, title, task_description,
      location_description, condition_description, severity, created_by,
      origin_organization_id
    ) values (
      v_org_a, v_area, 'SS-13X1-FK-BAD', '13X.1 FK origin', 'task',
      'loc', 'cond', 'LOW', v_created_by,
      '00000000-0000-4000-8000-000000000099'
    );
    raise exception 'FAIL: origin_organization_id FK invalida deveria falhar';
  exception
    when foreign_key_violation then
      raise notice 'PASS reject invalid origin_organization_id FK';
  end;

  insert into public.occurrences (
    organization_id, area_id, public_code, title, task_description,
    location_description, condition_description, severity, created_by,
    origin_organization_id
  ) values (
    v_org_a, v_area, 'SS-13X1-ORIGIN', '13X.1 origin ok', 'task',
    'loc', 'cond', 'LOW', v_created_by, v_org_a
  ) returning id into v_occ;
  raise notice 'PASS occurrence.origin_organization_id valid FK';

  -- organization_id permanece independente
  if (select organization_id from public.occurrences where id = v_occ) <> v_org_a then
    raise exception 'FAIL: organization_id alterado';
  end if;
  raise notice 'PASS occurrences.organization_id unchanged (legacy tenant)';

  -- cleanup
  delete from public.occurrences where id = v_occ;
  delete from public.contract_assignments where contract_id in (v_c1, v_c2, v_c_legacy);
  delete from public.contracts where id in (v_c1, v_c2, v_c_legacy);
  delete from public.organization_workspace_links where id in (v_link_a, v_link_b);
  delete from public.workspaces where id = v_ws;
  raise notice 'PASS cleanup';
  raise notice 'ALL GATE 13X.1 STRUCTURAL CHECKS PASSED';
end $$;
`;

function main() {
  const sqlPath = join(tmpdir(), `safestop-smoke-gate13x1-${Date.now()}.sql`);
  writeFileSync(sqlPath, SQL, "utf8");
  try {
    const containerPath = "/tmp/smoke-workspace-gate13x1.sql";
    execFileSync("docker", ["cp", sqlPath, `${CONTAINER}:${containerPath}`], { stdio: "inherit" });
    execFileSync(
      "docker",
      ["exec", "-i", CONTAINER, "psql", "-U", "postgres", "-d", "postgres", "-v", "ON_ERROR_STOP=1", "-f", containerPath],
      { stdio: "inherit" },
    );
    console.log("smoke-workspace-gate13x1: OK");
  } finally {
    try {
      unlinkSync(sqlPath);
    } catch {
      // ignore
    }
  }
}

main();
