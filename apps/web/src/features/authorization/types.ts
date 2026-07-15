export const AUTHORIZATION_QUERY_KEY = "authorization" as const;

/** Cache de autorização efetiva — 5 minutos (Sprint 1.9). */
export const AUTHORIZATION_STALE_TIME_MS = 5 * 60 * 1000;

export function authorizationQueryKey(userId: string, organizationId: string) {
  return [AUTHORIZATION_QUERY_KEY, userId, organizationId] as const;
}
