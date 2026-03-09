import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getPreferences, updatePreferences } from "../utils/preferencesStorage";
import type { Language } from "../types/preferences";
import { getSystemLocale, translations, type Locale } from "../i18n/translations";

type TranslateParams = Record<string, string | number>;

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Language) => Promise<void>;
  t: (key: string, params?: TranslateParams) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function interpolate(template: string, params?: TranslateParams): string {
  if (!params) return template;

  return Object.entries(params).reduce((result, [key, value]) => {
    return result.replaceAll(`{{${key}}}`, String(value));
  }, template);
}

function lookup(locale: Locale, key: string): string {
  const path = key.split(".");
  let cursor: unknown = translations[locale];

  for (const segment of path) {
    if (cursor && typeof cursor === "object" && segment in (cursor as Record<string, unknown>)) {
      cursor = (cursor as Record<string, unknown>)[segment];
      continue;
    }
    cursor = undefined;
    break;
  }

  if (typeof cursor === "string") return cursor;

  if (locale !== "fr") return lookup("fr", key);
  return key;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getSystemLocale());

  useEffect(() => {
    let active = true;

    getPreferences()
      .then((prefs) => {
        if (!active) return;
        const next = prefs.language === "fr" || prefs.language === "en" ? prefs.language : getSystemLocale();
        setLocaleState(next);
      })
      .catch(() => {
        if (!active) return;
        setLocaleState(getSystemLocale());
      });

    return () => {
      active = false;
    };
  }, []);

  const setLocale = useCallback(async (nextLocale: Language) => {
    setLocaleState(nextLocale);
    await updatePreferences((prev) => ({ ...prev, language: nextLocale }));
  }, []);

  const t = useCallback((key: string, params?: TranslateParams) => {
    return interpolate(lookup(locale, key), params);
  }, [locale]);

  const value = useMemo<I18nContextValue>(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
