import { loadQaCredentials, loadSupabaseLocalEnv, escapeSqlLiteral, runLocalSql } from "./_local-env.mjs";

async function listUserByEmail(apiUrl, serviceRoleKey, email) {
  const response = await fetch(
    `${apiUrl}/auth/v1/admin/users?email=${encodeURIComponent(email)}`,
    {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Falha ao consultar usuário admin (${response.status}): ${body}`);
  }

  const payload = await response.json();
  return payload.users?.[0] ?? null;
}

async function createAuthUser(apiUrl, serviceRoleKey, { email, password, fullName }) {
  const response = await fetch(`${apiUrl}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Falha ao criar usuário admin (${response.status}): ${body}`);
  }

  return response.json();
}

async function upsertProfile(userId, { email, fullName }) {
  const sql = `
    insert into public.profiles (id, full_name, email, is_active)
    values ('${userId}'::uuid, '${escapeSqlLiteral(fullName)}', '${escapeSqlLiteral(email)}', true)
    on conflict (id) do update set
      full_name = excluded.full_name,
      email = excluded.email,
      is_active = true;
  `;

  runLocalSql(sql);
}

async function main() {
  const credentials = loadQaCredentials();
  const { apiUrl, serviceRoleKey } = loadSupabaseLocalEnv();

  let user = await listUserByEmail(apiUrl, serviceRoleKey, credentials.email);

  if (!user) {
    user = await createAuthUser(apiUrl, serviceRoleKey, credentials);
    console.log(`Usuário Auth criado: ${credentials.email}`);
  } else {
    console.log(`Usuário Auth já existente: ${credentials.email}`);
  }

  await upsertProfile(user.id, credentials);

  console.log("Profile provisionado com sucesso.");
  console.log(`  user_id: ${user.id}`);
  console.log(`  profile_id: ${user.id}`);
  console.log(`  email: ${credentials.email}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
