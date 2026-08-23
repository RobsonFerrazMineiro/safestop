import type { LogReportExportInput } from "@safestop/types";
import { buildLogReportExportRpcArgs } from "@safestop/types";

import { createClient } from "@/lib/auth/client";

/**
 * Auditoria de exportação (Sprint 3.3, PO-REP-6). Deve ser chamada
 * IMEDIATAMENTE após montar o arquivo com sucesso, antes do download —
 * nunca antes de o arquivo existir.
 *
 * Falha na auditoria NUNCA bloqueia o download já gerado: o caller decide o
 * que fazer com o resultado (ex.: log em observabilidade), mas o arquivo já
 * pronto deve ser entregue ao usuário independentemente. Por isso esta
 * função nunca lança — ela retorna `{ ok, error }` em vez de usar exceções,
 * para deixar explícito no call site que a falha é não bloqueante.
 */
export type LogReportExportOutcome = { ok: true } | { ok: false; error: unknown };

export async function logReportExport(
  input: LogReportExportInput,
): Promise<LogReportExportOutcome> {
  try {
    const supabase = createClient();

    const { error } = await supabase.rpc("log_report_export", buildLogReportExportRpcArgs(input));

    if (error) {
      return { ok: false, error };
    }

    return { ok: true };
  } catch (error) {
    return { ok: false, error };
  }
}
