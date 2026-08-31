import { Building2 } from "lucide-react";

import { SurfaceIcon } from "@/components/surface-icon";

export function OrganizationEmpty() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <SurfaceIcon className="text-muted-foreground" icon={Building2} variant="empty" />
      <h1 className="text-2xl font-bold text-foreground">Nenhuma organização disponível</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Sua conta não possui vínculo ativo com nenhuma organização. Entre em contato com o
        administrador da plataforma.
      </p>
    </main>
  );
}
