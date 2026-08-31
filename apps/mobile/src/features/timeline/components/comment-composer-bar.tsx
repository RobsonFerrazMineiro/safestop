import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import type { OccurrenceStatus } from "@safestop/types";
import { OCCURRENCE_COMMENT_MAX_LENGTH } from "@safestop/types";
import { colors, spacing } from "@safestop/ui";

import { useAuthorization } from "@/features/authorization/hooks/use-authorization";

import { getCommentDraft, setCommentDraft } from "../stores/comment-draft-store";
import { canComment, isCommentingBlocked } from "../utils/timeline-permissions";

type CommentComposerBarProps = {
  occurrenceId: string;
  occurrenceStatus: OccurrenceStatus;
  isOnline: boolean;
  isSubmitting: boolean;
  onSubmit: (content: string) => Promise<void>;
};

function readIsOnline(): boolean {
  const browserGlobal = globalThis as typeof globalThis & {
    navigator?: { onLine?: boolean };
  };

  return browserGlobal.navigator?.onLine !== false;
}

export function CommentComposerBar({
  occurrenceId,
  occurrenceStatus,
  isOnline,
  isSubmitting,
  onSubmit,
}: CommentComposerBarProps) {
  const { can } = useAuthorization();
  const canRead = can("occurrence.read");

  const [content, setContent] = useState(() => getCommentDraft(occurrenceId));
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (!canRead) {
    return null;
  }

  const effectiveOnline = isOnline && readIsOnline();
  const trimmed = content.trim();
  const canSend =
    canComment({ canRead, occurrenceStatus, isOnline: effectiveOnline }) &&
    trimmed.length > 0 &&
    trimmed.length <= OCCURRENCE_COMMENT_MAX_LENGTH &&
    !isSubmitting;

  const helperText = !effectiveOnline
    ? "Conecte-se para publicar comentário."
    : isCommentingBlocked(occurrenceStatus)
      ? "Não é possível comentar em ocorrência encerrada ou cancelada."
      : null;

  async function handleSubmit() {
    if (!canSend) {
      return;
    }

    setSubmitError(null);

    try {
      await onSubmit(trimmed);
      setContent("");
      setCommentDraft(occurrenceId, "");
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Não foi possível enviar o comentário.",
      );
    }
  }

  return (
    <View style={styles.container}>
      {helperText ? <Text style={styles.helper}>{helperText}</Text> : null}
      {submitError ? <Text style={styles.error}>{submitError}</Text> : null}

      <View style={styles.row}>
        <TextInput
          accessibilityLabel="Adicionar comentário"
          editable={!isSubmitting && effectiveOnline && !isCommentingBlocked(occurrenceStatus)}
          multiline
          placeholder="Adicionar comentário..."
          placeholderTextColor={colors.foregroundMuted}
          style={styles.input}
          value={content}
          onChangeText={(value) => {
            setContent(value);
            setCommentDraft(occurrenceId, value);
          }}
        />

        <Pressable
          accessibilityLabel={isSubmitting ? "Enviando comentário" : "Enviar comentário"}
          accessibilityRole="button"
          accessibilityState={{ disabled: !canSend, busy: isSubmitting }}
          disabled={!canSend}
          style={({ pressed }) => [
            styles.sendButton,
            !canSend && styles.sendButtonDisabled,
            pressed && canSend && styles.pressed,
          ]}
          onPress={() => {
            void handleSubmit();
          }}
        >
          {isSubmitting ? (
            <ActivityIndicator color={colors.background} size="small" />
          ) : (
            <Text style={styles.sendText}>Enviar</Text>
          )}
        </Pressable>
      </View>

      {content.length > OCCURRENCE_COMMENT_MAX_LENGTH - 200 ? (
        <Text style={styles.counter}>
          {content.trim().length}/{OCCURRENCE_COMMENT_MAX_LENGTH}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[2],
    paddingTop: spacing[3],
  },
  counter: {
    color: colors.foregroundMuted,
    fontSize: 12,
    textAlign: "right",
  },
  error: {
    color: colors.destructive,
    fontSize: 13,
  },
  helper: {
    color: colors.foregroundMuted,
    fontSize: 13,
  },
  input: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    color: colors.foreground,
    flex: 1,
    fontSize: 15,
    maxHeight: 120,
    minHeight: 44,
    paddingHorizontal: spacing[3],
    paddingVertical: 10,
  },
  pressed: {
    opacity: 0.85,
  },
  row: {
    alignItems: "flex-end",
    flexDirection: "row",
    gap: 10,
  },
  sendButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 44,
    minWidth: 72,
    paddingHorizontal: spacing[3],
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: "700",
  },
});
