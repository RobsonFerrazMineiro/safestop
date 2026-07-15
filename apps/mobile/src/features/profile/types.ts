export const PROFILE_INACTIVE_MESSAGE =
  "Seu perfil está inativo. Entre em contato com o administrador para reativá-lo.";

export type Profile = {
  id: string;
  full_name: string;
  phone: string | null;
  job_title: string | null;
  avatar_path: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_access_at: string | null;
};

export const PROFILE_QUERY_KEY = "profile" as const;
