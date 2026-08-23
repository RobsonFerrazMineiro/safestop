/**
 * QA Reports Sprint 3.3 — Web (Playwright E2E)
 *
 * Cobre: login gestor, 3 relatórios, no-results, export CSV/XLSX + auditoria,
 * bloqueio de URL direta sem report.read, ausência de hydration error no login.
 *
 * Pré-requisitos:
 *   pnpm supabase:db:reset   (seed QA local)
 *   pnpm exec playwright install chromium   (primeira execução)
 *
 * Uso:
 *   node supabase/scripts/qa-reports-3.3-web.mjs
 *   — ou —
 *   pnpm --filter web test:e2e
 */
import { execSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..", "..");
const WEB_DIR = join(REPO_ROOT, "apps", "web");

function main() {
  console.log("=== QA Reports 3.3 — Web E2E (Playwright) ===");
  console.log("Pré-requisito: Supabase local + seed (pnpm supabase:db:reset)");

  execSync("pnpm exec playwright test e2e/reports.spec.ts", {
    cwd: WEB_DIR,
    stdio: "inherit",
    env: {
      ...process.env,
      CI: process.env.CI ?? "",
    },
  });

  console.log("=== QA Reports 3.3 Web: PASS ===");
}

main();
