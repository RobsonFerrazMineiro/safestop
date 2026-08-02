/**
 * Inputs client-side MDHO (camelCase) — Sprint 2.6.
 */

export type MdhoSelectionInput = {
  categoryId: string;
  optionId: string;
  detail?: string;
};

export type SaveMdhoDraftInput = {
  assessmentId: string;
  selections?: MdhoSelectionInput[];
  complement?: string;
  expectedUpdatedAt?: string;
};

export type SubmitMdhoInput = {
  assessmentId: string;
  selections: MdhoSelectionInput[];
  complement?: string;
};

export type ReturnMdhoInput = {
  assessmentId: string;
  returnReason: string;
};
