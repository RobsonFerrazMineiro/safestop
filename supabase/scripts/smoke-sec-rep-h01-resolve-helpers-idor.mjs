/**
 * Smoke test — SEC-REP-H01 (achado bloqueante, auditoria SECURITY Sprint 3.3)
 *
 * Valida a correção da migration 20260823180000_fix_report_resolve_helpers_authorization.sql:
 * resolve_profile_display_name / resolve_organization_display_name /
 * resolve_member_display_name não podem mais ser usadas como IDOR — chamada
 * direta com UUID de organização/profile/member fora do escopo do chamador
 * deve retornar null, nunca o dado real.
 *
 * Cenário reproduzido (relatado no achado): qa-field (vínculo único com
 * organização Alpha, SEM report.read, SEM vínculo com Beta/Gamma/Epsilon)
 * chama os três helpers diretamente com UUIDs de fora do seu escopo.
 *
 * Uso: node supabase/scripts/smoke-sec-rep-h01-resolve-helpers-idor.mjs
 * Pré-requisito: Supabase local + seed aplicado (pnpm supabase:db:reset)
 */
import { loadSupabaseLocalEnv } from "./_local-env.mjs";

const PASSWORD = "SafeStop-QA-Local-2026";

// a0000000-...002 é membro de Beta (CONTRACTOR) e Gamma (INTERNAL) — nenhuma
// organização em comum com qa-field (Alpha). Sem vínculo, sem contrato Alpha↔Epsilon.
const BETA_GAMMA_PROFILE = "a0000000-0000-4000-8000-000000000002";
const BETA_MEMBER = "c0000000-0000-4000-8000-000000000002";
// Epsilon: contratada apenas de Beta (contrato QA-BE-001) — Alpha não possui
// nenhum contrato/vínculo com Epsilon, diferente de Beta (contrato QA-AB-001).
const EPSILON_ORG = "b0000000-0000-4000-8000-000000000006";

const USERS = {
  field: "qa-field@safestop.local",
  gestor: "qa-gestor@safestop.local",
};

const results = [];
function record(id, ok, detail) {
  results.push({ id, ok });
  console.log(`${ok ? "PASS" : "FAIL"} ${id}: ${detail}`);
}

async function signIn(apiUrl, anonKey, email) {
  const response = await fetch(`${apiUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: anonKey, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: PASSWORD }),
  });
  if (!response.ok) {
    throw new Error(`Login ${email} falhou (${response.status}): ${await response.text()}`);
  }
  return response.json();
}

async function rpc(apiUrl, anonKey, token, fn, body) {
  const response = await fetch(`${apiUrl}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => null);
  return { ok: response.ok, status: response.status, data };
}

async function main() {
  const { apiUrl, anonKey } = loadSupabaseLocalEnv();

  const fieldSession = await signIn(apiUrl, anonKey, USERS.field);
  const gestorSession = await signIn(apiUrl, anonKey, USERS.gestor);
  const fieldToken = fieldSession.access_token;
  const gestorToken = gestorSession.access_token;

  // SEC-REP-H01-01: qa-field chama resolve_profile_display_name com profile
  // de Beta/Gamma (nenhuma organização em comum) — deve retornar null, nunca o nome.
  const profileCall = await rpc(apiUrl, anonKey, fieldToken, "resolve_profile_display_name", {
    p_profile_id: BETA_GAMMA_PROFILE,
  });
  record(
    "SEC-REP-H01-01",
    profileCall.ok && profileCall.data === null,
    `resolve_profile_display_name(fora do escopo) → HTTP ${profileCall.status} data=${JSON.stringify(profileCall.data)} (esperado 200/null, nunca o nome real)`,
  );

  // SEC-REP-H01-02: qa-field chama resolve_organization_display_name com
  // Epsilon (sem contrato/vínculo com Alpha) — deve retornar null.
  const orgCall = await rpc(apiUrl, anonKey, fieldToken, "resolve_organization_display_name", {
    p_organization_id: EPSILON_ORG,
  });
  record(
    "SEC-REP-H01-02",
    orgCall.ok && orgCall.data === null,
    `resolve_organization_display_name(sem contrato) → HTTP ${orgCall.status} data=${JSON.stringify(orgCall.data)} (esperado 200/null, nunca o nome real)`,
  );

  // SEC-REP-H01-03: qa-field chama resolve_member_display_name com member de
  // Beta (organização fora de current_organization_ids) — deve retornar null.
  const memberCall = await rpc(apiUrl, anonKey, fieldToken, "resolve_member_display_name", {
    p_organization_member_id: BETA_MEMBER,
  });
  record(
    "SEC-REP-H01-03",
    memberCall.ok && memberCall.data === null,
    `resolve_member_display_name(fora do escopo) → HTTP ${memberCall.status} data=${JSON.stringify(memberCall.data)} (esperado 200/null, nunca o nome real)`,
  );

  // SEC-REP-H01-04 (sem regressão): qa-gestor (Alpha, contrato ativo com
  // Beta) continua resolvendo o nome da contratada legitimamente.
  const legitOrgCall = await rpc(apiUrl, anonKey, gestorToken, "resolve_organization_display_name", {
    p_organization_id: "b0000000-0000-4000-8000-000000000002",
  });
  record(
    "SEC-REP-H01-04",
    legitOrgCall.ok && legitOrgCall.data === "QA Beta Contratada",
    `resolve_organization_display_name(Beta, contrato ativo com Alpha) → data="${legitOrgCall.data}" (esperado "QA Beta Contratada" — sem regressão)`,
  );

  // SEC-REP-H01-05 (sem regressão): qualquer usuário resolve o próprio nome.
  const ownProfileCall = await rpc(apiUrl, anonKey, fieldToken, "resolve_profile_display_name", {
    p_profile_id: "a0000000-0000-4000-8000-000000000001",
  });
  record(
    "SEC-REP-H01-05",
    ownProfileCall.ok && typeof ownProfileCall.data === "string" && ownProfileCall.data.length > 0,
    `resolve_profile_display_name(próprio perfil) → data="${ownProfileCall.data}" (esperado nome real — sem regressão)`,
  );

  const failed = results.filter((entry) => !entry.ok);
  console.log("");
  console.log(`=== smoke-sec-rep-h01-resolve-helpers-idor: ${results.length - failed.length}/${results.length} PASS ===`);
  if (failed.length > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
