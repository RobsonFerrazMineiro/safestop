/**
 * Smoke Gate 13X.2.8 — WRITE evidência origin/tenant/contractor.
 *
 * NÃO apaga a occurrence 65cfed0c-76d5-443d-9f34-06f75aab671f.
 * PENDING é marcado FAILED (fail_) — sem COMPLETED residual.
 *
 * Uso: node supabase/scripts/smoke-workspace-gate13x28.mjs
 */
import { loadSupabaseLocalEnv } from "./_local-env.mjs";

const OCCURRENCE_ID = "65cfed0c-76d5-443d-9f34-06f75aab671f";
const HYDRO_ORG = "b141f000-0000-4000-8000-000000000001";
const CONTRACT_A = "d141f000-0000-4000-8000-000000000011";
const HYDRO_FIELD_MEMBER = "c141f000-0000-4000-8000-000000000104";
const LOCAL_PASSWORD = "SafeStop-QA-Local-2026";
const TUV_EMAIL = "tuv.safety@safestop.local";
const HYDRO_FIELD_EMAIL = "hydro.safety@safestop.local";
const ALIEN_EMAIL = "qa-field@safestop.local";
const GERENCIADORA_OTHER_EMAIL = "arcadis.safety@safestop.local";

const MINIMAL_JPEG = Buffer.from(
  "/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBxAQEBUQEBAVFRUVFRUVFRUVFRUWFxUVFRUXFxUYHSggGBolGxUVITEhJSkrLi4uFx8zODMsNygtLisBCgoKDg0OGxAQGy0lHyUtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLf/AABEIAAEAAQMBIgACEQEDEQH/xAAXAAEBAQEAAAAAAAAAAAAAAAAAAQID/8QAFhEBAQEAAAAAAAAAAAAAAAAAAAER/9oADAMBAAIQAxAAAAG6p//EABQQAQAAAAAAAAAAAAAAAAAAAJD/2gAIAQEAAQUCcJ//xAAUEQEAAAAAAAAAAAAAAAAAAACQ/9oACAEDAQE/AXCf/8QAFBEBAAAAAAAAAAAAAAAAAAAAkP/aAAgBAgEBPwFwn//EABQQAQAAAAAAAAAAAAAAAAAAAJD/2gAIAQEABj8CcJ//xAAUEAEAAAAAAAAAAAAAAAAAAACQ/9oACAEBAAE/IXCf/9k=",
  "base64",
);

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

function isForbidden(body) {
  return body?.success === false && body?.error?.code === "FORBIDDEN";
}

async function prepareEvidence(apiUrl, anonKey, token) {
  return rest(apiUrl, anonKey, token, {
    method: "POST",
    path: "rpc/prepare_occurrence_attachment_upload",
    body: {
      payload: {
        occurrence_id: OCCURRENCE_ID,
        attachment_type: "INITIAL_EVIDENCE",
        original_file_name: "13x28.jpg",
        mime_type: "image/jpeg",
        file_size: MINIMAL_JPEG.byteLength,
      },
    },
  });
}

async function failEvidence(apiUrl, anonKey, token, attachmentId) {
  return rest(apiUrl, anonKey, token, {
    method: "POST",
    path: "rpc/fail_occurrence_attachment_upload",
    body: {
      target_attachment_id: attachmentId,
      failure_reason: "smoke-13x28-cleanup",
    },
  });
}

async function main() {
  const { apiUrl, anonKey } = loadSupabaseLocalEnv();
  const tuv = await signIn(apiUrl, anonKey, TUV_EMAIL, LOCAL_PASSWORD);
  const hydro = await signIn(apiUrl, anonKey, HYDRO_FIELD_EMAIL, LOCAL_PASSWORD);
  const alien = await signIn(apiUrl, anonKey, ALIEN_EMAIL, LOCAL_PASSWORD);
  const otherGov = await signIn(apiUrl, anonKey, GERENCIADORA_OTHER_EMAIL, LOCAL_PASSWORD);

  const read = await rest(apiUrl, anonKey, tuv.access_token, {
    method: "GET",
    path: `occurrences?id=eq.${OCCURRENCE_ID}&select=id,origin_organization_id,organization_id`,
  });
  assert(read.ok && read.body?.length === 1, `READ 13X.2.6 ${JSON.stringify(read)}`);
  console.log("PASS READ origin 1 row (regressão 13X.2.6)");

  const tuvPrepare = await prepareEvidence(apiUrl, anonKey, tuv.access_token);
  assert(tuvPrepare.body?.success === true && tuvPrepare.body?.data?.upload_status === "PENDING",
    `TÜV prepare ${JSON.stringify(tuvPrepare)}`);
  const tuvFail = await failEvidence(apiUrl, anonKey, tuv.access_token, tuvPrepare.body.data.attachment_id);
  assert(tuvFail.body?.success === true && tuvFail.body?.data?.upload_status === "FAILED",
    `TÜV fail cleanup ${JSON.stringify(tuvFail)}`);
  console.log("PASS origin prepare PENDING + fail_ cleanup (sem COMPLETED)");

  const hydroPrepare = await prepareEvidence(apiUrl, anonKey, hydro.access_token);
  assert(hydroPrepare.body?.success === true && hydroPrepare.body?.data?.upload_status === "PENDING",
    `Hydro prepare ${JSON.stringify(hydroPrepare)}`);
  const hydroFail = await failEvidence(apiUrl, anonKey, hydro.access_token, hydroPrepare.body.data.attachment_id);
  assert(hydroFail.body?.success === true, `Hydro fail cleanup ${JSON.stringify(hydroFail)}`);
  console.log("PASS tenant hydro.safety prepare → success + fail_");

  const alienPrepare = await prepareEvidence(apiUrl, anonKey, alien.access_token);
  assert(isForbidden(alienPrepare.body), `qa-field prepare esperado FORBIDDEN ${JSON.stringify(alienPrepare)}`);
  console.log("PASS qa-field prepare → FORBIDDEN");

  const govPrepare = await prepareEvidence(apiUrl, anonKey, otherGov.access_token);
  assert(isForbidden(govPrepare.body),
    `GERENCIADORA alheia prepare esperado FORBIDDEN ${JSON.stringify(govPrepare)}`);
  console.log("PASS GERENCIADORA sem ser origin/tenant/contractor da row → FORBIDDEN");

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

  console.log("ALL GATE 13X.2.8 CHECKS PASSED");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
