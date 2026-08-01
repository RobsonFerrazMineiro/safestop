import { EvidenceSection } from "./evidence-section";

type EvidencePickerSectionProps = {
  occurrenceId: string;
  title?: string;
  description?: string;
};

/** @deprecated Use EvidenceSection */
export function EvidencePickerSection({ occurrenceId }: EvidencePickerSectionProps) {
  return <EvidenceSection occurrenceId={occurrenceId} showOfflineBanner={false} />;
}
