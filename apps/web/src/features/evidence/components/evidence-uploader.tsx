"use client";

import { useId } from "react";
import { FilePlus } from "lucide-react";

import { OCCURRENCE_ATTACHMENT_MIME_TYPES } from "@safestop/types";

import { SurfaceIcon } from "@/components/surface-icon";

import { EVIDENCE_TILE_SIZE_CLASS } from "../types";

const ACCEPTED_MIME_TYPES = OCCURRENCE_ATTACHMENT_MIME_TYPES.join(",");

type EvidenceUploaderProps = {
  disabled?: boolean;
  inputId?: string;
  onSelectFiles: (files: FileList | File[]) => void | Promise<void>;
};

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
        className={`${EVIDENCE_TILE_SIZE_CLASS} flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-gray-600 bg-gray-950/60 transition hover:border-primary hover:bg-gray-900/80 ${disabled ? "pointer-events-none opacity-50" : ""}`}
        htmlFor={inputId}
      >
        <SurfaceIcon className="text-primary" icon={FilePlus} variant="kpi" />
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
