/**
 * Escala tipográfica — Seção O, UX-CONVERGENCE-UI-SPEC.md
 * fontSize em px; fontWeight numérico (400/500/600/700).
 */

export type TypographyStyle = {
  readonly fontSize: number;
  readonly fontWeight: 400 | 500 | 600 | 700;
};

export const typography = {
  pageTitle: { fontSize: 32, fontWeight: 700 },
  sectionTitle: { fontSize: 28, fontWeight: 700 },
  cardTitle: { fontSize: 24, fontWeight: 600 },
  body: { fontSize: 16, fontWeight: 400 },
  label: { fontSize: 14, fontWeight: 500 },
  helper: { fontSize: 12, fontWeight: 400 },
  caption: { fontSize: 12, fontWeight: 400 },
  kpi: { fontSizeMin: 28, fontSizeMax: 32, fontWeight: 700 },
} as const satisfies Record<
  string,
  TypographyStyle | { fontSizeMin: number; fontSizeMax: number; fontWeight: 700 }
>;

export type TypographyToken = keyof typeof typography;
