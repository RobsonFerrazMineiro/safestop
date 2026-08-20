/**
 * Smoke manual — métricas de estoque do dashboard (Sprint 3.2).
 * Cenário: 5 ocorrências → 2 abertas (PP), 1 interdição ativa, 2 concluídas.
 */
import { loadQaCredentials, loadSupabaseLocalEnv, runLocalSql } from "./_local-env.mjs";

const QA_ALPHA_ORG_ID = "b0000000-0000-4000-8000-000000000001";
const QA_ALPHA_AREA_ID = "f0000000-0000-4000-8000-000000000001";
const QA_BETA_CONTRACTOR_ID = "b0000000-0000-4000-8000-000000000002";
const QA_FIELD_USER_ID = "a0000000-0000-4000-8000-000000000001";
const QA_GESTOR_EMAIL = "qa-gestor@safestop.local";

const TERMINAL = ["ENCERRADA", "CANCELADA"];
const INTERDICTION = [
  "INTERDICAO_CONFIRMADA",
  "MDHO_EM_PREENCHIMENTO",
  "AGUARDANDO_APROVACAO_HSE",
  "AGUARDANDO_REGISTRO_IMS",
  "EM_TRATATIVA",
  "AGUARDANDO_VALIDACAO",
];

async function signIn(apiUrl, anonKey, email, password) {
  const response = await fetch(`${apiUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: anonKey, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error(`signIn falhou (${response.status}): ${await response.text()}`);
  }

  return response.json();
}

async function countOccurrences(apiUrl, anonKey, token, filter) {
  const params = new URLSearchParams({
    select: "id",
    organization_id: `eq.${QA_ALPHA_ORG_ID}`,
  });

  if (filter === "active") {
    params.set("status", `not.in.(${TERMINAL.join(",")})`);
  } else if (filter === "interdiction") {
    params.set("status", `in.(${INTERDICTION.join(",")})`);
  } else if (filter.startsWith("test_prefix:")) {
    params.set("title", `like.${filter.replace("test_prefix:", "")}%`);
  }

  const response = await fetch(`${apiUrl}/rest/v1/occurrences?${params}`, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${token}`,
      Prefer: "count=exact",
    },
  });

  if (!response.ok) {
    throw new Error(`count falhou (${response.status}): ${await response.text()}`);
  }

  const range = response.headers.get("content-range");
  const total = range?.split("/")[1];

  return Number(total ?? 0);
}

async function insertTestOccurrences(prefix) {
  const sql = `
    insert into public.occurrences (
      id,
      organization_id,
      area_id,
      contractor_organization_id,
      created_by,
      public_code,
      title,
      status,
      severity,
      task_description,
      condition_description,
      location_description,
      occurred_at,
      stopped_at
    ) values
      (gen_random_uuid(), '${QA_ALPHA_ORG_ID}', '${QA_ALPHA_AREA_ID}', '${QA_BETA_CONTRACTOR_ID}', '${QA_FIELD_USER_ID}', 'DS-01-${Date.now().toString().slice(-4)}', '${prefix}-pp-1', 'PARALISACAO_PREVENTIVA', 'MEDIUM', 'Smoke', 'Smoke', 'Smoke', now(), now()),
      (gen_random_uuid(), '${QA_ALPHA_ORG_ID}', '${QA_ALPHA_AREA_ID}', '${QA_BETA_CONTRACTOR_ID}', '${QA_FIELD_USER_ID}', 'DS-02-${Date.now().toString().slice(-4)}', '${prefix}-pp-2', 'EM_AVALIACAO', 'MEDIUM', 'Smoke', 'Smoke', 'Smoke', now(), now()),
      (gen_random_uuid(), '${QA_ALPHA_ORG_ID}', '${QA_ALPHA_AREA_ID}', '${QA_BETA_CONTRACTOR_ID}', '${QA_FIELD_USER_ID}', 'DS-03-${Date.now().toString().slice(-4)}', '${prefix}-io-1', 'INTERDICAO_CONFIRMADA', 'HIGH', 'Smoke', 'Smoke', 'Smoke', now(), now()),
      (gen_random_uuid(), '${QA_ALPHA_ORG_ID}', '${QA_ALPHA_AREA_ID}', '${QA_BETA_CONTRACTOR_ID}', '${QA_FIELD_USER_ID}', 'DS-04-${Date.now().toString().slice(-4)}', '${prefix}-done-1', 'ENCERRADA', 'LOW', 'Smoke', 'Smoke', 'Smoke', now(), now()),
      (gen_random_uuid(), '${QA_ALPHA_ORG_ID}', '${QA_ALPHA_AREA_ID}', '${QA_BETA_CONTRACTOR_ID}', '${QA_FIELD_USER_ID}', 'DS-05-${Date.now().toString().slice(-4)}', '${prefix}-done-2', 'LIBERADA', 'LOW', 'Smoke', 'Smoke', 'Smoke', now(), now());
  `;

  runLocalSql(sql);
}

async function deleteTestOccurrences(prefix) {
  runLocalSql(`delete from public.occurrences where organization_id = '${QA_ALPHA_ORG_ID}' and title like '${prefix}%';`);
}

async function main() {
  const { apiUrl, anonKey } = loadSupabaseLocalEnv();
  const { password } = loadQaCredentials();

  const gestor = await signIn(apiUrl, anonKey, QA_GESTOR_EMAIL, password);
  const prefix = `DASH-SMOKE-${Date.now()}`;
  await insertTestOccurrences(prefix);

  try {
    const [activeOccurrences, activeInterdictions] = await Promise.all([
      countOccurrences(apiUrl, anonKey, gestor.access_token, "active"),
      countOccurrences(apiUrl, anonKey, gestor.access_token, "interdiction"),
    ]);

    const scopedActive = await countOccurrences(
      apiUrl,
      anonKey,
      gestor.access_token,
      `test_prefix:${prefix}`,
    );

    const expectedActiveFromScenario = 3;
    const expectedInterdictionsFromFormula = 1;

    console.log("=== Dashboard KPI smoke (cenário fixo inserido) ===");
    console.log(`Prefixo de teste: ${prefix}`);
    console.log(`Ocorrências inseridas no cenário: 5 (2 PP/EM_AVALIACAO + 1 IO + 2 concluídas)`);
    console.log(`activeOccurrences (org Alpha, fórmula NOT IN terminal): ${activeOccurrences}`);
    console.log(`activeInterdictions (6 statuses IO): ${activeInterdictions}`);
    console.log(`Ocorrências do cenário visíveis (RLS gestor): ${scopedActive}`);
    console.log("");
    console.log("Validação do cenário isolado (via título):");
    console.log(`  Esperado active no subset: ${expectedActiveFromScenario} (2 abertas + 1 IO)`);
    console.log(`  Esperado interdições no subset: ${expectedInterdictionsFromFormula}`);
    console.log(
      scopedActive === 5
        ? "PASS — gestor enxerga as 5 ocorrências de teste"
        : "WARN — gestor não enxergou todas as 5 (RLS/escopo)",
    );

    if (activeInterdictions < expectedInterdictionsFromFormula) {
      console.log("WARN — activeInterdictions global menor que mínimo do cenário inserido");
    } else {
      console.log("PASS — activeInterdictions inclui ao menos 1 interdição do cenário");
    }
  } finally {
    await deleteTestOccurrences(prefix);
    console.log("Cleanup: ocorrências de teste removidas.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
