import { loadQaCredentials, loadSupabaseLocalEnv } from "./_local-env.mjs";

async function signInWithPassword(apiUrl, anonKey, email, password) {
  const response = await fetch(`${apiUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`signInWithPassword falhou (${response.status}): ${body}`);
  }

  return response.json();
}

async function fetchOwnProfile(apiUrl, anonKey, accessToken, userId) {
  const response = await fetch(
    `${apiUrl}/rest/v1/profiles?select=id,full_name,email,is_active&id=eq.${userId}`,
    {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Consulta autenticada a profiles falhou (${response.status}): ${body}`);
  }

  return response.json();
}

async function fetchForeignProfile(apiUrl, anonKey, accessToken, foreignUserId) {
  const response = await fetch(
    `${apiUrl}/rest/v1/profiles?select=id,full_name,email&id=eq.${foreignUserId}`,
    {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Consulta a perfil alheio falhou (${response.status}): ${body}`);
  }

  return response.json();
}

async function main() {
  const credentials = loadQaCredentials();
  const { apiUrl, anonKey } = loadSupabaseLocalEnv();

  console.log("1) signInWithPassword...");
  const session = await signInWithPassword(
    apiUrl,
    anonKey,
    credentials.email,
    credentials.password,
  );

  const userId = session.user?.id;
  const accessToken = session.access_token;

  if (!userId || !accessToken) {
    throw new Error("Resposta de autenticação sem user.id ou access_token.");
  }

  console.log(`   OK — user_id=${userId}`);

  console.log("2) Consulta autenticada a profiles (próprio perfil)...");
  const ownProfiles = await fetchOwnProfile(apiUrl, anonKey, accessToken, userId);

  if (ownProfiles.length !== 1) {
    throw new Error(
      `Esperado 1 perfil para auth.uid(), recebido ${ownProfiles.length}. Verifique RLS/policy profiles_select.`,
    );
  }

  if (ownProfiles[0].id !== userId) {
    throw new Error("Perfil retornado não corresponde a auth.uid().");
  }

  console.log(`   OK — profile_id=${ownProfiles[0].id}, full_name=${ownProfiles[0].full_name}`);

  console.log("3) RLS — perfil de outro usuário deve retornar vazio...");
  const foreignUserId = "00000000-0000-4000-8000-000000000099";
  const foreignProfiles = await fetchForeignProfile(
    apiUrl,
    anonKey,
    accessToken,
    foreignUserId,
  );

  if (foreignProfiles.length !== 0) {
    throw new Error("RLS falhou: usuário autenticado conseguiu ler perfil de outro usuário.");
  }

  console.log("   OK — 0 linhas para perfil alheio (RLS profiles_select).");
  console.log("Smoke test de Auth + RLS concluído com sucesso.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
