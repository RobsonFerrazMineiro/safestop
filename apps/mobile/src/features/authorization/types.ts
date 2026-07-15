export const AUTHORIZATION_QUERY_KEY = "authorization" as const;

export function authorizationQueryKey(userId: string, organizationId: string) {
  return [AUTHORIZATION_QUERY_KEY, userId, organizationId] as const;
}
