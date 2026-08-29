"use client";

import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";

export function AuthorizationForbidden() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <PageHeader
        actions={
          <Button asChild>
            <Link href="/">Voltar ao início</Link>
          </Button>
        }
        className="max-w-md items-center sm:flex-col sm:items-center"
        subtitle="Você não possui permissão para acessar esta área na organização ativa."
        title="Acesso negado"
      />
    </main>
  );
}
