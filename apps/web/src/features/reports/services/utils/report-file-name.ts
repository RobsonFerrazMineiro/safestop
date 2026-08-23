function pad(value: number): string {
  return String(value).padStart(2, "0");
}

/** Nome de arquivo determinístico e ASCII-safe: `<baseName>-YYYYMMDD-HHmmss.<ext>`. */
export function buildReportFileName(baseName: string, extension: "csv" | "xlsx"): string {
  const now = new Date();
  const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

  return `${baseName}-${stamp}.${extension}`;
}
