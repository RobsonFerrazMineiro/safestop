import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { loadSupabaseLocalEnv } from "./_local-env.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..", "..");
const PASSWORD = "SafeStop-QA-Local-2026";

const QA_ALPHA_ORG_ID = "b0000000-0000-4000-8000-000000000001";
const QA_ALPHA_AREA_ID = "f0000000-0000-4000-8000-000000000001";
const QA_ALPHA_CONTRACTOR_ID = "b0000000-0000-4000-8000-000000000002";
const QA_FIELD_EMAIL = "qa-field@safestop.local";
const QA_FIELD_USER_ID = "a0000000-0000-4000-8000-000000000001";
const QA_MULTI_EMAIL = "qa-multi@safestop.local";

function loadPassword() {
  try {
    const raw = readFileSync(join(__dirname, "..", "qa-credentials.local"), "utf8");
    const match = raw.match(/^QA_TEST_USER_PASSWORD=(.+)$/m);
    if (match?.[1]) {
      return match[1].trim();
    }
  } catch {
    // fallback seed
  }
  return PASSWORD;
}

async function signIn(apiUrl, anonKey, email, password) {
  const response = await fetch(`${apiUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: anonKey, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) {
    throw new Error(`Login falhou (${response.status})`);
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
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`RPC ${fn} HTTP ${response.status}: ${text}`);
  }
  return response.json();
}

function runSql(sql) {
  const oneLine = sql.replace(/\s+/g, " ").trim();
  execSync(`pnpm exec supabase db query --local ${JSON.stringify(oneLine)}`, {
    cwd: REPO_ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

async function main() {
  const password = loadPassword();
  const { apiUrl, anonKey } = loadSupabaseLocalEnv();

  console.log("=== Validação occurrence_comments + timeline (Sprint 2.3) ===\n");

  const field = await signIn(apiUrl, anonKey, QA_FIELD_EMAIL, password);

  const createResult = await rpc(apiUrl, anonKey, field.access_token, "create_occurrence", {
    payload: {
      organization_id: QA_ALPHA_ORG_ID,
      area_id: QA_ALPHA_AREA_ID,
      contractor_organization_id: QA_ALPHA_CONTRACTOR_ID,
      title: "QA timeline validation",
      task_description: "Ocorrência para teste de timeline",
      location_description: "Local QA",
      condition_description: "Condição QA",
      severity: "HIGH",
    },
  });

  if (!createResult.success) {
    throw new Error(`create_occurrence falhou: ${JSON.stringify(createResult)}`);
  }

  const occurrenceId = createResult.data.id;
  console.log(`Ocorrência QA: ${occurrenceId}\n`);

  console.log("1) INSERT direto em occurrence_comments negado...");
  const directInsert = await fetch(`${apiUrl}/rest/v1/occurrence_comments`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${field.access_token}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      organization_id: QA_ALPHA_ORG_ID,
      occurrence_id: occurrenceId,
      author_id: QA_FIELD_USER_ID,
      comment_type: "GENERAL",
      content: "Comentário inválido via REST direto",
    }),
  });

  if (directInsert.status !== 401 && directInsert.status !== 403) {
    throw new Error(`Esperado 401/403, recebido ${directInsert.status}`);
  }
  console.log(`   OK — HTTP ${directInsert.status}`);

  console.log("2) SELECT cross-org (qa-multi) → 0 rows...");
  const multi = await signIn(apiUrl, anonKey, QA_MULTI_EMAIL, password);
  const crossSelect = await fetch(
    `${apiUrl}/rest/v1/occurrence_comments?select=id&organization_id=eq.${QA_ALPHA_ORG_ID}&occurrence_id=eq.${occurrenceId}`,
    {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${multi.access_token}`,
      },
    },
  );
  if (!crossSelect.ok) {
    throw new Error(`SELECT cross-org falhou: ${await crossSelect.text()}`);
  }
  const crossRows = await crossSelect.json();
  if (crossRows.length !== 0) {
    throw new Error(`Cross-org leak: ${JSON.stringify(crossRows)}`);
  }
  console.log("   OK — 0 linhas");

  console.log("3) Fixture QA: comentário + evidência COMPLETED (SQL local)...");
  runSql(`
    insert into public.occurrence_comments (
      organization_id, occurrence_id, author_id, comment_type, content
    ) values (
      '${QA_ALPHA_ORG_ID}', '${occurrenceId}', '${QA_FIELD_USER_ID}', 'GENERAL', 'Comentário fixture TL-02'
    )
  `);

  runSql(`
insert into public.occurrence_attachments (
  id,
  organization_id,
  occurrence_id,
  uploaded_by,
  attachment_type,
  storage_bucket,
  storage_path,
  original_file_name,
  mime_type,
  file_size,
  caption,
  upload_status
) values (
  '02000000-0000-4000-8000-000000000001',
  '${QA_ALPHA_ORG_ID}',
  '${occurrenceId}',
  '${QA_FIELD_USER_ID}',
  'INITIAL_EVIDENCE',
  'occurrence-evidence',
  '${QA_ALPHA_ORG_ID}/${occurrenceId}/02000000-0000-4000-8000-000000000001/02000000-0000-4000-8000-000000000001.jpg',
  'tl-fixture.jpg',
  'image/jpeg',
  4096,
  'Evidência fixture TL-06',
  'COMPLETED'
) on conflict (id) do update set upload_status = 'COMPLETED', deleted_at = null;
`);

  for (let i = 1; i <= 35; i += 1) {
    runSql(`
      insert into public.occurrence_comments (
        organization_id, occurrence_id, author_id, comment_type, content, created_at
      ) values (
        '${QA_ALPHA_ORG_ID}', '${occurrenceId}', '${QA_FIELD_USER_ID}', 'GENERAL',
        'Paginação TL-05 #${i}', now() - interval '${36 - i} seconds'
      )
    `);
  }

  console.log("   OK — fixtures inseridas");

  console.log("4) get_occurrence_timeline — kinds esperados...");
  const timeline = await rpc(
    apiUrl,
    anonKey,
    field.access_token,
    "get_occurrence_timeline",
    {
      p_occurrence_id: occurrenceId,
      p_limit: 30,
    },
  );

  if (!timeline.success || !Array.isArray(timeline.items)) {
    throw new Error(`timeline falhou: ${JSON.stringify(timeline)}`);
  }

  const kinds = new Set(timeline.items.map((item) => item.kind));
  if (!kinds.has("OCCURRENCE_CREATED")) {
    throw new Error(`OCCURRENCE_CREATED ausente: ${[...kinds].join(", ")}`);
  }
  if (!kinds.has("COMMENT_ADDED")) {
    throw new Error("COMMENT_ADDED ausente");
  }
  if (!kinds.has("EVIDENCE_ADDED")) {
    throw new Error("EVIDENCE_ADDED ausente");
  }
  console.log(
    `   OK — ${timeline.items.length} itens; kinds=${[...kinds].sort().join(", ")}`,
  );

  console.log("5) Paginação — nextCursor...");
  if (!timeline.nextCursor?.occurred_at || !timeline.nextCursor?.id) {
    throw new Error(`nextCursor ausente com >30 eventos: ${JSON.stringify(timeline.nextCursor)}`);
  }

  const page2 = await rpc(apiUrl, anonKey, field.access_token, "get_occurrence_timeline", {
    p_occurrence_id: occurrenceId,
    p_cursor: timeline.nextCursor,
    p_limit: 30,
  });

  if (!page2.success || page2.items.length === 0) {
    throw new Error(`página 2 vazia: ${JSON.stringify(page2)}`);
  }
  console.log(`   OK — página 2 com ${page2.items.length} itens`);

  console.log("\nOK — occurrence_comments + timeline validados (Sprint 2.3).");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
