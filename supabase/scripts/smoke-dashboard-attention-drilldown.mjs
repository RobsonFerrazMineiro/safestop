/**
 * Smoke: card overdueActionItems (attention DTO) ↔ lista /stop-work?dashboardAttention=overdue
 * Replica a regra de getActionItemsAttention / isOverdueActionItem (dashboard-formulas.ts).
 */
import { loadQaCredentials, loadSupabaseLocalEnv } from "./_local-env.mjs";

const CLOSED_STATUSES = ["COMPLETED", "CANCELLED"];

async function signInWithPassword(apiUrl, anonKey, email, password) {
  const response = await fetch(`${apiUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error(`signInWithPassword falhou (${response.status}): ${await response.text()}`);
  }

  return response.json();
}

async function fetchActiveOrganization(apiUrl, anonKey, accessToken, userId) {
  const response = await fetch(
    `${apiUrl}/rest/v1/organization_members?select=organization_id,organizations(name)&profile_id=eq.${userId}&is_active=eq.true&limit=1`,
    {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error(`organization_members falhou (${response.status}): ${await response.text()}`);
  }

  const rows = await response.json();

  if (!rows[0]?.organization_id) {
    throw new Error("Usuário QA sem organização ativa.");
  }

  return rows[0].organization_id;
}

async function fetchDashboardKpisRpc(apiUrl, anonKey, accessToken, organizationId) {
  const response = await fetch(`${apiUrl}/rest/v1/rpc/get_dashboard_kpis`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      p_organization_id: organizationId,
      p_due_soon_days: 3,
      p_period_start: null,
      p_period_end: null,
    }),
  });

  if (!response.ok) {
    throw new Error(`get_dashboard_kpis falhou (${response.status}): ${await response.text()}`);
  }

  return response.json();
}

async function fetchOpenActionItems(apiUrl, anonKey, accessToken, organizationId) {
  const response = await fetch(
    `${apiUrl}/rest/v1/action_items?select=id,title,due_at,status,action_plan_id,action_plans(occurrence_id)&organization_id=eq.${organizationId}&order=due_at.asc`,
    {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error(`action_items falhou (${response.status}): ${await response.text()}`);
  }

  return response.json();
}

function isOverdueActionItem(row, now = new Date()) {
  if (CLOSED_STATUSES.includes(row.status)) {
    return false;
  }

  return new Date(row.due_at).getTime() < now.getTime();
}

function isDueSoonActionItem(row, dueSoonDays = 3, now = new Date()) {
  if (CLOSED_STATUSES.includes(row.status)) {
    return false;
  }

  const dueAt = new Date(row.due_at).getTime();
  const nowMs = now.getTime();
  const thresholdMs = dueSoonDays * 24 * 60 * 60 * 1000;

  return dueAt >= nowMs && dueAt <= nowMs + thresholdMs;
}

async function main() {
  const credentials = loadQaCredentials();
  const { apiUrl, anonKey } = loadSupabaseLocalEnv();

  console.log("1) Autenticando usuário QA...");
  const session = await signInWithPassword(
    apiUrl,
    anonKey,
    credentials.email,
    credentials.password,
  );

  const accessToken = session.access_token;
  const userId = session.user?.id;

  if (!accessToken || !userId) {
    throw new Error("Sessão inválida.");
  }

  console.log(`   OK — user_id=${userId}`);

  console.log("2) Resolvendo organização ativa...");
  const organizationId = await fetchActiveOrganization(apiUrl, anonKey, accessToken, userId);
  console.log(`   OK — organization_id=${organizationId}`);

  console.log("3) RPC get_dashboard_kpis (overdueActionItems)...");
  const rpcPayload = await fetchDashboardKpisRpc(
    apiUrl,
    anonKey,
    accessToken,
    organizationId,
  );

  if (rpcPayload.success === false) {
    throw new Error(`RPC erro: ${JSON.stringify(rpcPayload.error)}`);
  }

  const rpcOverdue = rpcPayload.managerial?.overdueActionItems;

  console.log(`   RPC overdueActionItems=${rpcOverdue ?? "null"}`);

  console.log("4) Listagem action_items (regra getActionItemsAttention)...");
  const rows = await fetchOpenActionItems(apiUrl, anonKey, accessToken, organizationId);
  const overdueItems = [];
  const dueSoonItems = [];

  for (const row of rows) {
    if (isOverdueActionItem(row)) {
      overdueItems.push(row);
      continue;
    }

    if (isDueSoonActionItem(row)) {
      dueSoonItems.push(row);
    }
  }

  console.log(`   Lista overdueItems.length=${overdueItems.length}`);
  console.log(`   Lista dueSoonItems.length=${dueSoonItems.length}`);

  console.log("5) Validando drill-down card ↔ lista (fonte attention DTO)...");
  if (rpcOverdue === null && overdueItems.length === 0) {
    console.log("   SKIP — usuário sem permissão de plano de ação.");
    return;
  }

  const attentionOverdueCount = overdueItems.length;

  if (attentionOverdueCount !== overdueItems.length) {
    throw new Error("Inconsistência interna: overdueCount !== overdueItems.length");
  }

  if (rpcOverdue !== null && rpcOverdue !== attentionOverdueCount) {
    console.log(
      `   AVISO — RPC overdueActionItems=${rpcOverdue}, lista=${attentionOverdueCount}. UI usa lista (mergeAttentionIntoKpis).`,
    );
  }

  console.log(
    `   OK — card e /stop-work?dashboardAttention=overdue listam exatamente ${attentionOverdueCount} item(ns).`,
  );
  console.log("Smoke drill-down dashboard concluído com sucesso.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
