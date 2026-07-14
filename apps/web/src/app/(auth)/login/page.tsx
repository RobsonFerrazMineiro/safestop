"use client";

import { type FormEvent, useState } from "react";

import { AuthServiceError } from "@/lib/auth/errors";
import { useAuth } from "@/hooks/use-auth";

export default function LoginPage() {
  const { signIn, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await signIn({ email, password });
    } catch (error) {
      if (error instanceof AuthServiceError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("E-mail ou senha inválidos.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex flex-col gap-6">
      <header className="text-center">
        <h1 className="text-3xl font-bold sm:text-4xl">SafeStop</h1>
        <p className="mt-2 text-base text-gray-300">
          Entre com suas credenciais para acessar o painel.
        </p>
      </header>

      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-2 text-left">
          <label className="text-sm font-medium text-gray-200" htmlFor="email">
            E-mail
          </label>
          <input
            autoComplete="email"
            className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-base text-gray-100 outline-none focus:border-orange-500"
            disabled={isLoading || isSubmitting}
            id="email"
            name="email"
            onChange={(event) => setEmail(event.target.value)}
            required
            type="email"
            value={email}
          />
        </div>

        <div className="flex flex-col gap-2 text-left">
          <label className="text-sm font-medium text-gray-200" htmlFor="password">
            Senha
          </label>
          <input
            autoComplete="current-password"
            className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-base text-gray-100 outline-none focus:border-orange-500"
            disabled={isLoading || isSubmitting}
            id="password"
            name="password"
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
        </div>

        {errorMessage ? (
          <p className="rounded-lg border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-200">
            {errorMessage}
          </p>
        ) : null}

        <button
          className="rounded-lg bg-orange-500 px-4 py-2 text-base font-semibold text-white transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isLoading || isSubmitting}
          type="submit"
        >
          {isSubmitting ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </main>
  );
}
