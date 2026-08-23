/**
 * Gerador de XLSX para exportação de relatórios (Sprint 3.3, PO-REP-2).
 *
 * Biblioteca escolhida: `write-excel-file` (ver justificativa completa no
 * relatório final do handoff BACKEND — resumo: `exceljs` está sem release
 * há ~3 anos com dependências transitivas (`uuid`, `tmp`) vulneráveis sem
 * correção disponível via npm; `xlsx` (SheetJS) publica no npm uma versão
 * com vulnerabilidades conhecidas sem patch nesse canal; `write-excel-file`
 * é ativamente mantido, licença MIT, e possui uma única dependência de
 * runtime (`fflate`, zip puro em JS, sem vulnerabilidades conhecidas) — sem
 * binário nativo, compatível com browser/Next.js).
 *
 * Import `/universal` (não `/browser` nem `/node`): retorna um `Blob`
 * diretamente, mesmo contrato de saída do gerador de CSV (`buildCsvBlob`),
 * deixando o disparo do download a cargo da camada de UI (fora do escopo
 * deste agente).
 */
import writeExcelFile from "write-excel-file/universal";
import type { Column } from "write-excel-file/universal";

export type { Column };

export async function buildXlsxBlob<TRow>(
  rows: readonly TRow[],
  columns: Column<TRow>[],
): Promise<Blob> {
  return writeExcelFile([...rows], { columns }).toBlob();
}
