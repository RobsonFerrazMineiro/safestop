/**
 * Elevation e overlay — spec 0a.1 (PR-0a).
 * Sombra preta sóbria; sem glow laranja. Overlay é scrim, não sombra.
 */

export type ElevationNative = {
  readonly shadowColor: string;
  readonly shadowOffset: { readonly width: number; readonly height: number };
  readonly shadowOpacity: number;
  readonly shadowRadius: number;
  readonly elevation: number;
};

export type ElevationToken = {
  readonly boxShadow: string;
  readonly native: ElevationNative;
};

export const elevation = {
  none: {
    boxShadow: "none",
    native: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
  },
  card: {
    boxShadow: "0 1px 2px rgba(0,0,0,0.28), 0 1px 3px rgba(0,0,0,0.18)",
    native: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.28,
      shadowRadius: 2,
      elevation: 2,
    },
  },
  overlay: {
    boxShadow: "0 8px 24px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.35)",
    native: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 8,
    },
  },
} as const satisfies Record<"none" | "card" | "overlay", ElevationToken>;

export type ElevationLevel = keyof typeof elevation;

/** Backdrop único de dialog/drawer/AlertDialog. Proibido scrim laranja. */
export const overlay = {
  scrim: "rgba(0, 0, 0, 0.60)",
} as const;

export type OverlayToken = keyof typeof overlay;
