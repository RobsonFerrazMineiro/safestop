/**
 * Catálogo MDHO — categorias e opções (Sprint 2.6; docs/database.md §14.2–14.3).
 */

/** Códigos oficiais das categorias seed (PO-MDHO-8). */
export const MDHO_CATEGORY_CODES = [
  "BEHAVIOR",
  "DEVIATION_TYPE",
  "PRECONDITIONS",
  "ORGANIZATIONAL_ISSUES",
  "SUPERVISION_INSPECTION",
] as const;

export type MdhoCategoryCode = (typeof MDHO_CATEGORY_CODES)[number];

export const MDHO_DEVIATION_TYPE_CATEGORY_CODE = "DEVIATION_TYPE" as const;

export const MDHO_OTHER_OPTION_CODE = "OTHER" as const;

export type MdhoCatalogOption = {
  id: string;
  categoryId: string;
  code: string;
  label: string;
  allowsDetail: boolean;
  displayOrder: number;
};

export type MdhoCatalogCategory = {
  id: string;
  code: MdhoCategoryCode;
  name: string;
  description: string | null;
  allowsMultiple: boolean;
  requiresSelection: boolean;
  displayOrder: number;
  options: MdhoCatalogOption[];
};

export type MdhoCatalog = {
  categories: MdhoCatalogCategory[];
};

export function isMdhoCategoryCode(value: string): value is MdhoCategoryCode {
  return (MDHO_CATEGORY_CODES as readonly string[]).includes(value);
}
