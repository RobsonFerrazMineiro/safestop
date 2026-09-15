export function extractFirstName(fullName: string): string {
  const trimmed = fullName.trim();

  if (trimmed.length === 0) {
    return "";
  }

  return trimmed.split(/\s+/)[0] ?? trimmed;
}
