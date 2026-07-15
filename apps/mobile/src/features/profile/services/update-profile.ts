import { profileUpdateSchema, type ProfileUpdateInput } from "@safestop/validation";

import { getSupabaseClient } from "@/lib/auth/client";

import { PROFILE_INACTIVE_MESSAGE, type Profile } from "../types";

const PROFILE_SELECT =
  "id, full_name, phone, job_title, avatar_path, is_active, created_at, updated_at, last_access_at";

export async function updateProfile(input: ProfileUpdateInput): Promise<Profile> {
  const parsed = profileUpdateSchema.parse(input);
  const supabase = getSupabaseClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Não autenticado.");
  }

  const { data: currentProfile, error: profileError } = await supabase
    .from("profiles")
    .select("is_active")
    .eq("id", user.id)
    .single();

  if (profileError || !currentProfile) {
    throw new Error("Não foi possível salvar o perfil.");
  }

  if (!currentProfile.is_active) {
    throw new Error(PROFILE_INACTIVE_MESSAGE);
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.fullName,
      phone: parsed.phone ?? null,
    })
    .eq("id", user.id)
    .select(PROFILE_SELECT)
    .single();

  if (error) {
    throw new Error("Não foi possível salvar o perfil.");
  }

  return data;
}
