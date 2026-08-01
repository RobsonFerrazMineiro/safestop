import { execSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { loadSupabaseLocalEnv } from "./_local-env.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..", "..");

const QA_ALPHA_ORG_ID = "b0000000-0000-4000-8000-000000000001";
const QA_BETA_ORG_ID = "b0000000-0000-4000-8000-000000000002";
const QA_ALPHA_AREA_ID = "f0000000-0000-4000-8000-000000000001";
const QA_BETA_AREA_ID = "f0000000-0000-4000-8000-000000000002";
const QA_ALPHA_UNIT_ID = "e0000000-0000-4000-8000-000000000001";
const QA_BETA_UNIT_ID = "e0000000-0000-4000-8000-000000000002";

function runQuery(sql) {
  return execSync(`pnpm exec supabase db query --local ${JSON.stringify(sql)}`, {
    cwd: REPO_ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function queryContractsByClient(clientOrgId) {
  const sql = `select ctr.id as contractor_id, ctr.name as contractor, c.id as contract_id, c.contract_number, c.is_active from public.contracts c join public.organizations ctr on ctr.id = c.contractor_organization_id where c.client_organization_id = '${clientOrgId}' and c.is_active = true order by c.contract_number`;
  return runQuery(sql);
}

function main() {
  loadSupabaseLocalEnv();

  console.log("=== Validação seed A-R2 (contratada → contrato) ===\n");

  const areasSql = `select a.id, a.name, u.id as unit_id, u.name as unit_name, o.name as org_name from public.areas a join public.units u on u.id = a.unit_id join public.organizations o on o.id = a.organization_id where a.id in ('${QA_ALPHA_AREA_ID}', '${QA_BETA_AREA_ID}') order by a.id`;

  console.log("1) areas/units QA (A2 — seed 2.0):");
  const areasOutput = runQuery(areasSql);
  console.log(areasOutput);

  console.log("2) contratadas/contratos — org Alpha:");
  const alphaOutput = queryContractsByClient(QA_ALPHA_ORG_ID);
  console.log(alphaOutput);

  console.log("3) contratadas/contratos — org Beta:");
  const betaOutput = queryContractsByClient(QA_BETA_ORG_ID);
  console.log(betaOutput);

  const alphaOk =
    alphaOutput.includes("QA Beta Contratada") && alphaOutput.includes("QA-AB-001");
  const betaOk =
    betaOutput.includes("QA Epsilon Serviços") && betaOutput.includes("QA-BE-001");
  const areasOk =
    areasOutput.includes(QA_ALPHA_UNIT_ID) && areasOutput.includes(QA_BETA_UNIT_ID);

  if (!alphaOk || !betaOk || !areasOk) {
    throw new Error("Seed A-R2 incompleto — revisar organizations/contracts/areas");
  }

  console.log("\nOK — seed A-R2 validado (Alpha→Beta, Beta→Epsilon; areas/units intactas).");
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
