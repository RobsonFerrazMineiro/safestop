/**
 * Radius por componente — Seção O, UX-CONVERGENCE-UI-SPEC.md
 * Escala base: 4·8·12·16·24. Não copiar radius único do Base44 (~10px).
 */

/** Escala numérica de referência (px). */
export const radiusScale = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
} as const;

/** Radius atribuído por tipo de componente. */
export const radius = {
  input: 8,
  button: 8,
  card: 12,
  dialog: 16,
  drawer: 16,
  badge: 999,
  chip: 999,
} as const;

export type RadiusScaleToken = keyof typeof radiusScale;
export type RadiusComponentToken = keyof typeof radius;
