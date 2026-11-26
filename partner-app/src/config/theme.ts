export const COLORS = {
  // Brand Colors
  primary: "#C45508",
  primaryDark: "#9A3412",
  primaryLight: "#FFF7ED",
  primaryHover: "#EA580C",
  secondary: "#7E1926",
  secondaryLight: "#FFE4E6",

  // Status & Accents
  success: "#10B981",
  successLight: "#ECFDF5",
  successDark: "#047857",

  danger: "#EF4444",
  dangerLight: "#FEF2F2",
  dangerDark: "#B91C1C",

  warning: "#F59E0B",
  warningLight: "#FFFBEB",
  warningDark: "#B45309",

  info: "#3B82F6",
  infoLight: "#EFF6FF",

  // Background & Surface
  background: "#F8FAFC",
  backgroundSecondary: "#F1F5F9",
  card: "#FFFFFF",
  cardSecondary: "#F8FAFC",
  darkCard: "#0F172A",

  // Text
  text: "#0F172A",
  textSecondary: "#64748B",
  textTertiary: "#94A3B8",
  textMuted: "#94A3B8",
  textInverse: "#FFFFFF",

  // Borders & Dividers
  border: "#E2E8F0",
  borderLight: "#F1F5F9",
  borderActive: "#C45508",

  // Elevation Shadows
  shadow: "rgba(15, 23, 42, 0.08)",
  shadowMedium: "rgba(15, 23, 42, 0.12)",
  shadowDark: "rgba(15, 23, 42, 0.2)",
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

export const TYPOGRAPHY = {
  h1: {
    fontSize: 26,
    fontWeight: "800" as const,
    color: COLORS.text,
  },
  h2: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: COLORS.text,
  },
  h3: {
    fontSize: 17,
    fontWeight: "700" as const,
    color: COLORS.text,
  },
  body: {
    fontSize: 14,
    fontWeight: "400" as const,
    color: COLORS.text,
  },
  bodyBold: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: COLORS.text,
  },
  caption: {
    fontSize: 12,
    fontWeight: "500" as const,
    color: COLORS.textSecondary,
  },
  small: {
    fontSize: 11,
    fontWeight: "500" as const,
    color: COLORS.textSecondary,
  },
};
