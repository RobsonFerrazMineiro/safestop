import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..", "..");

/** Subset ~50 casos críticos PO-CON-17 (matrizes 2.3–2.8 + consolidação 2.9). */
const CRITICAL_MATRIX = {
  "qa-sw-01-12.mjs": ["SW-01", "SW-04", "SW-05", "SW-07", "SW-11"],
  "qa-ev-01-20.mjs": ["EV-01", "EV-03", "EV-05", "EV-08"],
  "qa-tl-01-20.mjs": ["TL-01", "TL-02", "TL-05", "TL-08", "TL-10", "TL-13", "TL-15"],
  "qa-va-01-18.mjs": ["VA-01", "VA-03", "VA-08", "VA-12", "VA-16"],
  "qa-io-01-12.mjs": ["IO-01", "IO-03", "IO-08", "IO-10", "IO-12"],
  "qa-mdho-01-16.mjs": ["MDHO-01", "MDHO-02", "MDHO-06", "MDHO-07", "MDHO-09", "MDHO-14"],
  "qa-hse-01-20.mjs": ["HSE-01", "HSE-03", "HSE-06", "HSE-07", "HSE-09", "HSE-13", "HSE-16"],
  "qa-ims-01-16.mjs": ["IMS-01", "IMS-03", "IMS-05", "IMS-08", "IMS-09", "IMS-15"],
};

const CONSOLIDATION_CHECKS = [
  "CON-CACHE-01",
  "CON-ROUTE-01",
  "CON-DETAIL-01",
  "CON-IMS-FILTER-01",
  "CON-BANNER-01",
  "CON-QUERY-01",
];

const results = new Map();

function record(id, status, detail) {
  results.set(id, { id, status, detail });
  console.log(`${status === "PASS" ? "PASS" : "FAIL"} ${id}: ${detail}`);
}

function readRepo(rel) {
  return readFileSync(join(REPO_ROOT, rel), "utf8");
}

function hasStopWorkTimelineImports() {
  try {
    const out = execSync(
      'pnpm exec rg -l "StopWorkTimeline" apps packages --glob "!**/stop-work-timeline.tsx" --glob "!**/*.md"',
      { cwd: REPO_ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
    ).trim();
    return out.length === 0;
  } catch {
    return true;
  }
}

function parseScriptOutput(scriptName, output, expectedIds) {
  const lines = output.split(/\r?\n/);
  const found = new Map();

  for (const line of lines) {
    const match = line.match(/^(PASS|FAIL)\s+([\w-]+):\s*(.*)$/);
    if (!match) continue;
    const [, status, id, detail] = match;
    if (expectedIds.includes(id)) {
      found.set(id, { status, detail });
    }
  }

  for (const id of expectedIds) {
    const entry = found.get(id);
    if (!entry) {
      record(id, "FAIL", `ausente na saída de ${scriptName}`);
    } else if (entry.status === "PASS") {
      record(id, "PASS", entry.detail);
    } else {
      record(id, "FAIL", entry.detail);
    }
  }
}

function runMatrixScript(scriptName, expectedIds) {
  const scriptPath = join(__dirname, scriptName);
  let output = "";
  let exitCode = 0;

  try {
    output = execSync(`node "${scriptPath}"`, {
      cwd: REPO_ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      maxBuffer: 20 * 1024 * 1024,
    });
  } catch (error) {
    exitCode = error.status ?? 1;
    output = `${error.stdout ?? ""}${error.stderr ?? ""}`;
  }

  parseScriptOutput(scriptName, output, expectedIds);

  if (exitCode !== 0) {
    const failedInScript = expectedIds.filter((id) => !results.has(id) || results.get(id)?.status === "FAIL");
    if (failedInScript.length === 0) {
      console.warn(`   aviso: ${scriptName} exit ${exitCode} — IDs críticos extraídos OK`);
    }
  }
}

function runConsolidationCodeChecks() {
  const webOrg = readRepo("apps/web/src/features/organization/provider/organization-provider.tsx");
  const mobOrg = readRepo("apps/mobile/src/features/organization/provider/organization-provider.tsx");
  const webClear = readRepo("apps/web/src/features/organization/services/clear-tenant-cache.ts");
  const mobClear = readRepo("apps/mobile/src/features/organization/services/clear-tenant-cache.ts");

  if (
    webOrg.includes("clearTenantCache(queryClient)") &&
    mobOrg.includes("clearTenantCache(queryClient)") &&
    webClear.includes("TENANT_QUERY_KEY_PREFIX") &&
    mobClear.includes("TENANT_QUERY_KEY_PREFIX")
  ) {
    record("CON-CACHE-01", "PASS", "org switch limpa tenant cache Web + Mobile");
  } else {
    record("CON-CACHE-01", "FAIL", "clearTenantCache ausente no switch de org");
  }

  const webForbidden = readRepo("apps/web/src/app/(app)/forbidden/page.tsx");
  const mobForbidden = readRepo("apps/mobile/app/(app)/forbidden.tsx");
  const webRequire = readRepo("apps/web/src/features/authorization/hooks/use-require-permission.ts");
  const mobRequire = readRepo("apps/mobile/src/features/authorization/hooks/use-require-permission.ts");

  if (
    webForbidden.includes("AuthorizationForbidden") &&
    mobForbidden.length > 0 &&
    webRequire.includes('"/forbidden"') &&
    mobRequire.includes("authRoutes.forbidden")
  ) {
    record("CON-ROUTE-01", "PASS", "rota /forbidden + redirect useRequirePermission");
  } else {
    record("CON-ROUTE-01", "FAIL", "forbidden route incompleta");
  }

  const webOccRedirect = readRepo("apps/web/src/app/(app)/occurrences/[id]/page.tsx");
  const mobOccRedirect = readRepo("apps/mobile/app/(app)/occurrences/[id].tsx");
  const mobRoutes = readRepo("apps/mobile/src/lib/auth/routes.ts");

  if (
    webOccRedirect.includes('redirect(`/stop-work/${id}`)') &&
    mobOccRedirect.includes("stopWorkDetailRoute") &&
    mobRoutes.includes("occurrenceDetailRoute")
  ) {
    record("CON-DETAIL-01", "PASS", "detalhe canônico /stop-work/:id (redirect occurrences legado)");
  } else {
    record("CON-DETAIL-01", "FAIL", "redirect detalhe unificado ausente");
  }

  const webList = readRepo("apps/web/src/features/stop-work/components/stop-work-list-container.tsx");
  const mobList = readRepo("apps/mobile/src/features/stop-work/components/preventive-stop-list-screen.tsx");
  const getOcc = readRepo("apps/web/src/features/occurrences/services/get-occurrences.ts");

  if (
    webList.includes("imsReferenceCode") &&
    mobList.includes("Limpar filtro IMS") &&
    getOcc.includes('ilike("ims_reference_code"')
  ) {
    record("CON-IMS-FILTER-01", "PASS", "filtro IMS visual Web + Mobile + ilike backend");
  } else {
    record("CON-IMS-FILTER-01", "FAIL", "filtro IMS incompleto");
  }

  const webBanner = readRepo("apps/web/src/features/stop-work/components/operational-dead-end-banner.tsx");
  const mobBanner = readRepo("apps/mobile/src/features/stop-work/components/flow-dead-end-banner.tsx");
  const webDetail = readRepo("apps/web/src/features/stop-work/components/stop-work-detail-container.tsx");
  const mobDetail = readRepo("apps/mobile/src/features/stop-work/components/preventive-stop-detail-screen.tsx");

  if (
    webBanner.includes("VER_E_AGIR") &&
    webBanner.includes("EM_TRATATIVA") &&
    mobBanner.includes("VER_E_AGIR") &&
    mobBanner.includes("EM_TRATATIVA") &&
    webDetail.includes("OperationalDeadEndBanner") &&
    mobDetail.includes("FlowDeadEndBanner")
  ) {
    record("CON-BANNER-01", "PASS", "banners dead-end VA + EM_TRATATIVA Web/Mobile");
  } else {
    record("CON-BANNER-01", "FAIL", "banners dead-end ausentes");
  }

  const webOccKeys = readRepo("apps/web/src/features/occurrences/types.ts");
  const mobOccKeys = readRepo("apps/mobile/src/features/occurrences/types.ts");
  const matrix = readRepo("packages/query-keys/src/invalidation-matrix.ts");

  if (
    webOccKeys.includes("@safestop/query-keys") &&
    mobOccKeys.includes("@safestop/query-keys") &&
    matrix.includes("OCCURRENCE_INVALIDATION_MATRIX")
  ) {
    record("CON-QUERY-01", "PASS", "@safestop/query-keys adotado + matriz invalidação");
  } else {
    record("CON-QUERY-01", "FAIL", "query-keys não adotado uniformemente");
  }

  if (hasStopWorkTimelineImports()) {
    record("CON-TL-LEGACY-01", "PASS", "StopWorkTimeline sem referências (arquivo legado isolado — waiver PO-CON-13)");
  } else {
    record("CON-TL-LEGACY-01", "FAIL", "StopWorkTimeline ainda referenciado");
  }
}

async function main() {
  console.log("=== QA Sprint 2.9 — Regressão consolidada (~50 críticos + CON) ===\n");

  runConsolidationCodeChecks();

  console.log("\n--- Matriz crítica 2.3–2.8 (subset) ---\n");

  for (const [script, ids] of Object.entries(CRITICAL_MATRIX)) {
    console.log(`>> ${script} (${ids.length} casos)`);
    runMatrixScript(script, ids);
    console.log("");
  }

  const allIds = [
    ...Object.values(CRITICAL_MATRIX).flat(),
    ...CONSOLIDATION_CHECKS,
    "CON-TL-LEGACY-01",
  ];

  const pass = allIds.filter((id) => results.get(id)?.status === "PASS").length;
  const fail = allIds.filter((id) => results.get(id)?.status !== "PASS").length;

  console.log("=== RESUMO CONSOLIDAÇÃO ===");
  console.log(`PASS: ${pass}/${allIds.length} | FAIL: ${fail}/${allIds.length}`);

  if (fail > 0) {
    console.log("\nFalhas:");
    for (const id of allIds) {
      const r = results.get(id);
      if (r?.status !== "PASS") {
        console.log(`  - ${id}: ${r?.detail ?? "não executado"}`);
      }
    }
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
