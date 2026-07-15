"use client";

import Link from "next/link";

import { useRequirePermission } from "@/features/authorization";

export default function NewOccurrencePage() {
  useRequirePermission("occurrence.create");

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-6 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-gray-100">Nova ocorrência</h1>
        <p className="text-sm text-gray-400">
          Placeholder operacional — registro de Paralisação Preventiva (Sprint futura).
        </p>
      </header>

      <p className="text-base text-gray-300">
        Esta rota exige a permissão <code className="text-orange-400">occurrence.create</code>.
      </p>

      <Link
        className="w-fit rounded-lg border border-gray-700 px-4 py-2 text-sm font-medium text-gray-200 transition hover:border-gray-500 hover:text-white"
        href="/"
      >
        Voltar ao início
      </Link>
    </main>
  );
}
