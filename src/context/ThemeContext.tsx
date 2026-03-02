import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useColorScheme } from "react-native";
import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
  Theme as NavigationTheme,
} from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type AppThemeMode = "light" | "dark";

import { colors, spacing, fontSizes, fontWeights, borderRadius, shadows, layout } from "../theme/theme";

type ThemeType = typeof colors.light & {
  spacing: typeof spacing;
  fontSizes: typeof fontSizes;
  fontWeights: typeof fontWeights;
  borderRadius: typeof borderRadius;
  shadows: typeof shadows.light;
  layout: typeof layout;
};

type AppTheme = {
  mode: AppThemeMode;
  isDark: boolean;
  setMode: (mode: AppThemeMode) => void;
  toggleMode: () => void;
  navigationTheme: NavigationTheme;
  theme: ThemeType;
};

const ThemeContext = createContext<AppTheme | null>(null);
const THEME_STORAGE_KEY = "nutriscan_theme_mode";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemMode = useColorScheme() === "dark" ? "dark" : "light";
  const [mode, setMode] = useState<AppThemeMode>(systemMode);
  const hydrated = useRef(false);

  useEffect(() => {
    let active = true;

    async function loadSavedTheme() {
      try {
        const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (!active) return;
        if (saved === "dark" || saved === "light") {
          setMode(saved);
        }
      } catch {
        // ignore storage read errors and keep current mode
      } finally {
        hydrated.current = true;
      }
    }

    loadSavedTheme();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    AsyncStorage.setItem(THEME_STORAGE_KEY, mode).catch(() => {
      // ignore storage write errors
    });
  }, [mode]);

  const value = useMemo<AppTheme>(() => {
    const isDark = mode === "dark";
    const navigationTheme = isDark ? NavigationDarkTheme : NavigationDefaultTheme;

    const currentTheme: ThemeType = {
      ...colors[mode],
      spacing,
      fontSizes,
      fontWeights,
      borderRadius,
      shadows: shadows[mode],
      layout,
    };

    return {
      mode,
      isDark,
      setMode,
      toggleMode: () => setMode((prev) => (prev === "dark" ? "light" : "dark")),
      navigationTheme,
      theme: currentTheme,
    };
  }, [mode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useAppTheme must be used within ThemeProvider");
  }
  return ctx;
}
