const sessionDrafts = new Map<string, string>();

export function getCommentDraft(occurrenceId: string): string {
  return sessionDrafts.get(occurrenceId) ?? "";
}

export function setCommentDraft(occurrenceId: string, content: string): void {
  if (content.trim().length === 0) {
    sessionDrafts.delete(occurrenceId);
    return;
  }

  sessionDrafts.set(occurrenceId, content);
}

export function clearCommentDraft(occurrenceId: string): void {
  sessionDrafts.delete(occurrenceId);
}
