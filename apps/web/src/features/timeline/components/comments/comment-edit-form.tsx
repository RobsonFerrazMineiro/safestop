"use client";

import { useState } from "react";
import { OCCURRENCE_COMMENT_MAX_LENGTH } from "@safestop/types";

type CommentEditFormProps = {
  initialContent: string;
  isSaving: boolean;
  errorMessage: string | null;
  onCancel: () => void;
  onSave: (content: string) => void;
};

export function CommentEditForm({
  initialContent,
  isSaving,
  errorMessage,
  onCancel,
  onSave,
}: CommentEditFormProps) {
  const [content, setContent] = useState(initialContent);
  const trimmed = content.trim();
  const canSave = trimmed.length > 0 && trimmed.length <= OCCURRENCE_COMMENT_MAX_LENGTH;

  return (
    <div className="mt-2 flex flex-col gap-2 rounded-md border border-gray-700 bg-gray-950/60 p-3">
      <textarea
        className="min-h-20 w-full resize-y rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-100 outline-none focus:border-orange-500"
        maxLength={OCCURRENCE_COMMENT_MAX_LENGTH}
        value={content}
        onChange={(event) => setContent(event.target.value)}
      />
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-gray-500">
          {content.length}/{OCCURRENCE_COMMENT_MAX_LENGTH}
        </span>
        <div className="flex gap-2">
          <button
            className="rounded-md border border-gray-700 px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-800"
            disabled={isSaving}
            type="button"
            onClick={onCancel}
          >
            Cancelar
          </button>
          <button
            className="rounded-md bg-orange-500 px-3 py-1.5 text-xs font-medium text-gray-950 hover:bg-orange-400 disabled:opacity-50"
            disabled={!canSave || isSaving}
            type="button"
            onClick={() => onSave(trimmed)}
          >
            {isSaving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
      {errorMessage ? <p className="text-xs text-red-300">{errorMessage}</p> : null}
    </div>
  );
}
