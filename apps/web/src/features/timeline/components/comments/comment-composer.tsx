"use client";

import { useEffect, useState } from "react";
import { OCCURRENCE_COMMENT_MAX_LENGTH } from "@safestop/types";
import { createOccurrenceCommentSchema } from "@safestop/validation";

import { useAuthorization } from "@/features/authorization";

import { useCreateComment } from "../../hooks/use-create-comment";
import { canCommentOnOccurrence } from "../../utils/timeline-guards";

type CommentComposerProps = {
  occurrenceId: string;
  organizationId: string;
  occurrenceStatus: string;
  disabled?: boolean;
  onSuccess?: () => void;
};

export function CommentComposer({
  occurrenceId,
  organizationId,
  occurrenceStatus,
  disabled = false,
  onSuccess,
}: CommentComposerProps) {
  const { can } = useAuthorization();
  const [content, setContent] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(
    typeof navigator !== "undefined" ? !navigator.onLine : false,
  );
  const createComment = useCreateComment(occurrenceId, organizationId);

  useEffect(() => {
    function handleOnline() {
      setIsOffline(false);
    }

    function handleOffline() {
      setIsOffline(true);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const trimmed = content.trim();
  const canRead = can("occurrence.read");
  const canSubmit =
    trimmed.length > 0 &&
    trimmed.length <= OCCURRENCE_COMMENT_MAX_LENGTH &&
    !createComment.isPending &&
    !disabled &&
    !isOffline;

  const statusBlocked = !canCommentOnOccurrence(occurrenceStatus, canRead);
  const isDisabled = disabled || statusBlocked || isOffline || createComment.isPending;

  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
        Adicionar comentário
      </h3>

      {isOffline ? (
        <p className="text-xs text-amber-200">Você está offline. Conecte-se para comentar.</p>
      ) : null}

      {statusBlocked ? (
        <p className="text-xs text-gray-500">
          Não é possível comentar em ocorrência encerrada ou cancelada.
        </p>
      ) : null}

      <textarea
        aria-label="Adicionar comentário"
        className="min-h-24 w-full resize-y rounded-md border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-gray-100 outline-none focus:border-orange-500 disabled:opacity-50"
        disabled={isDisabled}
        maxLength={OCCURRENCE_COMMENT_MAX_LENGTH}
        placeholder="Adicionar comentário..."
        value={content}
        onChange={(event) => {
          setContent(event.target.value);
          setErrorMessage(null);
        }}
      />

      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-gray-500">
          {content.length}/{OCCURRENCE_COMMENT_MAX_LENGTH}
        </span>
        <button
          className="rounded-md bg-orange-500 px-4 py-2 text-sm font-medium text-gray-950 hover:bg-orange-400 disabled:opacity-50"
          disabled={!canSubmit || isDisabled}
          type="button"
          onClick={() => {
            const parsed = createOccurrenceCommentSchema.safeParse({
              occurrenceId,
              content: trimmed,
            });

            if (!parsed.success) {
              setErrorMessage(parsed.error.issues[0]?.message ?? "Comentário inválido.");
              return;
            }

            createComment.mutate(
              { content: parsed.data.content },
              {
                onSuccess: () => {
                  setContent("");
                  setErrorMessage(null);
                  onSuccess?.();
                },
                onError: (error) => {
                  setErrorMessage(
                    error instanceof Error
                      ? error.message
                      : "Não foi possível enviar o comentário.",
                  );
                },
              },
            );
          }}
        >
          {createComment.isPending ? "Enviando..." : "Enviar"}
        </button>
      </div>

      {errorMessage ? <p className="text-xs text-red-300">{errorMessage}</p> : null}
    </section>
  );
}
