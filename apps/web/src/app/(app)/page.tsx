"use client";

import Link from "next/link";

import { useAuth } from "@/hooks/use-auth";

export default function HomePage() {
  const { user, isLoading, signOut } = useAuth();

  if (isLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-base text-gray-300">Carregando sessão...</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="flex max-w-md flex-col gap-3">
        <h1 className="text-3xl font-bold sm:text-4xl">SafeStop</h1>
        <p className="text-base text-gray-300 sm:text-lg">Painel Web — sessão autenticada.</p>
        {user?.email ? (
          <p className="text-sm text-gray-400">
            Conectado como <span className="font-medium text-gray-200">{user.email}</span>
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-400"
          href="/profile"
        >
          Meu perfil
        </Link>

        <button
          className="rounded-lg border border-gray-700 px-4 py-2 text-sm font-medium text-gray-200 transition hover:border-gray-500 hover:text-white"
          onClick={() => {
            void signOut();
          }}
          type="button"
        >
          Sair
        </button>
      </div>
    </main>
  );
}
