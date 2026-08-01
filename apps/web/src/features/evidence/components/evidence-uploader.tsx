"use client";

import { useId } from "react";

import { OCCURRENCE_ATTACHMENT_MIME_TYPES } from "@safestop/types";

import { EVIDENCE_TILE_SIZE_CLASS } from "../types";

const ACCEPTED_MIME_TYPES = OCCURRENCE_ATTACHMENT_MIME_TYPES.join(",");

type EvidenceUploaderProps = {
  disabled?: boolean;
  inputId?: string;
  onSelectFiles: (files: FileList | File[]) => void | Promise<void>;
};

function CameraIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5 text-orange-400"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      viewBox="0 0 24 24"
    >
      <path
        d="M4 7h3l1.5-2h7L17 7h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  );
}

export function EvidenceUploader({
  disabled = false,
  inputId: externalInputId,
  onSelectFiles,
}: EvidenceUploaderProps) {
  const generatedId = useId();
  const inputId = externalInputId ?? generatedId;

  return (
    <>
      <label
        aria-label="Adicionar evidência"
        className={`${EVIDENCE_TILE_SIZE_CLASS} flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-gray-600 bg-gray-950/60 transition hover:border-orange-400 hover:bg-gray-900/80 ${disabled ? "pointer-events-none opacity-50" : ""}`}
        htmlFor={inputId}
      >
        <CameraIcon />
        <span className="text-[10px] font-medium text-gray-300">Adicionar</span>
      </label>

      <input
        accept={ACCEPTED_MIME_TYPES}
        className="sr-only"
        disabled={disabled}
        id={inputId}
        multiple
        type="file"
        onChange={(event) => {
          if (event.target.files && event.target.files.length > 0) {
            void onSelectFiles(event.target.files);
            event.target.value = "";
          }
        }}
      />
    </>
  );
}
