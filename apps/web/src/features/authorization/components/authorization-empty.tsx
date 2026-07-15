"use client";

import { useAuthorization } from "../hooks/use-authorization";

export function AuthorizationEmpty() {
  const { roles } = useAuthorization();
  const roleNames = roles.map((role) => role.name).join(", ");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-semibold text-gray-100">Sem permissões operacionais</h1>
      <p className="max-w-md text-base text-gray-400">
        Você possui vínculo com a organização ativa, mas ainda não tem permissões efetivas
        atribuídas. Entre em contato com o administrador da sua organização.
      </p>
      {roleNames ? (
        <p className="text-sm text-gray-500">
          Papéis atribuídos: <span className="text-gray-300">{roleNames}</span>
        </p>
      ) : null}
    </main>
  );
}
