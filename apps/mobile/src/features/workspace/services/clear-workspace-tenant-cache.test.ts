import { describe, expect, it } from "vitest";

import { clearWorkspaceTenantCache } from "./clear-workspace-tenant-cache";

type FakeQuery = {
  queryKey: readonly unknown[];
};

function createFakeQueryClient() {
  const queries: FakeQuery[] = [
    { queryKey: ["tenant", "org-1", "ws-a", "occurrences", "list"] },
    { queryKey: ["tenant", "org-1", "ws-b", "occurrences", "list"] },
    { queryKey: ["tenant", "org-1", "organization-contacts", "list"] },
    { queryKey: ["tenant", "org-1", "notifications", "list", "initial"] },
    { queryKey: ["authorization", "org-1"] },
  ];

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
    remaining: () => queries.map((query) => query.queryKey),
  };
}

describe("clearWorkspaceTenantCache", () => {
  it("remove apenas cache do Workspace anterior e preserva Organization-scoped", () => {
    const client = createFakeQueryClient();

    clearWorkspaceTenantCache(client as never, "org-1", "ws-a");

    expect(client.remaining()).toEqual([
      ["tenant", "org-1", "ws-b", "occurrences", "list"],
      ["tenant", "org-1", "organization-contacts", "list"],
      ["tenant", "org-1", "notifications", "list", "initial"],
      ["authorization", "org-1"],
    ]);
  });
});
