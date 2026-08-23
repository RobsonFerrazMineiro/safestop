/**
 * Resultado de uma exportação (CSV ou XLSX) — contrato comum devolvido por
 * todos os `export-*.ts`. A camada de UI decide como disparar o download
 * (fora do escopo deste agente); aqui só entregamos o arquivo já pronto e o
 * `rowCount` real (mesmo valor enviado a `log_report_export`).
 */
export type ReportExportResult = {
  blob: Blob;
  fileName: string;
  rowCount: number;
};
