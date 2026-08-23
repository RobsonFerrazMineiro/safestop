/**
 * Normaliza filtros (que podem conter `undefined`) em um objeto jsonb
 * serializável, para uso em `log_report_export.p_filters`. `undefined` não é
 * um valor JSON válido — o round-trip via `JSON.stringify`/`JSON.parse`
 * remove essas chaves e garante que o valor é seguro para enviar como jsonb.
 */
export function toJsonRecord(value: unknown): Record<string, unknown> {
  return JSON.parse(JSON.stringify(value ?? {})) as Record<string, unknown>;
}
