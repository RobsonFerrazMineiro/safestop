/**
 * Smoke Gate 13C.1 — list_operational_occurrences + p_workspace_id
 *
 * Autorização via JWT real. Postgres apenas para fixtures/cleanup.
 *
 * Uso: node supabase/scripts/smoke-list-operational-occurrences-workspace.mjs
 */
import { execFileSync, spawnSync } from "node:child_process";
import { writeFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { loadSupabaseLocalEnv } from "./_local-env.mjs";

const CONTAINER = process.env.SAFESTOP_DB_CONTAINER ?? "supabase_db_safestop";
const PASSWORD = "SafeStop-QA-Local-2026";
const ALPHA_ORG = "b0000000-0000-4000-8000-000000000001";
const BETA_ORG = "b0000000-0000-4000-8000-000000000002";
const ALPHA_AREA = "f0000000-0000-4000-8000-000000000001";
const FIELD_EMAIL = "qa-field@safestop.local";
const PLATFORM_EMAIL = "qa-platform@safestop.local";

const WS_A = "d13c1000-0000-4000-8000-000000000001";
const WS_B = "d13c1000-0000-4000-8000-000000000002";
const WS_DENIED = "d13c1000-0000-4000-8000-000000000003";
const WS_BETA_ONLY = "d13c1000-0000-4000-8000-000000000099";

const OCC_A1 = "d13c1000-0000-4000-8000-000000000011";
const OCC_A2 = "d13c1000-0000-4000-8000-000000000012";
const OCC_B1 = "d13c1000-0000-4000-8000-000000000021";
const OCC_LEGACY = "d13c1000-0000-4000-8000-000000000031";
const OCC_A_PAGE = [
  "d13c1000-0000-4000-8000-000000000041",
  "d13c1000-0000-4000-8000-000000000042",
  "d13c1000-0000-4000-8000-000000000043",
  "d13c1000-0000-4000-8000-000000000044",
  "d13c1000-0000-4000-8000-000000000045",
];

const results = [];
function record(id, ok, detail) {
  results.push({ id, ok });
  console.log(`${ok ? "PASS" : "FAIL"} ${id}: ${detail}`);
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function runSql(sql, label) {
  const sqlPath = join(tmpdir(), `safestop-g13c1-${Date.now()}-${label}.sql`);
  writeFileSync(sqlPath, sql, "utf8");
  const containerPath = `/tmp/smoke-g13c1-${label}.sql`;
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
      throw new Error(`SQL ${label} falhou:\n${combined}`);
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

async function rpc(apiUrl, anonKey, token, body) {
  const res = await fetch(`${apiUrl}/rest/v1/rpc/list_operational_occurrences`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, data };
}

function idsOf(payload) {
  const items = payload?.items;
  if (!Array.isArray(items)) return [];
  return items.map((i) => i.id);
}

function setupSql(fieldProfileId) {
  return `
-- cleanup fixtures 13C.1
delete from public.occurrence_participants
  where occurrence_id in (
    '${OCC_A1}','${OCC_A2}','${OCC_B1}','${OCC_LEGACY}',
    ${OCC_A_PAGE.map((id) => `'${id}'`).join(",")}
  );
delete from public.occurrence_status_history
  where occurrence_id in (
    '${OCC_A1}','${OCC_A2}','${OCC_B1}','${OCC_LEGACY}',
    ${OCC_A_PAGE.map((id) => `'${id}'`).join(",")}
  );
delete from public.occurrences
  where id in (
    '${OCC_A1}','${OCC_A2}','${OCC_B1}','${OCC_LEGACY}',
    ${OCC_A_PAGE.map((id) => `'${id}'`).join(",")}
  );
delete from public.workspace_memberships
  where workspace_id in ('${WS_A}','${WS_B}','${WS_DENIED}','${WS_BETA_ONLY}');
delete from public.organization_workspace_links
  where workspace_id in ('${WS_A}','${WS_B}','${WS_DENIED}','${WS_BETA_ONLY}');
delete from public.workspaces
  where id in ('${WS_A}','${WS_B}','${WS_DENIED}','${WS_BETA_ONLY}');

insert into public.workspaces (id, name, code, is_active) values
  ('${WS_A}', 'Gate13C1 WSA', 'G13C1-A', true),
  ('${WS_B}', 'Gate13C1 WSB', 'G13C1-B', true),
  ('${WS_DENIED}', 'Gate13C1 Denied', 'G13C1-DENY', true),
  ('${WS_BETA_ONLY}', 'Gate13C1 BetaOnly', 'G13C1-BETA', true)
on conflict (id) do update set is_active = excluded.is_active, name = excluded.name;

insert into public.organization_workspace_links (organization_id, workspace_id, is_active) values
  ('${ALPHA_ORG}', '${WS_A}', true),
  ('${ALPHA_ORG}', '${WS_B}', true),
  ('${ALPHA_ORG}', '${WS_DENIED}', true),
  ('${BETA_ORG}', '${WS_BETA_ONLY}', true)
on conflict (organization_id, workspace_id) do update set is_active = excluded.is_active;

insert into public.workspace_memberships (organization_member_id, organization_id, workspace_id, is_active)
select om.id, om.organization_id, ws, true
from public.organization_members om
cross join (values ('${WS_A}'::uuid), ('${WS_B}'::uuid)) as t(ws)
where om.organization_id = '${ALPHA_ORG}'
  and om.profile_id = '${fieldProfileId}'
  and om.is_active = true;

-- template occurrence (severity/area/created_by)
with tpl as (
  select organization_id, area_id, severity, created_by
  from public.occurrences
  where organization_id = '${ALPHA_ORG}'
  order by created_at asc
  limit 1
)
insert into public.occurrences (
  id, organization_id, workspace_id, area_id, public_code, title, task_description,
  location_description, condition_description, severity, status, created_by, created_at
)
select v.id, t.organization_id, v.ws, t.area_id, v.code, v.title, 'task',
       'loc', 'cond', t.severity, 'PARALISACAO_PREVENTIVA', t.created_by, v.created_at
from tpl t
cross join (
  values
    ('${OCC_A1}'::uuid, '${WS_A}'::uuid, 'SS-G13C1-A1', 'G13C1 A1', timestamptz '2026-09-01 10:00:00+00'),
    ('${OCC_A2}'::uuid, '${WS_A}'::uuid, 'SS-G13C1-A2', 'G13C1 A2', timestamptz '2026-09-01 11:00:00+00'),
    ('${OCC_B1}'::uuid, '${WS_B}'::uuid, 'SS-G13C1-B1', 'G13C1 B1', timestamptz '2026-09-01 12:00:00+00'),
    ('${OCC_LEGACY}'::uuid, null::uuid, 'SS-G13C1-LEG', 'G13C1 LEGACY', timestamptz '2026-09-01 09:00:00+00'),
    ('${OCC_A_PAGE[0]}'::uuid, '${WS_A}'::uuid, 'SS-G13C1-P1', 'G13C1 PAGE1', timestamptz '2026-09-02 10:00:00+00'),
    ('${OCC_A_PAGE[1]}'::uuid, '${WS_A}'::uuid, 'SS-G13C1-P2', 'G13C1 PAGE2', timestamptz '2026-09-02 11:00:00+00'),
    ('${OCC_A_PAGE[2]}'::uuid, '${WS_A}'::uuid, 'SS-G13C1-P3', 'G13C1 PAGE3', timestamptz '2026-09-02 12:00:00+00'),
    ('${OCC_A_PAGE[3]}'::uuid, '${WS_A}'::uuid, 'SS-G13C1-P4', 'G13C1 PAGE4', timestamptz '2026-09-02 13:00:00+00'),
    ('${OCC_A_PAGE[4]}'::uuid, '${WS_A}'::uuid, 'SS-G13C1-P5', 'G13C1 PAGE5', timestamptz '2026-09-02 14:00:00+00')
) as v(id, ws, code, title, created_at);
`;
}

function cleanupSql() {
  return `
delete from public.occurrence_participants
  where occurrence_id in (
    '${OCC_A1}','${OCC_A2}','${OCC_B1}','${OCC_LEGACY}',
    ${OCC_A_PAGE.map((id) => `'${id}'`).join(",")}
  );
delete from public.occurrence_status_history
  where occurrence_id in (
    '${OCC_A1}','${OCC_A2}','${OCC_B1}','${OCC_LEGACY}',
    ${OCC_A_PAGE.map((id) => `'${id}'`).join(",")}
  );
delete from public.occurrences
  where id in (
    '${OCC_A1}','${OCC_A2}','${OCC_B1}','${OCC_LEGACY}',
    ${OCC_A_PAGE.map((id) => `'${id}'`).join(",")}
  );
delete from public.workspace_memberships
  where workspace_id in ('${WS_A}','${WS_B}','${WS_DENIED}','${WS_BETA_ONLY}');
delete from public.organization_workspace_links
  where workspace_id in ('${WS_A}','${WS_B}','${WS_DENIED}','${WS_BETA_ONLY}');
delete from public.workspaces
  where id in ('${WS_A}','${WS_B}','${WS_DENIED}','${WS_BETA_ONLY}');
`;
}

async function main() {
  const { apiUrl, anonKey } = loadSupabaseLocalEnv();
  const field = await signIn(apiUrl, anonKey, FIELD_EMAIL);
  const platform = await signIn(apiUrl, anonKey, PLATFORM_EMAIL);
  assert(field.access_token && field.user?.id, "field JWT");
  console.log(`JWT field=${field.user.id} (autorização autenticada)`);

  runSql(setupSql(field.user.id), "setup");
  console.log("fixtures OK");

  const baseArgs = {
    p_organization_id: ALPHA_ORG,
    p_search: null,
    p_area_id: null,
    p_contractor_organization_id: null,
    p_status: null,
    p_severity: null,
    p_ims_reference_code: null,
    p_cursor: null,
    p_limit: 50,
  };

  // Caso 1 — Workspace A
  let r = await rpc(apiUrl, anonKey, field.access_token, {
    ...baseArgs,
    p_workspace_id: WS_A,
  });
  let ids = idsOf(r.data);
  const onlyA =
    r.ok &&
    ids.every((id) => [OCC_A1, OCC_A2, ...OCC_A_PAGE].includes(id)) &&
    !ids.includes(OCC_B1) &&
    !ids.includes(OCC_LEGACY) &&
    ids.includes(OCC_A1) &&
    ids.includes(OCC_A2);
  record("C1_workspace_A", onlyA, `status=${r.status} ids=${ids.join(",")}`);

  // Caso 2 — Workspace B
  r = await rpc(apiUrl, anonKey, field.access_token, {
    ...baseArgs,
    p_workspace_id: WS_B,
  });
  ids = idsOf(r.data);
  const onlyB =
    r.ok && ids.length === 1 && ids[0] === OCC_B1 && !ids.includes(OCC_A1) && !ids.includes(OCC_LEGACY);
  record("C2_workspace_B", onlyB, `status=${r.status} ids=${ids.join(",")}`);

  // Caso 3 — NULL / omitido
  r = await rpc(apiUrl, anonKey, field.access_token, { ...baseArgs });
  ids = idsOf(r.data);
  const legacyOk =
    r.ok &&
    ids.includes(OCC_A1) &&
    ids.includes(OCC_B1) &&
    ids.includes(OCC_LEGACY);
  record("C3_null_omitido", legacyOk, `status=${r.status} contains A+B+LEGACY`);

  r = await rpc(apiUrl, anonKey, field.access_token, {
    ...baseArgs,
    p_workspace_id: null,
  });
  ids = idsOf(r.data);
  const nullOk =
    r.ok && ids.includes(OCC_A1) && ids.includes(OCC_B1) && ids.includes(OCC_LEGACY);
  record("C3b_explicit_null", nullOk, `status=${r.status}`);

  // Caso 4 — não autorizado
  r = await rpc(apiUrl, anonKey, field.access_token, {
    ...baseArgs,
    p_workspace_id: WS_DENIED,
  });
  const denied =
    !r.ok &&
    (String(r.data?.message ?? "").startsWith("FORBIDDEN") || r.status === 403);
  record("C4_nao_autorizado", denied, `status=${r.status} msg=${r.data?.message}`);

  // Caso 5 — org incompatível (platform admin + Alpha + WS só Beta)
  r = await rpc(apiUrl, anonKey, platform.access_token, {
    ...baseArgs,
    p_organization_id: ALPHA_ORG,
    p_workspace_id: WS_BETA_ONLY,
  });
  const mismatch =
    !r.ok && String(r.data?.message ?? "").startsWith("VALIDATION_ERROR");
  record("C5_org_incompativel", mismatch, `status=${r.status} msg=${r.data?.message}`);

  // Caso 6 — UUID arbitrário
  r = await rpc(apiUrl, anonKey, field.access_token, {
    ...baseArgs,
    p_workspace_id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
  });
  const arbitrary =
    !r.ok &&
    (String(r.data?.message ?? "").startsWith("FORBIDDEN") ||
      String(r.data?.message ?? "").startsWith("VALIDATION_ERROR")) &&
    !Array.isArray(r.data?.items);
  record("C6_uuid_arbitrario", arbitrary, `status=${r.status} msg=${r.data?.message}`);

  // Caso 7 — paginação keyset no Workspace A
  const page1 = await rpc(apiUrl, anonKey, field.access_token, {
    ...baseArgs,
    p_workspace_id: WS_A,
    p_limit: 3,
  });
  const p1Ids = idsOf(page1.data);
  const p1Ok =
    page1.ok &&
    p1Ids.length === 3 &&
    p1Ids.every((id) => [OCC_A1, OCC_A2, ...OCC_A_PAGE].includes(id)) &&
    !p1Ids.includes(OCC_B1) &&
    !p1Ids.includes(OCC_LEGACY) &&
    page1.data.hasNext === true &&
    page1.data.nextCursor?.id;

  const page2 = await rpc(apiUrl, anonKey, field.access_token, {
    ...baseArgs,
    p_workspace_id: WS_A,
    p_limit: 3,
    p_cursor: page1.data.nextCursor,
  });
  const p2Ids = idsOf(page2.data);
  const overlap = p1Ids.filter((id) => p2Ids.includes(id));
  const p2Ok =
    page2.ok &&
    p2Ids.length > 0 &&
    p2Ids.every((id) => [OCC_A1, OCC_A2, ...OCC_A_PAGE].includes(id)) &&
    !p2Ids.includes(OCC_B1) &&
    !p2Ids.includes(OCC_LEGACY) &&
    overlap.length === 0;

  record(
    "C7_paginacao",
    p1Ok && p2Ok,
    `p1=${p1Ids.join(",")} hasNext=${page1.data?.hasNext} p2=${p2Ids.join(",")} overlap=${overlap.length}`,
  );

  runSql(cleanupSql(), "cleanup");
  console.log("cleanup OK");

  const failed = results.filter((x) => !x.ok);
  if (failed.length > 0) {
    console.error("FAILED:", failed.map((f) => f.id).join(", "));
    process.exit(1);
  }
  console.log("ALL GATE 13C.1 CHECKS PASSED");
}

main().catch((err) => {
  console.error(err);
  try {
    runSql(cleanupSql(), "cleanup-on-error");
  } catch {
    // ignore
  }
  process.exit(1);
});
