/**
 * Paleta de cores — Seção O, UX-CONVERGENCE-UI-SPEC.md
 * Identidade: dark industrial, primary laranja #F97316.
 */

export const colors = {
  background: "#0F1115",
  surface: "#171A21",
  surfaceMuted: "#20242D",
  surfaceElevated: "#2A303B",
  border: "#2E3440",
  foreground: "#F3F4F6",
  foregroundMuted: "#9CA3AF",
  primary: "#F97316",
  primaryHover: "#EA580C",
  primaryActive: "#C2410C",
  destructive: "#DC2626",
  success: "#16A34A",
  warning: "#FACC15",
  info: "#2563EB",
} as const;

export type ColorToken = keyof typeof colors;

/**
 * Disabled: 40% de opacidade sobre o token base (Seção O).
 * Não é cor fixa — usar esta constante ou `withDisabledOpacity`.
 */
export const DISABLED_OPACITY = 0.4 as const;

/**
 * Converte um token hex em rgba com opacidade de disabled (40% por padrão).
 * Compatível com CSS e React Native StyleSheet.
 */
export function withDisabledOpacity(hexColor: string, opacity: number = DISABLED_OPACITY): string {
  const normalized = hexColor.replace("#", "");

  if (normalized.length !== 6) {
    throw new Error(`withDisabledOpacity: cor hex inválida "${hexColor}"`);
  }

  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}
