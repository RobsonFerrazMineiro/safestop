"use client";

import type { ReactNode } from "react";

type CollapsibleSectionProps = {
  summary: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
  className?: string;
};

/**
 * Disclosure nativo (`<details>`/`<summary>`) usado para os blocos
 * colapsáveis da Seção I (Detalhe da PP): "Registro", MDHO concluído/aprovado
 * e Referência IMS já registrada. Puramente apresentacional — não altera
 * nenhuma regra de habilitação/permissão do conteúdo interno.
 */
export function CollapsibleSection({
  summary,
  defaultOpen = false,
  children,
  className,
}: CollapsibleSectionProps) {
  return (
    <details className={className} open={defaultOpen}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 marker:content-none [&::-webkit-details-marker]:hidden">
        {summary}
      </summary>
      <div className="mt-4">{children}</div>
    </details>
  );
}
