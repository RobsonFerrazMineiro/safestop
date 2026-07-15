import { createClient } from "@/lib/auth/client";

import type { Profile } from "../types";

const PROFILE_SELECT =
  "id, full_name, phone, job_title, avatar_path, is_active, created_at, updated_at, last_access_at";

export async function getProfile(): Promise<Profile | null> {
  const supabase = createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Não autenticado.");
  }

  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_SELECT)
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error("Não foi possível carregar o perfil.");
  }

  return data;
}
