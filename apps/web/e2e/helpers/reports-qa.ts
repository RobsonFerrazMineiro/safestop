import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import type { Page } from "@playwright/test";

export const QA_PASSWORD = "SafeStop-QA-Local-2026";

export const QA_USERS = {
  gestor: "qa-gestor@safestop.local",
  field: "qa-field@safestop.local",
} as const;

export const REPORT_ROUTES = [
  "/reports",
  "/reports/occurrences",
  "/reports/action-items",
  "/reports/awareness",
] as const;

export const QA_ALPHA_ORG = "b0000000-0000-4000-8000-000000000001";

const __dirname = dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = join(__dirname, "..");
const REPO_ROOT = join(WEB_ROOT, "..", "..");

type SupabaseEnv = {
  apiUrl: string;
  anonKey: string;
};

function parseEnvFile(filePath: string): Record<string, string> {
  if (!existsSync(filePath)) {
    return {};
  }

  const values: Record<string, string> = {};

  for (const line of readFileSync(filePath, "utf8").split("\n")) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separator = trimmed.indexOf("=");

    if (separator === -1) {
      continue;
    }

    const key = trimmed.slice(0, separator).trim();
    const rawValue = trimmed.slice(separator + 1).trim();
    values[key] = rawValue.replace(/^"|"$/g, "");
  }

  return values;
}

export function loadSupabaseEnv(): SupabaseEnv {
  const envLocal = parseEnvFile(join(WEB_ROOT, ".env.local"));
  const apiUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    process.env.SUPABASE_URL ??
    envLocal.NEXT_PUBLIC_SUPABASE_URL ??
    "http://127.0.0.1:54321";

  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.SUPABASE_ANON_KEY ??
    envLocal.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    envLocal.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (anonKey) {
    return { apiUrl, anonKey };
  }

  const output = execSync("pnpm exec supabase status -o env", {
    cwd: REPO_ROOT,
    encoding: "utf8",
  });

  const fromCli: Record<string, string> = {};

  for (const line of output.split("\n")) {
    const match = line.match(/^([A-Z0-9_]+)="?(.*?)"?$/);

    if (match?.[1]) {
      fromCli[match[1]] = match[2] ?? "";
    }
  }

  const resolvedAnonKey = fromCli.ANON_KEY ?? fromCli.SUPABASE_ANON_KEY;

  if (!resolvedAnonKey) {
    throw new Error(
      "Não foi possível resolver ANON_KEY. Defina NEXT_PUBLIC_SUPABASE_ANON_KEY em apps/web/.env.local ou inicie o Supabase local.",
    );
  }

  return {
    apiUrl: fromCli.API_URL ?? apiUrl,
    anonKey: resolvedAnonKey,
  };
}

export async function signInWithPassword(
  apiUrl: string,
  anonKey: string,
  email: string,
  password: string = QA_PASSWORD,
): Promise<string> {
  const response = await fetch(`${apiUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error(`Login ${email} falhou (${response.status}): ${await response.text()}`);
  }

  const payload = (await response.json()) as { access_token: string };
  return payload.access_token;
}

export async function loginThroughUi(
  page: Page,
  email: string,
  password: string = QA_PASSWORD,
): Promise<void> {
  await page.goto("/login");
  const emailInput = page.getByTestId("login-email");
  await emailInput.waitFor({ state: "visible", timeout: 30_000 });
  await emailInput.fill(email);
  await page.getByTestId("login-password").fill(password);
  await page.getByTestId("login-submit").click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 30_000 });
}

export async function fetchLatestExportAudit(
  apiUrl: string,
  anonKey: string,
  token: string,
  organizationId: string,
) {
  const params = new URLSearchParams({
    select: "id,report_type,export_format,filters,row_count,created_at",
    organization_id: `eq.${organizationId}`,
    order: "created_at.desc",
    limit: "1",
  });

  const response = await fetch(`${apiUrl}/rest/v1/report_export_audit?${params}`, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Falha ao consultar report_export_audit (${response.status})`);
  }

  const rows = (await response.json()) as Array<{
    id: string;
    report_type: string;
    export_format: string;
    filters: Record<string, unknown> | null;
    row_count: number;
    created_at: string;
  }>;

  return rows[0] ?? null;
}

export async function exportFromMenu(
  page: Page,
  format: "csv" | "xlsx",
): Promise<{ suggestedFilename: string }> {
  await page.getByTestId("report-export-trigger").click();
  const downloadPromise = page.waitForEvent("download");

  if (format === "csv") {
    await page.getByTestId("report-export-csv").click();
  } else {
    await page.getByTestId("report-export-xlsx").click();
  }

  const download = await downloadPromise;
  return { suggestedFilename: download.suggestedFilename() };
}
