import type { EvidenceUploadQueueItem } from "../types";

const sessionQueues = new Map<string, EvidenceUploadQueueItem[]>();
const snapshotCache = new Map<string, EvidenceUploadQueueItem[]>();
const listeners = new Set<() => void>();

function cloneQueue(items: EvidenceUploadQueueItem[]): EvidenceUploadQueueItem[] {
  return items.map((item) => ({ ...item }));
}

function emitChange(): void {
  listeners.forEach((listener) => {
    listener();
  });
}

function updateSnapshot(
  occurrenceId: string,
  items: EvidenceUploadQueueItem[],
): EvidenceUploadQueueItem[] {
  const snapshot = cloneQueue(items);
  sessionQueues.set(occurrenceId, snapshot);
  snapshotCache.set(occurrenceId, snapshot);
  return snapshot;
}

export function subscribeEvidenceUploadQueue(listener: () => void): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function getEvidenceUploadQueueSnapshot(occurrenceId: string): EvidenceUploadQueueItem[] {
  const cached = snapshotCache.get(occurrenceId);

  if (cached) {
    return cached;
  }

  const empty: EvidenceUploadQueueItem[] = [];
  snapshotCache.set(occurrenceId, empty);
  return empty;
}

export function getEvidenceUploadQueue(occurrenceId: string): EvidenceUploadQueueItem[] {
  return cloneQueue(sessionQueues.get(occurrenceId) ?? []);
}

export function setEvidenceUploadQueue(
  occurrenceId: string,
  items: EvidenceUploadQueueItem[],
): EvidenceUploadQueueItem[] {
  updateSnapshot(occurrenceId, items);
  emitChange();
  return getEvidenceUploadQueue(occurrenceId);
}

export function upsertEvidenceUploadQueueItem(
  occurrenceId: string,
  item: EvidenceUploadQueueItem,
): EvidenceUploadQueueItem[] {
  const current = sessionQueues.get(occurrenceId) ?? [];
  const index = current.findIndex((entry) => entry.localId === item.localId);
  const next = [...current];

  if (index >= 0) {
    next[index] = { ...item };
  } else {
    next.push({ ...item });
  }

  return setEvidenceUploadQueue(occurrenceId, next);
}

export function removeEvidenceUploadQueueItem(
  occurrenceId: string,
  localId: string,
): EvidenceUploadQueueItem[] {
  const current = sessionQueues.get(occurrenceId) ?? [];
  return setEvidenceUploadQueue(
    occurrenceId,
    current.filter((entry) => entry.localId !== localId),
  );
}

export function clearEvidenceUploadQueue(occurrenceId: string): void {
  sessionQueues.delete(occurrenceId);
  snapshotCache.delete(occurrenceId);
  emitChange();
}

export function clearCompletedEvidenceUploadQueue(occurrenceId: string): EvidenceUploadQueueItem[] {
  const current = sessionQueues.get(occurrenceId) ?? [];
  return setEvidenceUploadQueue(
    occurrenceId,
    current.filter((entry) => entry.status !== "completed"),
  );
}
