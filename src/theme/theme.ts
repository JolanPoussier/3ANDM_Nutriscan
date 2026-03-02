import { ViewStyle } from "react-native";

const sharedNutriColors = {
    nutriA: "#1b9e3e",
    nutriB: "#7cc043",
    nutriC: "#f6c244",
    nutriD: "#f08a2b",
    nutriE: "#d64541",
};

const sharedSemanticColors = {
    textInverse: "#ffffff",
    primary: "#10b981",
    primarySoft: "rgba(16, 185, 129, 0.15)",
    primarySoftStrong: "rgba(16, 185, 129, 0.2)",
    error: "#ef4444",
    errorText: "#ffb4b4",
    errorSoft: "rgba(239, 68, 68, 0.15)",
    errorBorder: "rgba(239, 68, 68, 0.4)",
    imagePlaceholderText: "#64748b",
    overlay: "rgba(0,0,0,0.65)",
    overlaySoft: "rgba(0,0,0,0.55)",
    badgeMuted: "rgba(255,255,255,0.45)",
    scannerBackground: "#000000",
    scannerMask: "rgba(0,0,0,0.65)",
    scannerMaskSoft: "rgba(0,0,0,0.6)",
    scannerFrame: "#10b981",
    scannerFrameSoft: "rgba(16, 185, 129, 0.05)",
    dividerSoft: "rgba(150,150,150,0.15)",
    rowBorderSoft: "rgba(255,255,255,0.03)",
    shadow: "#000000",
    ...sharedNutriColors,
};

export const colors = {
    light: {
        ...sharedSemanticColors,
        background: "#f8fafc",
        card: "#ffffff",
        cardSoft: "#f1f5f9",
        cardContrast: "#0f172a",
        border: "#e2e8f0",
        borderSoft: "rgba(0,0,0,0.05)",
        text: "#0f172a",
        textMuted: "#64748b",
        textSoft: "#94a3b8",
        imagePlaceholder: "#f1f5f9",
        badgeSoft: "#e2e8f0",
        tabInactive: "#a1a1aa",
        tabBackground: "#ffffff",
        neutralSoft: "rgba(0,0,0,0.02)",
        nutriUnknown: "rgba(0,0,0,0.12)",
    },
    dark: {
        ...sharedSemanticColors,
        background: "#0f172a",
        card: "#1e293b",
        cardSoft: "#0f172a",
        cardContrast: "#1e293b",
        border: "#334155",
        borderSoft: "rgba(255,255,255,0.1)",
        text: "#f8fafc",
        textMuted: "#94a3b8",
        textSoft: "#64748b",
        imagePlaceholder: "#0f172a",
        badgeSoft: "#334155",
        tabInactive: "#52525b",
        tabBackground: "#0b0b0c",
        neutralSoft: "rgba(255,255,255,0.03)",
        nutriUnknown: "rgba(255,255,255,0.18)",
    },
};

export const spacing = {
    xs: 4,
    sm: 8,
    md: 14,
    lg: 16,
    xl: 24,
    xxl: 32,
};

export const fontSizes = {
    xxs: 10,
    xs: 11,
    sm: 13,
    base: 14,
    md: 15,
    mdPlus: 16,
    lgMinus: 17,
    lg: 18,
    xlMinus: 20,
    xl: 24,
    xxl: 26,
    xxxl: 28,
};

export const fontWeights = {
    regular: "400" as const,
    medium: "500" as const,
    semiBold: "600" as const,
    bold: "700" as const,
    extraBold: "800" as const,
    heavy: "900" as const,
};

export const borderRadius = {
    sm: 8,
    md: 14,
    lg: 20,
    xl: 24,
    xxl: 30,
    pill: 999,
};

export const shadows = {
    light: {
        sm: {
            shadowColor: colors.light.shadow,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 4,
            elevation: 2,
        } as ViewStyle,
        md: {
            shadowColor: colors.light.shadow,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 4,
        } as ViewStyle,
    },
    dark: {
        sm: {
            shadowColor: colors.dark.shadow,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 6,
            elevation: 3,
        } as ViewStyle,
        md: {
            shadowColor: colors.dark.shadow,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 10,
            elevation: 6,
        } as ViewStyle,
    },
};

export const layout = {
    screenPadding: spacing.lg,
};
