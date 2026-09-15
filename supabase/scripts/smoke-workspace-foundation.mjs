/**
 * Smoke estrutural — Gate 12 Workspace foundation.
 * Valida constraints/FKs/unique/is_active sem alterar dados operacionais permanentes.
 * Usa Postgres local (bypass RLS) para teste estrutural; limpa os registros criados.
 *
 * Uso: node supabase/scripts/smoke-workspace-foundation.mjs
 */
import { execFileSync } from "node:child_process";
import { writeFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CONTAINER = process.env.SAFESTOP_DB_CONTAINER ?? "supabase_db_safestop";

const SQL = `
-- Smoke Gate 12 — workspace foundation (transação + rollback limpo via DELETE)
\\set ON_ERROR_STOP on

do $$
declare
  v_org_a uuid := 'b0000000-0000-4000-8000-000000000001'; -- Alpha
  v_org_b uuid := 'b0000000-0000-4000-8000-000000000002'; -- Beta contractor
  v_member_a uuid;
  v_member_b uuid;
  v_ws uuid;
  v_link_a uuid;
  v_link_b uuid;
  v_wm uuid;
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
    raise exception 'Smoke Gate 12: seed sem organization_members Alpha/Beta';
  end if;

  -- 1) criar Workspace W
  insert into public.workspaces (name, code, owner_organization_id, is_active)
  values ('Gate12 Smoke Workspace', 'G12-SMOKE-WS', v_org_a, true)
  returning id into v_ws;
  raise notice 'PASS create workspace %', v_ws;

  -- 2) vincular Org A
  insert into public.organization_workspace_links (organization_id, workspace_id)
  values (v_org_a, v_ws)
  returning id into v_link_a;
  raise notice 'PASS link org A';

  -- 3) vincular Org B ao MESMO Workspace (compartilhado)
  insert into public.organization_workspace_links (organization_id, workspace_id)
  values (v_org_b, v_ws)
  returning id into v_link_b;
  raise notice 'PASS link org B same workspace (shared)';

  -- link duplicado A+W deve falhar
  begin
    insert into public.organization_workspace_links (organization_id, workspace_id)
    values (v_org_a, v_ws);
    raise exception 'FAIL: link duplicado deveria falhar';
  exception
    when unique_violation then
      raise notice 'PASS reject duplicate org-workspace link';
  end;

  -- 4) membership válido (member de A em W)
  insert into public.workspace_memberships (
    organization_member_id, organization_id, workspace_id, is_active
  ) values (v_member_a, v_org_a, v_ws, true)
  returning id into v_wm;
  raise notice 'PASS valid workspace membership';

  -- 5) membership duplicado (mesmo member + W)
  begin
    insert into public.workspace_memberships (
      organization_member_id, organization_id, workspace_id
    ) values (v_member_a, v_org_a, v_ws);
    raise exception 'FAIL: membership duplicado deveria falhar';
  exception
    when unique_violation then
      raise notice 'PASS reject duplicate membership';
  end;

  -- 6) membership incompatível: member de org sem link
  -- cria org C sem link e tenta grant — usar member B mas workspace sem org... 
  -- member_b tem org B que JÁ tem link. Precisamos de cenário sem link.
  -- Remover temporariamente? Melhor: criar workspace W2 ligado só a A e tentar member B.
  declare
    v_ws2 uuid;
  begin
    insert into public.workspaces (name, code, is_active)
    values ('Gate12 Smoke WS2', 'G12-SMOKE-WS2', true)
    returning id into v_ws2;

    insert into public.organization_workspace_links (organization_id, workspace_id)
    values (v_org_a, v_ws2);

    begin
      insert into public.workspace_memberships (
        organization_member_id, organization_id, workspace_id
      ) values (v_member_b, v_org_b, v_ws2);
      raise exception 'FAIL: membership incompatível deveria falhar (FK link)';
    exception
      when foreign_key_violation then
        raise notice 'PASS reject incompatible membership (org sem link)';
    end;

    -- soft deactivate workspace/link sem quebrar FKs
    update public.workspaces set is_active = false where id = v_ws2;
    update public.organization_workspace_links set is_active = false
      where workspace_id = v_ws2;
    raise notice 'PASS soft deactivate workspace/link (FK intacta)';

    -- cleanup ws2
    delete from public.organization_workspace_links where workspace_id = v_ws2;
    delete from public.workspaces where id = v_ws2;
  end;

  -- 7) soft deactivate membership/link/workspace principal
  update public.workspace_memberships
    set is_active = false, revoked_at = now()
    where id = v_wm;
  update public.organization_workspace_links set is_active = false where id = v_link_a;
  update public.organization_workspace_links set is_active = false where id = v_link_b;
  update public.workspaces set is_active = false where id = v_ws;
  raise notice 'PASS soft deactivate membership/links/workspace';

  -- cleanup (não deixar lixo local)
  delete from public.workspace_memberships where id = v_wm;
  delete from public.organization_workspace_links where id in (v_link_a, v_link_b);
  delete from public.workspaces where id = v_ws;
  raise notice 'PASS cleanup';
  raise notice 'ALL GATE 12 STRUCTURAL CHECKS PASSED';
end $$;
`;

function main() {
  const sqlPath = join(tmpdir(), `safestop-smoke-workspace-foundation-${Date.now()}.sql`);
  writeFileSync(sqlPath, SQL, "utf8");
  try {
    // PowerShell/Windows: docker cp + exec
    const containerPath = "/tmp/smoke-workspace-foundation.sql";
    execFileSync("docker", ["cp", sqlPath, `${CONTAINER}:${containerPath}`], { stdio: "inherit" });
    execFileSync(
      "docker",
      ["exec", "-i", CONTAINER, "psql", "-U", "postgres", "-d", "postgres", "-v", "ON_ERROR_STOP=1", "-f", containerPath],
      { stdio: "inherit" },
    );
    console.log("smoke-workspace-foundation: OK");
  } finally {
    try {
      unlinkSync(sqlPath);
    } catch {
      // ignore
    }
  }
}

main();
