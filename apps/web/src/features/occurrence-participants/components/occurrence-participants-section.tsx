"use client";

import { useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { useOccurrenceParticipants } from "../hooks/use-occurrence-participants";
import { getParticipantTypeLabel } from "../utils/participant-labels";

const COLLAPSE_THRESHOLD = 3;

type OccurrenceParticipantsSectionProps = {
  occurrenceId: string;
};

export function OccurrenceParticipantsSection({
  occurrenceId,
}: OccurrenceParticipantsSectionProps) {
  const { participants, isLoading, isError } = useOccurrenceParticipants(occurrenceId);
  const [isExpanded, setIsExpanded] = useState(false);

  if (isLoading) {
    return (
      <Card className="gap-4 py-4">
        <CardHeader className="px-4">
          <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Quem está envolvido
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4">
          <span
            aria-hidden="true"
            className="inline-block size-4 animate-spin rounded-full border-2 border-primary border-t-transparent"
          />
          <span className="sr-only">Carregando envolvidos</span>
        </CardContent>
      </Card>
    );
  }

  if (isError || participants.length === 0) {
    return null;
  }

  const shouldCollapse = participants.length > COLLAPSE_THRESHOLD;
  const visibleParticipants =
    shouldCollapse && !isExpanded ? participants.slice(0, COLLAPSE_THRESHOLD) : participants;
  const hiddenCount = participants.length - COLLAPSE_THRESHOLD;

  return (
    <Card className="gap-4 py-4">
      <CardHeader className="px-4">
        <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Quem está envolvido
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 px-4">
        <ul className="flex flex-col gap-2.5">
          {visibleParticipants.map((participant) => (
            <li className="flex items-start gap-2 text-sm" key={participant.id}>
              <span aria-hidden="true" className="mt-1 text-[10px] leading-none text-primary">
                ●
              </span>
              <span className="text-muted-foreground">
                {getParticipantTypeLabel(participant.participantType)}
                {" — "}
                <span className="font-semibold text-foreground">
                  {participant.memberName ?? "—"}
                </span>
              </span>
            </li>
          ))}
        </ul>

        {shouldCollapse ? (
          <button
            aria-expanded={isExpanded}
            aria-label={
              isExpanded
                ? "Mostrar menos participantes"
                : `Mostrar mais ${hiddenCount} participantes`
            }
            className="w-fit text-sm font-semibold text-primary hover:text-primary/80"
            type="button"
            onClick={() => {
              setIsExpanded((current) => !current);
            }}
          >
            {isExpanded ? "Mostrar menos" : `Mostrar mais (${hiddenCount})`}
          </button>
        ) : null}
      </CardContent>
    </Card>
  );
}
