"use client";

import Link from "next/link";

export function AuthorizationForbidden() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-semibold text-gray-100">Acesso negado</h1>
      <p className="max-w-md text-base text-gray-400">
        Você não possui permissão para acessar esta área na organização ativa.
      </p>
      <Link href="/" className="text-orange-400 underline hover:text-orange-300">
        Voltar ao início
      </Link>
    </main>
  );
}
