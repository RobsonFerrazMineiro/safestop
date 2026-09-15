/**
 * Smoke Gate 13X.2.1 — ciclo JWT da contratada no Workspace do cliente.
 *
 * Uso: node supabase/scripts/smoke-workspace-gate13x21.mjs
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
const ALPHA_AREA = "f0000000-0000-4000-8000-000000000001";
const FIELD_EMAIL = "qa-field@safestop.local";
const MULTI_EMAIL = "qa-multi@safestop.local";

const WS = "d1321000-0000-4000-8000-000000000001";
const CONTRACT_A = "d1321000-0000-4000-8000-000000000011";
const UNIT_BETA_WS = "d1321000-0000-4000-8000-000000000031";
const AREA_BETA_WS = "d1321000-0000-4000-8000-000000000032";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function runSqlAsPostgres(sql, label) {
  const sqlPath = join(tmpdir(), `safestop-g13x21-${Date.now()}-${label}.sql`);
  writeFileSync(sqlPath, sql, "utf8");
  const containerPath = `/tmp/smoke-g13x21-${label}.sql`;
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

async function restGet(apiUrl, anonKey, token, path) {
  const res = await fetch(`${apiUrl}/rest/v1/${path}`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${token}` },
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: res.ok, status: res.status, body: text };
  }
  return { ok: res.ok, status: res.status, body: json };
}

async function main() {
  const { apiUrl, anonKey } = loadSupabaseLocalEnv();
  const field = await signIn(apiUrl, anonKey, FIELD_EMAIL, LOCAL_PASSWORD);
  const multi = await signIn(apiUrl, anonKey, MULTI_EMAIL, LOCAL_PASSWORD);
  const createdIds = [];

  runSqlAsPostgres(
    `
\\set ON_ERROR_STOP on
delete from public.occurrence_participants
  where occurrence_id in (select id from public.occurrences where title like 'G13X21%');
delete from public.occurrence_status_history
  where occurrence_id in (select id from public.occurrences where title like 'G13X21%');
delete from public.notifications n
  using public.notification_events e
  where n.notification_event_id = e.id
    and e.occurrence_id in (select id from public.occurrences where title like 'G13X21%');
delete from public.notification_events
  where occurrence_id in (select id from public.occurrences where title like 'G13X21%');
delete from public.occurrences where title like 'G13X21%';
delete from public.areas where id = '${AREA_BETA_WS}';
delete from public.units where id = '${UNIT_BETA_WS}';
delete from public.contracts where id = '${CONTRACT_A}';
delete from public.workspace_memberships where workspace_id = '${WS}';
delete from public.organization_workspace_links where workspace_id = '${WS}';
delete from public.workspaces where id = '${WS}';

do $$
declare
  v_field_member uuid;
  v_multi_member uuid;
begin
  select om.id into v_field_member
  from public.organization_members om
  where om.organization_id = '${ALPHA_ORG}'
    and om.profile_id = '${field.user.id}'
    and om.is_active;

  select om.id into v_multi_member
  from public.organization_members om
  where om.organization_id = '${BETA_ORG}'
    and om.profile_id = '${multi.user.id}'
    and om.is_active;

  if v_field_member is null or v_multi_member is null then
    raise exception 'Smoke 13X.2.1: members Alpha field / Beta multi não encontrados';
  end if;

  insert into public.workspaces (id, name, code, owner_organization_id, is_active)
  values ('${WS}', 'Hydro Alunorte 13X21', 'G13X21-WS', '${ALPHA_ORG}', true);

  insert into public.organization_workspace_links (organization_id, workspace_id, is_active)
  values
    ('${ALPHA_ORG}', '${WS}', true),
    ('${BETA_ORG}', '${WS}', true);

  insert into public.workspace_memberships (
    organization_member_id, organization_id, workspace_id, is_active
  ) values
    (v_field_member, '${ALPHA_ORG}', '${WS}', true),
    (v_multi_member, '${BETA_ORG}', '${WS}', true);

  insert into public.contracts (
    id, client_organization_id, contractor_organization_id, workspace_id,
    contract_number, name, starts_at, is_active
  ) values (
    '${CONTRACT_A}', '${ALPHA_ORG}', '${BETA_ORG}', '${WS}',
    'G13X21-A', '13X.2.1 Contrato A TÜV', now(), true
  );

  insert into public.units (
    id, organization_id, workspace_id, name, code, is_active
  ) values (
    '${UNIT_BETA_WS}', '${BETA_ORG}', '${WS}', '13X.2.1 Unidade TÜV no WS', 'G13X21-U', true
  );

  insert into public.areas (
    id, organization_id, unit_id, workspace_id, name, code, is_active
  ) values (
    '${AREA_BETA_WS}', '${BETA_ORG}', '${UNIT_BETA_WS}', '${WS}',
    '13X.2.1 Área TÜV no WS', 'G13X21-A', true
  );
end $$;
`,
    "setup",
  );

  const cTuv = await rpc(apiUrl, anonKey, multi.access_token, "create_occurrence", {
    payload: {
      organization_id: BETA_ORG,
      workspace_id: WS,
      area_id: ALPHA_AREA,
      contract_id: CONTRACT_A,
      contractor_organization_id: BETA_ORG,
      title: "G13X21 C-TUV Hydro area",
      task_description: "t",
      location_description: "l",
      condition_description: "c",
      severity: "LOW",
    },
  });
  assert(
    cTuv?.success === true &&
      cTuv.data.origin_organization_id === BETA_ORG &&
      cTuv.data.organization_id === ALPHA_ORG &&
      cTuv.data.contractor_organization_id === BETA_ORG &&
      cTuv.data.contract_id === CONTRACT_A,
    `C-TUV ${JSON.stringify(cTuv)}`,
  );
  createdIds.push(cTuv.data.id);
  console.log("PASS C-TUV create origin=TÜV tenant=owner area Hydro");

  const dTuv = await rpc(apiUrl, anonKey, multi.access_token, "can_access_occurrence", {
    target_occurrence_id: cTuv.data.id,
  });
  assert(dTuv === true, `D-TUV ${JSON.stringify(dTuv)}`);
  console.log("PASS D-TUV can_access_occurrence true");

  const sTuv = await restGet(
    apiUrl,
    anonKey,
    multi.access_token,
    `occurrences?id=eq.${cTuv.data.id}&select=id,organization_id,origin_organization_id`,
  );
  assert(sTuv.ok && Array.isArray(sTuv.body) && sTuv.body.length === 1, `S-TUV ${JSON.stringify(sTuv)}`);
  console.log("PASS S-TUV SELECT REST da occurrence pelo criador");

  const lTuv = await rpc(apiUrl, anonKey, multi.access_token, "list_operational_occurrences", {
    p_organization_id: BETA_ORG,
    p_workspace_id: WS,
  });
  const lIds = (lTuv?.items ?? []).map((row) => row.id);
  assert(lIds.includes(cTuv.data.id), `L-TUV missing id ${JSON.stringify(lTuv)}`);
  console.log("PASS L-TUV list_operational_occurrences(TÜV, WS) contém o id");

  const aTuv = await restGet(
    apiUrl,
    anonKey,
    multi.access_token,
    `areas?id=eq.${ALPHA_AREA}&select=id,organization_id`,
  );
  assert(aTuv.ok && Array.isArray(aTuv.body) && aTuv.body.length === 1, `A-TUV ${JSON.stringify(aTuv)}`);
  console.log("PASS A-TUV SELECT REST da área Hydro");

  const c5 = await rpc(apiUrl, anonKey, field.access_token, "create_occurrence", {
    payload: {
      organization_id: ALPHA_ORG,
      workspace_id: WS,
      area_id: ALPHA_AREA,
      contract_id: CONTRACT_A,
      contractor_organization_id: BETA_ORG,
      title: "G13X21 C5 Hydro sobre TÜV",
      task_description: "t",
      location_description: "l",
      condition_description: "c",
      severity: "LOW",
    },
  });
  assert(
    c5?.success === true &&
      c5.data.origin_organization_id === ALPHA_ORG &&
      c5.data.contractor_organization_id === BETA_ORG,
    `C5 ${JSON.stringify(c5)}`,
  );
  createdIds.push(c5.data.id);
  console.log("PASS C5 Hydro cria sobre contrato TÜV");

  const c6 = await rpc(apiUrl, anonKey, field.access_token, "create_occurrence", {
    payload: {
      organization_id: ALPHA_ORG,
      workspace_id: WS,
      area_id: ALPHA_AREA,
      title: "G13X21 C6 equipe propria",
      task_description: "t",
      location_description: "l",
      condition_description: "c",
      severity: "LOW",
    },
  });
  assert(
    c6?.success === true && c6.data.contract_id == null && c6.data.contractor_organization_id == null,
    `C6 ${JSON.stringify(c6)}`,
  );
  createdIds.push(c6.data.id);
  console.log("PASS C6 equipe própria Hydro");

  const nOwn = await rpc(apiUrl, anonKey, multi.access_token, "create_occurrence", {
    payload: {
      organization_id: BETA_ORG,
      workspace_id: WS,
      area_id: ALPHA_AREA,
      title: "G13X21 N-OWN",
      task_description: "t",
      location_description: "l",
      condition_description: "c",
      severity: "LOW",
    },
  });
  assert(nOwn?.success === false && nOwn.error?.code === "VALIDATION_ERROR", `N-OWN ${JSON.stringify(nOwn)}`);
  console.log("PASS N-OWN TÜV sem contract rejeitado");

  const areaWs = await rpc(apiUrl, anonKey, multi.access_token, "create_occurrence", {
    payload: {
      organization_id: BETA_ORG,
      workspace_id: WS,
      area_id: AREA_BETA_WS,
      contract_id: CONTRACT_A,
      contractor_organization_id: BETA_ORG,
      title: "G13X21 AREA-WS",
      task_description: "t",
      location_description: "l",
      condition_description: "c",
      severity: "LOW",
    },
  });
  assert(
    areaWs?.success === true &&
      areaWs.data.origin_organization_id === BETA_ORG &&
      areaWs.data.organization_id === ALPHA_ORG &&
      areaWs.data.area_id === AREA_BETA_WS,
    `AREA-WS ${JSON.stringify(areaWs)}`,
  );
  createdIds.push(areaWs.data.id);
  console.log("PASS AREA-WS create TÜV com área da contratada no WS");

  runSqlAsPostgres(
    `
    delete from public.occurrence_participants
      where occurrence_id in ('${createdIds.join("','")}');
    delete from public.occurrence_status_history
      where occurrence_id in ('${createdIds.join("','")}');
    delete from public.notifications n
      using public.notification_events e
      where n.notification_event_id = e.id
        and e.occurrence_id in ('${createdIds.join("','")}');
    delete from public.notification_events
      where occurrence_id in ('${createdIds.join("','")}');
    delete from public.occurrences where id in ('${createdIds.join("','")}');
    delete from public.areas where id = '${AREA_BETA_WS}';
    delete from public.units where id = '${UNIT_BETA_WS}';
    delete from public.contracts where id = '${CONTRACT_A}';
    delete from public.workspace_memberships where workspace_id = '${WS}';
    delete from public.organization_workspace_links where workspace_id = '${WS}';
    delete from public.workspaces where id = '${WS}';
    `,
    "cleanup",
  );

  console.log("ALL GATE 13X.2.1 CHECKS PASSED");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
