/**
 * Smoke Gate 13X.2 — create_occurrence Workspace vs legado (JWT).
 *
 * Uso: node supabase/scripts/smoke-workspace-gate13x2.mjs
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
const ALPHA_AREA = "f0000000-0000-4000-8000-000000000001";
const FIELD_EMAIL = "qa-field@safestop.local";

const WS1 = "d1320000-0000-4000-8000-000000000001";
const WS2 = "d1320000-0000-4000-8000-000000000002";
const CONTRACT_A = "d1320000-0000-4000-8000-000000000011";
const CONTRACT_B = "d1320000-0000-4000-8000-000000000012";
const CONTRACT_OTHER = "d1320000-0000-4000-8000-000000000013";
const CONTRACT_EPS_OFF = "d1320000-0000-4000-8000-000000000014";
const AREA_OTHER_WS = "d1320000-0000-4000-8000-000000000021";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function runSqlAsPostgres(sql, label) {
  const sqlPath = join(tmpdir(), `safestop-g13x2-${Date.now()}-${label}.sql`);
  writeFileSync(sqlPath, sql, "utf8");
  const containerPath = `/tmp/smoke-g13x2-${label}.sql`;
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

function baseWsPayload(extra) {
  return {
    organization_id: ALPHA_ORG,
    workspace_id: WS1,
    area_id: ALPHA_AREA,
    title: "G13X2 PP",
    task_description: "t",
    location_description: "l",
    condition_description: "c",
    severity: "LOW",
    ...extra,
  };
}

async function main() {
  const { apiUrl, anonKey } = loadSupabaseLocalEnv();
  const field = await signIn(apiUrl, anonKey, FIELD_EMAIL, LOCAL_PASSWORD);
  const fieldId = field.user.id;
  const createdIds = [];

  runSqlAsPostgres(
    `
\\set ON_ERROR_STOP on
delete from public.occurrence_participants
  where occurrence_id in (select id from public.occurrences where title like 'G13X2%');
delete from public.occurrence_status_history
  where occurrence_id in (select id from public.occurrences where title like 'G13X2%');
delete from public.notifications n
  using public.notification_events e
  where n.notification_event_id = e.id
    and e.occurrence_id in (select id from public.occurrences where title like 'G13X2%');
delete from public.notification_events
  where occurrence_id in (select id from public.occurrences where title like 'G13X2%');
delete from public.occurrences where title like 'G13X2%';
delete from public.areas where id = '${AREA_OTHER_WS}';
delete from public.contracts
  where id in ('${CONTRACT_A}','${CONTRACT_B}','${CONTRACT_OTHER}','${CONTRACT_EPS_OFF}');
delete from public.workspace_memberships
  where workspace_id in ('${WS1}','${WS2}');
delete from public.organization_workspace_links
  where workspace_id in ('${WS1}','${WS2}');
delete from public.workspaces where id in ('${WS1}','${WS2}');

do $$
declare
  v_field_member uuid;
  v_unit uuid;
begin
  select om.id into v_field_member
  from public.organization_members om
  where om.organization_id = '${ALPHA_ORG}'
    and om.profile_id = '${fieldId}'
    and om.is_active;
  if v_field_member is null then
    raise exception 'Smoke 13X.2: member Alpha do field não encontrado';
  end if;

  select a.unit_id into v_unit from public.areas a where a.id = '${ALPHA_AREA}';

  insert into public.workspaces (id, name, code, owner_organization_id, is_active)
  values
    ('${WS1}', 'Gate13X2 WS1', 'G13X2-WS1', '${ALPHA_ORG}', true),
    ('${WS2}', 'Gate13X2 WS2', 'G13X2-WS2', '${ALPHA_ORG}', true);

  insert into public.organization_workspace_links (organization_id, workspace_id, is_active)
  values
    ('${ALPHA_ORG}', '${WS1}', true),
    ('${BETA_ORG}', '${WS1}', true),
    ('${ALPHA_ORG}', '${WS2}', true),
    ('${BETA_ORG}', '${WS2}', true);

  insert into public.workspace_memberships (
    organization_member_id, organization_id, workspace_id, is_active
  ) values (v_field_member, '${ALPHA_ORG}', '${WS1}', true);

  insert into public.contracts (
    id, client_organization_id, contractor_organization_id, workspace_id,
    contract_number, name, starts_at, is_active
  ) values
    ('${CONTRACT_A}', '${ALPHA_ORG}', '${BETA_ORG}', '${WS1}',
     'G13X2-A', '13X.2 Contrato A', now(), true),
    ('${CONTRACT_B}', '${ALPHA_ORG}', '${BETA_ORG}', '${WS1}',
     'G13X2-B', '13X.2 Contrato B', now(), true),
    ('${CONTRACT_OTHER}', '${ALPHA_ORG}', '${BETA_ORG}', '${WS2}',
     'G13X2-OTHER', '13X.2 Contrato outro WS', now(), true),
    ('${CONTRACT_EPS_OFF}', '${ALPHA_ORG}', '${EPSILON_ORG}', '${WS1}',
     'G13X2-EPS', '13X.2 Epsilon inativo', now(), false);

  insert into public.areas (
    id, organization_id, unit_id, workspace_id, name, code, is_active
  ) values (
    '${AREA_OTHER_WS}', '${ALPHA_ORG}', v_unit, '${WS2}',
    '13X.2 Area outro WS', 'G13X2-AREA-WS2', true
  );
end $$;
`,
    "setup",
  );

  const c4a = await rpc(apiUrl, anonKey, field.access_token, "create_occurrence", {
    payload: baseWsPayload({
      title: "G13X2 C4 A",
      contract_id: CONTRACT_A,
      contractor_organization_id: BETA_ORG,
    }),
  });
  assert(c4a?.success === true && c4a.data.contract_id === CONTRACT_A, `C4a ${JSON.stringify(c4a)}`);
  createdIds.push(c4a.data.id);

  const c4b = await rpc(apiUrl, anonKey, field.access_token, "create_occurrence", {
    payload: baseWsPayload({
      title: "G13X2 C4 B",
      contract_id: CONTRACT_B,
      contractor_organization_id: BETA_ORG,
    }),
  });
  assert(c4b?.success === true && c4b.data.contract_id === CONTRACT_B, `C4b ${JSON.stringify(c4b)}`);
  assert(c4a.data.id !== c4b.data.id, "C4 same id");
  createdIds.push(c4b.data.id);
  console.log("PASS C4 dois contratos mesmo WS mesma titular");

  assert(
    c4a.data.origin_organization_id === ALPHA_ORG &&
      c4a.data.contractor_organization_id === BETA_ORG &&
      c4a.data.organization_id === ALPHA_ORG &&
      c4a.data.workspace_id === WS1,
    `C5 ${JSON.stringify(c4a)}`,
  );
  console.log("PASS C5 origin=Hydro/Alpha tenant=owner contractor=TÜV/Beta contract=A");

  const c6 = await rpc(apiUrl, anonKey, field.access_token, "create_occurrence", {
    payload: baseWsPayload({ title: "G13X2 C6 equipe propria" }),
  });
  assert(
    c6?.success === true &&
      c6.data.origin_organization_id === ALPHA_ORG &&
      c6.data.contract_id == null &&
      c6.data.contractor_organization_id == null &&
      c6.data.workspace_id === WS1,
    `C6 ${JSON.stringify(c6)}`,
  );
  createdIds.push(c6.data.id);
  console.log("PASS C6 equipe própria");

  const n1 = await rpc(apiUrl, anonKey, field.access_token, "create_occurrence", {
    payload: baseWsPayload({
      title: "G13X2 N1",
      contract_id: CONTRACT_OTHER,
      contractor_organization_id: BETA_ORG,
    }),
  });
  assert(n1?.success === false && n1.error?.code === "VALIDATION_ERROR", `N1 ${JSON.stringify(n1)}`);
  console.log("PASS N1 contract de outro Workspace rejeitado");

  const n2 = await rpc(apiUrl, anonKey, field.access_token, "create_occurrence", {
    payload: baseWsPayload({
      title: "G13X2 N2",
      contract_id: CONTRACT_EPS_OFF,
      contractor_organization_id: EPSILON_ORG,
    }),
  });
  assert(n2?.success === false && n2.error?.code === "VALIDATION_ERROR", `N2 ${JSON.stringify(n2)}`);
  console.log("PASS N2 contractor sem contrato ativo naquele WS");

  const legadoNoContractor = await rpc(apiUrl, anonKey, field.access_token, "create_occurrence", {
    payload: {
      organization_id: ALPHA_ORG,
      area_id: ALPHA_AREA,
      title: "G13X2 LEGADO sem contractor",
      task_description: "t",
      location_description: "l",
      condition_description: "c",
      severity: "LOW",
    },
  });
  assert(
    legadoNoContractor?.success === false && legadoNoContractor.error?.code === "VALIDATION_ERROR",
    `LEGADO sem contractor ${JSON.stringify(legadoNoContractor)}`,
  );
  console.log("PASS LEGADO sem workspace + sem contractor rejeitado");

  const legadoOk = await rpc(apiUrl, anonKey, field.access_token, "create_occurrence", {
    payload: {
      organization_id: ALPHA_ORG,
      area_id: ALPHA_AREA,
      contractor_organization_id: BETA_ORG,
      title: "G13X2 LEGADO ok",
      task_description: "t",
      location_description: "l",
      condition_description: "c",
      severity: "LOW",
    },
  });
  assert(
    legadoOk?.success === true &&
      legadoOk.data.workspace_id == null &&
      legadoOk.data.origin_organization_id == null,
    `LEGADO ok ${JSON.stringify(legadoOk)}`,
  );
  createdIds.push(legadoOk.data.id);
  console.log("PASS LEGADO contractor no eixo client; origin NULL");

  const areaWrong = await rpc(apiUrl, anonKey, field.access_token, "create_occurrence", {
    payload: baseWsPayload({
      title: "G13X2 area outro WS",
      area_id: AREA_OTHER_WS,
      contract_id: CONTRACT_A,
      contractor_organization_id: BETA_ORG,
    }),
  });
  assert(
    areaWrong?.success === false && areaWrong.error?.code === "VALIDATION_ERROR",
    `area outro WS ${JSON.stringify(areaWrong)}`,
  );
  console.log("PASS area.workspace_id de outro WS rejeitada no caminho WS");

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
    delete from public.areas where id = '${AREA_OTHER_WS}';
    delete from public.contracts
      where id in ('${CONTRACT_A}','${CONTRACT_B}','${CONTRACT_OTHER}','${CONTRACT_EPS_OFF}');
    delete from public.workspace_memberships where workspace_id in ('${WS1}','${WS2}');
    delete from public.organization_workspace_links where workspace_id in ('${WS1}','${WS2}');
    delete from public.workspaces where id in ('${WS1}','${WS2}');
    `,
    "cleanup",
  );

  console.log("ALL GATE 13X.2 CHECKS PASSED");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
