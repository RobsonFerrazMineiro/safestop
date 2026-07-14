import type { AuthError } from "@supabase/supabase-js";

export class AuthServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthServiceError";
  }
}

const GENERIC_AUTH_MESSAGE = "E-mail ou senha inválidos.";

export function mapAuthError(_error: AuthError): AuthServiceError {
  return new AuthServiceError(GENERIC_AUTH_MESSAGE);
}
