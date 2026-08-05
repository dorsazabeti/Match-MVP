import { Platform } from "react-native";


export const colors = {
  primary: "#6D3FF2",
  primaryDark: "#4D24C6",
  primarySoft: "#F0EAFF",
  primaryMuted: "#DCCFFF",
  accent: "#FF6B8A",
  accentSoft: "#FFF0F4",
  background: "#F8F8FC",
  surface: "#FFFFFF",
  surfaceMuted: "#F1F0F7",
  text: "#201C2F",
  textSecondary: "#746F82",
  textMuted: "#A09AAA",
  border: "#E5E2EC",
  borderStrong: "#CEC8DB",
  error: "#C93F5B",
  errorSoft: "#FFF0F2",
  success: "#168262",
  successSoft: "#E9F8F2",
  warning: "#B76B13",
  warningSoft: "#FFF5E5",
  overlay: "rgba(24, 18, 43, 0.48)",
};

export const spacing = {
  xs: 4,
  s: 8,
  sm: 12,
  m: 16,
  l: 24,
  xl: 32,
  xxl: 48,
};

export const typography = {
  display: { fontSize: 34, lineHeight: 44, fontWeight: "800" as const },
  h1: { fontSize: 28, lineHeight: 38, fontWeight: "800" as const },
  h2: { fontSize: 21, lineHeight: 30, fontWeight: "800" as const },
  h3: { fontSize: 17, lineHeight: 26, fontWeight: "700" as const },
  body: { fontSize: 16, lineHeight: 26, fontWeight: "normal" as const },
  caption: { fontSize: 14, lineHeight: 22, color: colors.textSecondary },
  micro: { fontSize: 12, lineHeight: 18, color: colors.textSecondary },
};

export const layout = {
  minTouchTarget: 48,
  borderRadius: 14,
  cardRadius: 22,
  screenMaxWidth: 680,
};

export const shadow = {
  card: Platform.select({
    web: {
      boxShadow: "0 8px 22px rgba(43, 23, 87, 0.07)",
    },
    default: {
      shadowColor: "#2B1757",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.07,
      shadowRadius: 22,
      elevation: 3,
    },
  }) ?? {},
};

export const theme = {
  colors,
  spacing,
  typography,
  layout,
  shadow,
};
