/**
 * Gerador de CSV para exportação de relatórios (Sprint 3.3, PO-REP-2).
 * Requisitos: BOM UTF-8 (abre corretamente no Excel pt-BR com acentuação),
 * delimitador `;` (padrão pt-BR, evita conflito com `,` decimal), datas
 * `dd/MM/yyyy`, mitigação de CSV injection (células iniciando com
 * `=`, `+`, `-`, `@` são prefixadas com aspas simples).
 */

const CSV_DELIMITER = ";";
const CSV_LINE_BREAK = "\r\n";
const CSV_INJECTION_PREFIX_PATTERN = /^[=+\-@]/;
const CSV_NEEDS_QUOTING_PATTERN = /["\r\n;]/;

export function escapeCsvCell(rawValue: string): string {
  let value = rawValue;

  if (CSV_INJECTION_PREFIX_PATTERN.test(value)) {
    value = `'${value}`;
  }

  if (CSV_NEEDS_QUOTING_PATTERN.test(value)) {
    value = `"${value.replace(/"/g, '""')}"`;
  }

  return value;
}

export function formatCsvDate(isoTimestamp: string | null): string {
  if (!isoTimestamp) {
    return "";
  }

  const date = new Date(isoTimestamp);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

export function buildCsvBlob(headers: readonly string[], rows: readonly string[][]): Blob {
  const lines = [headers, ...rows].map((row) => row.map(escapeCsvCell).join(CSV_DELIMITER));
  const content = lines.join(CSV_LINE_BREAK);

  return new Blob(["\ufeff" + content], { type: "text/csv;charset=utf-8;" });
}
