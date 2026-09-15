import { describe, expect, it } from "vitest";

import { occurrenceQueryKeys } from "@safestop/query-keys";

import { clearWorkspaceTenantCache } from "./services/clear-workspace-tenant-cache";

type FakeQuery = {
  queryKey: readonly unknown[];
  data?: unknown;
};

function createFakeQueryClient(initial: FakeQuery[]) {
  const queries = [...initial];

  return {
    cancelQueries: async ({ predicate }: { predicate: (query: FakeQuery) => boolean }) => {
      void predicate;
    },
    removeQueries: ({ predicate }: { predicate: (query: FakeQuery) => boolean }) => {
      for (let index = queries.length - 1; index >= 0; index -= 1) {
        const query = queries[index];
        if (query && predicate(query)) {
          queries.splice(index, 1);
        }
      }
    },
    getQueryData: (queryKey: readonly unknown[]) => {
      const match = queries.find(
        (query) => JSON.stringify(query.queryKey) === JSON.stringify(queryKey),
      );
      return match?.data;
    },
    remaining: () => queries.map((query) => query.queryKey),
  };
}

describe("Gate 13C.2 — isolamento cache A→B", () => {
  it("troca A→B remove cache A e não reutiliza dados A sob key B", async () => {
    const filters = { search: "x", pagination: { limit: 20 } };
    const keyA = occurrenceQueryKeys.workspaceList("org-1", "ws-a", filters);
    const keyB = occurrenceQueryKeys.workspaceList("org-1", "ws-b", filters);

    const client = createFakeQueryClient([
      { queryKey: keyA, data: { items: [{ id: "from-a" }] } },
      { queryKey: keyB },
      { queryKey: ["tenant", "org-1", "organization-contacts", "list"] },
    ]);

    clearWorkspaceTenantCache(client as never, "org-1", "ws-a");

    expect(client.getQueryData(keyA)).toBeUndefined();
    expect(client.getQueryData(keyB)).toBeUndefined();
    expect(client.remaining()).toEqual([
      keyB,
      ["tenant", "org-1", "organization-contacts", "list"],
    ]);
  });
});
