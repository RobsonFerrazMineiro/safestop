import Link from "next/link";

import { Can } from "@/features/authorization";

export function OccurrenceEmpty() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border border-gray-800 bg-gray-900/50 px-6 py-10 text-center">
      <p className="text-base text-gray-300">Nenhuma ocorrência registrada nesta organização.</p>
      <Can permission="occurrence.create">
        <Link
          className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-400"
          href="/occurrences/new"
        >
          Registrar paralisação
        </Link>
      </Can>
    </div>
  );
}
