/**
 * Smoke Gate 13X.2.6 — origin lê a PP + embed areas.
 *
 * NÃO apaga a occurrence persistida 65cfed0c-76d5-443d-9f34-06f75aab671f.
 *
 * Uso: node supabase/scripts/smoke-workspace-gate13x26.mjs
 */
import { loadSupabaseLocalEnv } from "./_local-env.mjs";

const OCCURRENCE_ID = "65cfed0c-76d5-443d-9f34-06f75aab671f";
const HYDRO_ORG = "b141f000-0000-4000-8000-000000000001";
const TUV_ORG = "b141f000-0000-4000-8000-000000000003";
const KW_ORG = "b141f000-0000-4000-8000-000000000011";
const CONTRACT_A = "d141f000-0000-4000-8000-000000000011";
const HYDRO_FIELD_MEMBER = "c141f000-0000-4000-8000-000000000104";
const LOCAL_PASSWORD = "SafeStop-QA-Local-2026";
const TUV_EMAIL = "tuv.safety@safestop.local";
const HYDRO_FIELD_EMAIL = "hydro.safety@safestop.local";
const KW_EMAIL = "kw.encarregado@safestop.local";
const ALIEN_EMAIL = "qa-field@safestop.local";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
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
  const tuv = await signIn(apiUrl, anonKey, TUV_EMAIL, LOCAL_PASSWORD);
  const hydro = await signIn(apiUrl, anonKey, HYDRO_FIELD_EMAIL, LOCAL_PASSWORD);
  const kw = await signIn(apiUrl, anonKey, KW_EMAIL, LOCAL_PASSWORD);
  const alien = await signIn(apiUrl, anonKey, ALIEN_EMAIL, LOCAL_PASSWORD);

  const row = await rest(apiUrl, anonKey, tuv.access_token, {
    method: "GET",
    path: `occurrences?id=eq.${OCCURRENCE_ID}&select=id,origin_organization_id,contractor_organization_id,organization_id,workspace_id`,
  });
  assert(row.ok && Array.isArray(row.body) && row.body.length === 1, `TÜV GET occurrence ${JSON.stringify(row)}`);
  assert(row.body[0].origin_organization_id === TUV_ORG, "origin deve ser TÜV");
  assert(row.body[0].organization_id === HYDRO_ORG, "tenant deve ser Hydro");
  assert(row.body[0].contractor_organization_id === KW_ORG, "contractor deve ser KW");
  console.log("PASS Técnico origin GET occurrence: 1 row origin=TÜV tenant=Hydro contractor=KW");

  const embed = await rest(apiUrl, anonKey, tuv.access_token, {
    method: "GET",
    path: `occurrences?id=eq.${OCCURRENCE_ID}&select=id,areas(name)`,
  });
  assert(embed.status === 200, `embed areas esperado 200, não PGRST200: ${embed.status} ${JSON.stringify(embed.body)}`);
  assert(embed.body?.[0]?.areas?.name, `areas.name ausente: ${JSON.stringify(embed.body)}`);
  console.log("PASS GET areas(name) → 200, embed PostgREST restaurado");

  const history = await rest(apiUrl, anonKey, tuv.access_token, {
    method: "GET",
    path: `occurrence_status_history?occurrence_id=eq.${OCCURRENCE_ID}&select=id`,
  });
  assert(history.ok && Array.isArray(history.body) && history.body.length >= 1,
    `history >=1: ${JSON.stringify(history)}`);
  console.log("PASS history >= 1");

  const timeline = await rest(apiUrl, anonKey, tuv.access_token, {
    method: "POST",
    path: "rpc/get_occurrence_timeline",
    body: { p_occurrence_id: OCCURRENCE_ID },
  });
  assert(timeline.ok && timeline.body?.success === true,
    `timeline success: ${JSON.stringify(timeline)}`);
  console.log("PASS get_occurrence_timeline success true");

  const hydroRow = await rest(apiUrl, anonKey, hydro.access_token, {
    method: "GET",
    path: `occurrences?id=eq.${OCCURRENCE_ID}&select=id`,
  });
  assert(hydroRow.ok && hydroRow.body?.[0]?.id === OCCURRENCE_ID, `Campo Hydro ${JSON.stringify(hydroRow)}`);
  console.log("PASS Campo Hydro (tenant) lê a row");

  const kwRow = await rest(apiUrl, anonKey, kw.access_token, {
    method: "GET",
    path: `occurrences?id=eq.${OCCURRENCE_ID}&select=id`,
  });
  assert(kwRow.ok && kwRow.body?.[0]?.id === OCCURRENCE_ID, `KW contractor ${JSON.stringify(kwRow)}`);
  console.log("PASS KW contractor com read lê a row");

  const alienRow = await rest(apiUrl, anonKey, alien.access_token, {
    method: "GET",
    path: `occurrences?id=eq.${OCCURRENCE_ID}&select=id`,
  });
  assert(alienRow.ok && Array.isArray(alienRow.body) && alienRow.body.length === 0,
    `org alheia 0 rows: ${JSON.stringify(alienRow)}`);
  console.log("PASS org alheia → 0 rows");

  const assignInsert = await rest(apiUrl, anonKey, tuv.access_token, {
    method: "POST",
    path: "contract_assignments",
    body: {
      organization_member_id: HYDRO_FIELD_MEMBER,
      organization_id: HYDRO_ORG,
      contract_id: CONTRACT_A,
      assignment_role: "FISCAL",
    },
  });
  assert(!writeCreatedRow(assignInsert) && assignInsert.status === 403,
    `INSERT assignment Hydro ${assignInsert.status} ${JSON.stringify(assignInsert.body)}`);
  console.log("PASS INSERT assignment Hydro pelo técnico → 403");

  console.log("ALL GATE 13X.2.6 CHECKS PASSED");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
