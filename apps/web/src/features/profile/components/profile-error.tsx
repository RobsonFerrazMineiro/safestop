type ProfileErrorProps = {
  message?: string;
};

export function ProfileError({ message }: ProfileErrorProps) {
  return (
    <div
      className="rounded-lg border border-red-900/60 bg-red-950/40 px-4 py-3 text-sm text-red-200"
      role="alert"
    >
      {message ?? "Não foi possível carregar o perfil. Tente novamente mais tarde."}
    </div>
  );
}
