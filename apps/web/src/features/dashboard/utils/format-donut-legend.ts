export function formatDonutLegendValue(count: number, total: number): string {
  const percent = total <= 0 ? 0 : Math.round((count / total) * 100);
  return `${count} · ${percent}%`;
}
