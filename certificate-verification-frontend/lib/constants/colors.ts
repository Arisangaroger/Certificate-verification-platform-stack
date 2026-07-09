// CertiChain Design System — Color Palette
//
// Brand identity: deep navy (trust, academia, blockchain permanence) paired with
// a restrained academic gold accent. Each hue is a full tonal ramp so surfaces,
// borders, hovers and text all draw from intentional steps rather than one flat
// value. Emerald/amber/red stay reserved for semantic status only.

export const colors = {
  // Canvas surfaces (~60% of any screen)
  canvas: {
    white: '#FFFFFF',
    slateLight: '#F8FAFC',
  },

  // Structural neutrals (~30%)
  structural: {
    deepSlate: '#0F172A',
    slate600: '#475569',
    slate400: '#94A3B8',
  },

  // Brand — deep navy. 800 (#1B2A4A) is the primary brand / CTA / sidebar color.
  brand: {
    50: '#F3F5F9',
    100: '#E2E8F1',
    200: '#C2CDDF',
    300: '#95A6C4',
    400: '#5E739B',
    500: '#3D5078',
    600: '#2A3C5E',
    700: '#213150',
    800: '#1B2A4A',
    900: '#121C33',
  },

  // Accent — academic gold. 500 (#C9A84C) anchors highlights, the verified ring,
  // and hover/focus emphasis. Used sparingly; never for body text (low contrast).
  gold: {
    50: '#FBF8EF',
    100: '#F6EFD6',
    200: '#ECDCA9',
    300: '#E0C778',
    400: '#D5B65B',
    500: '#C9A84C',
    600: '#AC8B39',
    700: '#856A2B',
  },

  // Semantic status signals only (~10%)
  state: {
    verified: '#10B981',
    verifiedLight: '#D1FAE5',
    issued: '#D97706',
    issuedLight: '#FEF3C7',
    error: '#DC2626',
    errorLight: '#FEE2E2',
  },
} as const;

export type Colors = typeof colors;
