"use client";

type InterdicaoBannerProps = {
  className?: string;
};

export function InterdicaoBanner({ className }: InterdicaoBannerProps) {
  return (
    <div
      className={`flex items-center gap-3 rounded-lg border border-red-600/60 bg-red-950/40 px-4 py-3 text-red-100 ${className ?? ""}`}
      role="status"
    >
      <span aria-hidden="true" className="text-lg text-red-400">
        ⚠
      </span>
      <p className="text-sm font-medium">Atividade formalmente interditada</p>
    </div>
  );
}

export function InterdicaoForbiddenNotice() {
  return <span className="sr-only">Você não tem permissão para confirmar Interdição Oficial.</span>;
}

export { OfflineNotice as InterdicaoOfflineNotice } from "@/features/ver-e-agir/components/ver-e-agir-states";

export {
  AlreadyDecidedCard as InterdicaoAlreadyDecidedCard,
  EvaluationConflictCard as InterdicaoConflictCard,
} from "@/features/ver-e-agir/components/ver-e-agir-states";
