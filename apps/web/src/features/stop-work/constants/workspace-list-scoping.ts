/**
 * Gate 13C.2 — Stop Work list Workspace-scoped.
 *
 * `list_operational_occurrences` aceita `p_workspace_id` (Gate 13C.1).
 * O Web envia sempre o Workspace ativo; o filtro ocorre na CTE `base`
 * antes de cursor / LIMIT / hasNext / nextCursor.
 *
 * Sem `activeWorkspace`, a query Workspace-aware não dispara
 * (não envia `p_workspace_id = null` para cair no legado A+B).
 */
export const STOP_WORK_LIST_WORKSPACE_SERVER_FILTER_READY = true;
