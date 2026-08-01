import { EvidenceSection } from "./evidence-section";

type EvidenceGalleryProps = {
  occurrenceId: string;
};

/** @deprecated Use EvidenceSection */
export function EvidenceGallery({ occurrenceId }: EvidenceGalleryProps) {
  return <EvidenceSection occurrenceId={occurrenceId} />;
}
