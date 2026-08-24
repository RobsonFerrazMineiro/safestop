/**
 * Escala de spacing — Seção O, UX-CONVERGENCE-UI-SPEC.md
 * Valores em px lógicos (4·8·12·16·20·24·32·40·48·64·80·96).
 */

export const spacing = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
  24: 96,
} as const;

export type SpacingToken = keyof typeof spacing;

/** Lista ordenada da escala oficial para iteração/documentação. */
export const spacingScale = [
  spacing[1],
  spacing[2],
  spacing[3],
  spacing[4],
  spacing[5],
  spacing[6],
  spacing[8],
  spacing[10],
  spacing[12],
  spacing[16],
  spacing[20],
  spacing[24],
] as const;
