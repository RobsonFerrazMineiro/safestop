import { describe, expect, it, vi, beforeEach } from "vitest";

import { getUserOrganizations } from "./get-user-organizations";

const mockGetUser = vi.fn();
const mockSelect = vi.fn();
const mockEqProfile = vi.fn();
const mockEqActive = vi.fn();

vi.mock("@/lib/auth/client", () => ({
  createClient: () => ({
    auth: {
      getUser: mockGetUser,
    },
    from: () => ({
      select: mockSelect,
    }),
  }),
}));

describe("getUserOrganizations", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockSelect.mockReturnValue({ eq: mockEqProfile });
    mockEqProfile.mockReturnValue({ eq: mockEqActive });
  });

  it("utiliza userId fornecido diretamente sem chamar supabase.auth.getUser()", async () => {
    mockEqActive.mockResolvedValue({
      data: [
        {
          id: "member-1",
          organization_id: "org-1",
          membership_type: "EMPLOYEE",
          organizations: {
            id: "org-1",
            name: "Alpha Seguros",
            document_number: "12.345.678/0001-90",
            organization_type: "CONTRACTOR",
            is_active: true,
          },
        },
      ],
      error: null,
    });

    const result = await getUserOrganizations("user-123");

    expect(mockGetUser).not.toHaveBeenCalled();
    expect(mockEqProfile).toHaveBeenCalledWith("profile_id", "user-123");
    expect(mockEqActive).toHaveBeenCalledWith("is_active", true);
    expect(result).toHaveLength(1);
    expect(result[0]?.name).toBe("Alpha Seguros");
  });

  it("chama supabase.auth.getUser() quando userId não é fornecido", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-from-auth" } },
      error: null,
    });
    mockEqActive.mockResolvedValue({
      data: [],
      error: null,
    });

    const result = await getUserOrganizations();

    expect(mockGetUser).toHaveBeenCalledTimes(1);
    expect(mockEqProfile).toHaveBeenCalledWith("profile_id", "user-from-auth");
    expect(result).toEqual([]);
  });

  it("lança 'Não autenticado.' quando auth.getUser() não retorna usuário", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: "Invalid session" },
    });

    await expect(getUserOrganizations()).rejects.toThrow("Não autenticado.");
  });

  it("trata falha de rede/fetch no auth.getUser() com mensagem amigável", async () => {
    mockGetUser.mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(getUserOrganizations()).rejects.toThrow(
      "Não foi possível verificar a autenticação com o servidor. Verifique a conexão com o backend.",
    );
  });

  it("lança erro amigável quando a consulta ao banco falha", async () => {
    mockEqActive.mockResolvedValue({
      data: null,
      error: { message: "Database connection failed" },
    });

    await expect(getUserOrganizations("user-123")).rejects.toThrow(
      "Não foi possível carregar suas organizações.",
    );
  });
});
