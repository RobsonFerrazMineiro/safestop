"use client";

import { useMemo } from "react";

import { useOccurrenceTimeline } from "@/features/timeline/hooks/use-occurrence-timeline";

import { useRecordVerEAgirDecision } from "../hooks/use-record-ver-e-agir-decision";
import type { VerEAgirOccurrence } from "../types";
import { EvaluationContextCard } from "./evaluation-context-card";
import { OfflineNotice } from "./ver-e-agir-states";
import { VerEAgirDecisionForm } from "./ver-e-agir-decision-form";

type VerEAgirPanelProps = {
  occurrence: VerEAgirOccurrence;
  organizationId: string;
  isOffline: boolean;
  onConflict: () => void;
  onAlreadyDecided: () => void;
};

export function VerEAgirPanel({
  occurrence,
  organizationId,
  isOffline,
  onConflict,
  onAlreadyDecided,
}: VerEAgirPanelProps) {
  const { mutateAsync, isPending } = useRecordVerEAgirDecision(occurrence.id, organizationId);
  const { items } = useOccurrenceTimeline(occurrence.id, organizationId);

  const commentDraft = useMemo(() => {
    const commentItem = items.find((item) => item.kind === "COMMENT_ADDED");

    if (!commentItem) {
      return null;
    }

    const content = commentItem.body?.trim();
    return content && content.length > 0 ? content : null;
  }, [items]);

  return (
    <div className="flex flex-col gap-4">
      <EvaluationContextCard occurrence={occurrence} />

      <div className="flex flex-col gap-4 rounded-lg border border-amber-700/40 bg-amber-950/20 p-4">
        <div className="flex flex-col gap-1">
          <h3 className="text-base font-semibold text-amber-100">Ver e Agir</h3>
          <p className="text-sm text-amber-200/80">Resolução imediata no campo</p>
        </div>

        {isOffline ? (
          <OfflineNotice message="Você está offline. Conecte-se para registrar a decisão." />
        ) : null}

        <VerEAgirDecisionForm
          commentDraft={commentDraft}
          isOffline={isOffline}
          isPending={isPending}
          occurrenceId={occurrence.id}
          onAlreadyDecided={onAlreadyDecided}
          onConflict={onConflict}
          onSubmit={async (decisionReason) => {
            await mutateAsync({ decisionReason });
          }}
        />
      </div>
    </div>
  );
}
