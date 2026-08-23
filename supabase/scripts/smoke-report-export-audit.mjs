/**
 * Smoke test — log_report_export / report_export_audit (Sprint 3.3, PO-REP-6)
 *
 * Referência: docs/decisions/REPORTS-DECISIONS.md (schema exato PO-REP-6)
 * Valida: linha criada com filters/row_count corretos, rejeição sem
 * report.read, RLS nunca vaza entre organizações.
 *
 * Uso: node supabase/scripts/smoke-report-export-audit.mjs
 * Pré-requisito: Supabase local + seed aplicado (pnpm supabase:db:reset)
 */
import { loadSupabaseLocalEnv, runLocalSql } from "./_local-env.mjs";

const PASSWORD = "SafeStop-QA-Local-2026";

const QA_ALPHA_ORG = "b0000000-0000-4000-8000-000000000001";
const QA_BETA_ORG = "b0000000-0000-4000-8000-000000000002";

const USERS = {
  gestor: "qa-gestor@safestop.local",
  field: "qa-field@safestop.local",
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

async function selectAudit(apiUrl, anonKey, token, organizationId) {
  const params = new URLSearchParams({
    select: "id,organization_id,report_type,export_format,filters,row_count,exported_by",
    organization_id: `eq.${organizationId}`,
    order: "created_at.desc",
    limit: "20",
  });
  const response = await fetch(`${apiUrl}/rest/v1/report_export_audit?${params}`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${token}` },
  });
  return { ok: response.ok, status: response.status, data: await response.json().catch(() => null) };
}

function cleanupFixture(rowId) {
  if (!rowId) {
    return;
  }
  try {
    runLocalSql(`delete from public.report_export_audit where id = '${rowId}';`);
  } catch {
    // fixture ausente
  }
}

async function main() {
  const { apiUrl, anonKey } = loadSupabaseLocalEnv();

  const gestorSession = await signIn(apiUrl, anonKey, USERS.gestor);
  const fieldSession = await signIn(apiUrl, anonKey, USERS.field);
  const gestorToken = gestorSession.access_token;
  const fieldToken = fieldSession.access_token;

  const marker = `REP-AUDIT-${Date.now()}`;
  let createdRowId = null;

  try {
    // REP-AUDIT-01: qa-gestor (report.read) registra exportação com sucesso.
    const before = await selectAudit(apiUrl, anonKey, gestorToken, QA_ALPHA_ORG);
    const beforeIds = new Set((before.data ?? []).map((row) => row.id));

    const logResult = await rpc(apiUrl, anonKey, gestorToken, "log_report_export", {
      p_organization_id: QA_ALPHA_ORG,
      p_report_type: "OCCURRENCES",
      p_export_format: "CSV",
      p_filters: { marker, periodStart: "2026-01-01T00:00:00Z" },
      p_row_count: 5,
    });
    record("REP-AUDIT-01", logResult.ok, `log_report_export (gestor) HTTP ${logResult.status}`);

    const after = await selectAudit(apiUrl, anonKey, gestorToken, QA_ALPHA_ORG);
    const newRow = (after.data ?? []).find(
      (row) => !beforeIds.has(row.id) && row.filters?.marker === marker,
    );
    createdRowId = newRow?.id ?? null;

    // REP-AUDIT-02: linha criada com row_count/filters corretos.
    record(
      "REP-AUDIT-02",
      newRow?.row_count === 5 &&
        newRow?.report_type === "OCCURRENCES" &&
        newRow?.export_format === "CSV" &&
        newRow?.filters?.marker === marker,
      `linha criada: row_count=${newRow?.row_count} report_type=${newRow?.report_type} export_format=${newRow?.export_format}`,
    );

    // REP-AUDIT-03: rejeição sem report.read (qa-field).
    const deniedLog = await rpc(apiUrl, anonKey, fieldToken, "log_report_export", {
      p_organization_id: QA_ALPHA_ORG,
      p_report_type: "OCCURRENCES",
      p_export_format: "CSV",
      p_filters: {},
      p_row_count: 1,
    });
    record(
      "REP-AUDIT-03",
      !deniedLog.ok && (deniedLog.status === 403 || deniedLog.status === 400),
      `log_report_export (field, sem report.read) HTTP ${deniedLog.status} (esperado 403/400)`,
    );

    // REP-AUDIT-04: cross-tenant — qa-field tenta registrar em Beta (sem vínculo).
    const crossTenantLog = await rpc(apiUrl, anonKey, fieldToken, "log_report_export", {
      p_organization_id: QA_BETA_ORG,
      p_report_type: "OCCURRENCES",
      p_export_format: "CSV",
      p_filters: {},
      p_row_count: 1,
    });
    record(
      "REP-AUDIT-04",
      !crossTenantLog.ok && (crossTenantLog.status === 403 || crossTenantLog.status === 400),
      `log_report_export cross-tenant field→Beta HTTP ${crossTenantLog.status} (esperado 403/400)`,
    );

    // REP-AUDIT-05: INSERT direto (sem RPC) é negado — escrita exclusiva via RPC.
    const directInsert = await fetch(`${apiUrl}/rest/v1/report_export_audit`, {
      method: "POST",
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${gestorToken}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        organization_id: QA_ALPHA_ORG,
        exported_by: "a0000000-0000-4000-8000-000000000008",
        report_type: "OCCURRENCES",
        export_format: "CSV",
        filters: {},
        row_count: 999,
      }),
    });
    record(
      "REP-AUDIT-05",
      !directInsert.ok,
      `INSERT direto (sem RPC) rejeitado — HTTP ${directInsert.status} (esperado 4xx)`,
    );

    // REP-AUDIT-06: RLS não vaza entre organizações — qa-gestor (só Alpha)
    // não vê linhas de Beta via SELECT direto.
    const betaLeak = await selectAudit(apiUrl, anonKey, gestorToken, QA_BETA_ORG);
    record(
      "REP-AUDIT-06",
      betaLeak.ok && Array.isArray(betaLeak.data) && betaLeak.data.length === 0,
      `SELECT report_export_audit organization_id=Beta como gestor Alpha retornou ${betaLeak.data?.length ?? "erro"} linhas (esperado 0)`,
    );
  } finally {
    cleanupFixture(createdRowId);
    console.log("Cleanup: fixture REP-AUDIT removido.");
  }

  const failed = results.filter((entry) => !entry.ok);
  console.log("");
  console.log(`=== smoke-report-export-audit: ${results.length - failed.length}/${results.length} PASS ===`);
  if (failed.length > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
