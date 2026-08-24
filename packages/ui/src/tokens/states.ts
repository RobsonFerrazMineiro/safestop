/**
 * Estados de componente — Seção O + docs/design-system.md
 * Enumeração sem implementação visual (contrato compartilhado Web/Mobile).
 */

export const componentStates = [
  "default",
  "hover",
  "pressed",
  "focused",
  "disabled",
  "loading",
  "success",
] as const;

export type ComponentState = (typeof componentStates)[number];
