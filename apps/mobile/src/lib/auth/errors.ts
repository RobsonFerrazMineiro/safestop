export const LOGIN_ERROR_MESSAGE = "E-mail ou senha inválidos.";

export class AuthServiceError extends Error {
  constructor(message: string = LOGIN_ERROR_MESSAGE) {
    super(message);
    this.name = "AuthServiceError";
  }
}

export function mapAuthError(_error: unknown): AuthServiceError {
  return new AuthServiceError(LOGIN_ERROR_MESSAGE);
}
