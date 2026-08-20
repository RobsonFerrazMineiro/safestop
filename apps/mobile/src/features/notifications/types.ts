export type NotificationBadgeCounts = {
  unreadCount: number;
  pendingAwarenessCount: number;
};

/** Refetch periódico do badge — alinhado à spec UI (NOTIF-BELL, stale 30s + poll 60s). */
export const NOTIFICATION_POLL_INTERVAL_MS = 60_000;
