export function OrganizationEmpty() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-bold text-gray-100">Nenhuma organização disponível</h1>
      <p className="max-w-md text-sm text-gray-400">
        Sua conta não possui vínculo ativo com nenhuma organização. Entre em contato com o
        administrador da plataforma.
      </p>
    </main>
  );
}
