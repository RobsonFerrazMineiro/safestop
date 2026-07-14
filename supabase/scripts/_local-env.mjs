import { execSync } from "node:child_process";
import { readFileSync, existsSync, writeFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SUPABASE_DIR = join(__dirname, "..");
const REPO_ROOT = join(SUPABASE_DIR, "..");
const CREDENTIALS_PATH = join(SUPABASE_DIR, "qa-credentials.local");

/**
 * Lê variáveis do arquivo qa-credentials.local (formato KEY=valor).
 * Não imprime valores sensíveis.
 */
export function loadQaCredentials() {
  if (!existsSync(CREDENTIALS_PATH)) {
    throw new Error(
      "Arquivo supabase/qa-credentials.local não encontrado. Copie supabase/qa-credentials.local.example e defina QA_TEST_USER_PASSWORD.",
    );
  }

  const content = readFileSync(CREDENTIALS_PATH, "utf8");
  const values = {};

  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separator = trimmed.indexOf("=");
    if (separator === -1) {
      continue;
    }

    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim();
    values[key] = value;
  }

  const email = values.QA_TEST_USER_EMAIL;
  const password = values.QA_TEST_USER_PASSWORD;
  const fullName = values.QA_TEST_USER_FULL_NAME ?? "QA Campo SafeStop";

  if (!email || !password) {
    throw new Error(
      "QA_TEST_USER_EMAIL e QA_TEST_USER_PASSWORD devem estar definidos em supabase/qa-credentials.local.",
    );
  }

  return { email, password, fullName };
}

/**
 * Obtém URL e chaves do Supabase local via CLI (sem expor service_role no log).
 */
export function loadSupabaseLocalEnv() {
  const output = execSync("pnpm exec supabase status -o env", {
    cwd: REPO_ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

  const env = {};

  for (const line of output.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separator = trimmed.indexOf("=");
    if (separator === -1) {
      continue;
    }

    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim().replace(/^"|"$/g, "");
    env[key] = value;
  }

  const apiUrl = env.API_URL;
  const anonKey = env.ANON_KEY;
  const serviceRoleKey = env.SERVICE_ROLE_KEY;

  if (!apiUrl || !anonKey || !serviceRoleKey) {
    throw new Error(
      "Não foi possível obter API_URL, ANON_KEY ou SERVICE_ROLE_KEY. Execute pnpm supabase:start e pnpm supabase:status.",
    );
  }

  return { apiUrl, anonKey, serviceRoleKey };
}

export function escapeSqlLiteral(value) {
  return value.replace(/'/g, "''");
}

export function runLocalSql(sql) {
  const tempFile = join(tmpdir(), `safestop-sql-${Date.now()}.sql`);

  try {
    writeFileSync(tempFile, sql, "utf8");
    execSync(`pnpm exec supabase db query --local --file "${tempFile}"`, {
      cwd: REPO_ROOT,
      stdio: ["ignore", "pipe", "pipe"],
    });
  } finally {
    unlinkSync(tempFile);
  }
}
