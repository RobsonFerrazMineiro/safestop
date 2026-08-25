"use client";

import { type FormEvent, useState, useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { AuthServiceError } from "@/lib/auth/errors";
import { useAuth } from "@/hooks/use-auth";

function subscribeToClientMount(): () => void {
  return () => undefined;
}

function getClientSnapshot(): boolean {
  return true;
}

function getServerSnapshot(): boolean {
  return false;
}

function useIsClientMounted(): boolean {
  return useSyncExternalStore(subscribeToClientMount, getClientSnapshot, getServerSnapshot);
}

function LoginPageShell() {
  return (
    <main className="flex flex-col gap-6">
      <header className="text-center">
        <h1 className="text-3xl font-bold sm:text-4xl">SafeStop</h1>
        <p className="mt-2 text-base text-muted-foreground">
          Entre com suas credenciais para acessar o painel.
        </p>
      </header>

      <div aria-hidden="true" className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 text-left">
          <span className="text-sm font-medium">E-mail</span>
          <Skeleton className="h-10 rounded-md" />
        </div>
        <div className="flex flex-col gap-2 text-left">
          <span className="text-sm font-medium">Senha</span>
          <Skeleton className="h-10 rounded-md" />
        </div>
        <Skeleton className="h-10 rounded-md bg-primary/60" />
      </div>
    </main>
  );
}

function LoginForm() {
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
        <p className="mt-2 text-base text-muted-foreground">
          Entre com suas credenciais para acessar o painel.
        </p>
      </header>

      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-2 text-left">
          <label className="text-sm font-medium" htmlFor="email">
            E-mail
          </label>
          <Input
            autoComplete="email"
            data-testid="login-email"
            disabled={isLoading || isSubmitting}
            id="email"
            name="email"
            suppressHydrationWarning
            onChange={(event) => setEmail(event.target.value)}
            required
            type="email"
            value={email}
          />
        </div>

        <div className="flex flex-col gap-2 text-left">
          <label className="text-sm font-medium" htmlFor="password">
            Senha
          </label>
          <Input
            autoComplete="current-password"
            data-testid="login-password"
            disabled={isLoading || isSubmitting}
            id="password"
            name="password"
            suppressHydrationWarning
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
        </div>

        {errorMessage ? (
          <p
            className="rounded-lg border border-destructive/60 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            data-testid="login-error"
            role="alert"
          >
            {errorMessage}
          </p>
        ) : null}

        <Button
          className="w-full"
          data-testid="login-submit"
          disabled={isLoading || isSubmitting}
          size="lg"
          type="submit"
        >
          {isSubmitting ? "Entrando..." : "Entrar"}
        </Button>
      </form>
    </main>
  );
}

export default function LoginPage() {
  const mounted = useIsClientMounted();

  if (!mounted) {
    return <LoginPageShell />;
  }

  return <LoginForm />;
}
