/**
 * Alturas de controle — spec 0a.1 (PR-0a).
 * Web 36px = shadcn Button `h-9`. Mobile 44px = alvo de toque mínimo.
 */

export const controlHeight = {
  web: 36,
  mobile: 44,
} as const;

export type ControlHeightToken = keyof typeof controlHeight;
