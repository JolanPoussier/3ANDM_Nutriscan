import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";

import ChoiceChip from "../components/ui/ChoiceChip";
import { useI18n } from "../context/I18nContext";
import { useAppTheme } from "../context/ThemeContext";
import {
  ALLERGENS,
  DEFAULT_PREFERENCES,
  DIETS,
  type AllergenKey,
  type Diet,
  type Preferences,
} from "../types/preferences";
import { getPreferences, setPreferences } from "../utils/preferencesStorage";

export default function SettingsScreen() {
  const { mode, setMode, theme } = useAppTheme();
  const { locale, setLocale, t } = useI18n();
  const isDark = mode === "dark";
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [prefs, setPrefs] = useState<Preferences>(DEFAULT_PREFERENCES);
  const [prefsLoaded, setPrefsLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const p = await getPreferences();
        setPrefs(p);
      } finally {
        setPrefsLoaded(true);
      }
    })();
  }, []);

  async function toggleAllergen(key: AllergenKey) {
    const next: Preferences = {
      ...prefs,
      avoidAllergens: prefs.avoidAllergens.includes(key)
        ? prefs.avoidAllergens.filter((a) => a !== key)
        : [...prefs.avoidAllergens, key],
    };
    setPrefs(next);
    await setPreferences(next);
  }

  async function changeDiet(diet: Diet) {
    const next: Preferences = { ...prefs, diet };
    setPrefs(next);
    await setPreferences(next);
  }

  async function changeLanguage(language: "fr" | "en") {
    const next: Preferences = { ...prefs, language };
    setPrefs(next);
    await setPreferences(next);
    await setLocale(language);
  }

  const dietLabel = useMemo(
    () => t(`preferences.diets.${prefs.diet}`),
    [prefs.diet, t],
  );

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{t("preferences.title")}</Text>

      <View style={[styles.block, theme.shadows.sm]}>
        <Text style={styles.blockTitle}>{t("preferences.language.title")}</Text>
        <Text style={styles.help}>{t("preferences.language.description")}</Text>

        <View style={styles.chips}>
          {(["fr", "en"] as const).map((lang) => {
            const active = locale === lang;
            return (
              <ChoiceChip
                key={lang}
                label={t(`preferences.language.${lang}`)}
                active={active}
                onPress={() => changeLanguage(lang)}
                disabled={!prefsLoaded}
              />
            );
          })}
        </View>
      </View>

      <View style={[styles.row, theme.shadows.sm]}>
        <View style={styles.texts}>
          <Text style={styles.label}>{t("preferences.theme.darkMode")}</Text>
          <Text style={styles.help}>{t("preferences.theme.description")}</Text>
        </View>

        <Switch
          value={isDark}
          onValueChange={(value) => setMode(value ? "dark" : "light")}
          trackColor={{ false: theme.badgeSoft, true: theme.primary }}
          thumbColor={theme.textInverse}
        />
      </View>

      <View style={[styles.block, theme.shadows.sm]}>
        <Text style={styles.blockTitle}>{t("preferences.food.title")}</Text>
        <Text style={styles.help}>{t("preferences.food.description")}</Text>

        <View style={styles.sectionSpacingTop}>
          <Text style={styles.sectionTitle}>{t("preferences.food.dietTitle")}</Text>
          <Text style={styles.help}>{t("preferences.food.currentDiet", { diet: dietLabel })}</Text>

          <View style={styles.chips}>
            {DIETS.map((d) => {
              const active = prefs.diet === d.key;
              return (
                <ChoiceChip
                  key={d.key}
                  label={t(`preferences.diets.${d.key}`)}
                  active={active}
                  onPress={() => changeDiet(d.key)}
                  disabled={!prefsLoaded}
                />
              );
            })}
          </View>
        </View>

        <View style={styles.sectionSpacingLargeTop}>
          <Text style={styles.sectionTitle}>{t("preferences.food.allergensTitle")}</Text>
          <Text style={styles.help}>{t("preferences.food.allergensDescription")}</Text>

          <View style={styles.allergensList}>
            {ALLERGENS.map((a) => {
              const checked = prefs.avoidAllergens.includes(a.key);
              return (
                <Pressable
                  key={a.key}
                  onPress={() => toggleAllergen(a.key)}
                  style={styles.checkRow}
                  disabled={!prefsLoaded}
                >
                  <View style={[styles.checkbox, checked ? styles.checkboxActive : styles.checkboxInactive]}>
                    {checked ? (
                      <Ionicons
                        name="checkmark"
                        size={16}
                        color={theme.textInverse}
                      />
                    ) : null}
                  </View>
                  <Text style={styles.checkText}>{t(`preferences.allergens.${a.key}`)}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

function createStyles(theme: ReturnType<typeof useAppTheme>["theme"]) {
  return StyleSheet.create({
    page: {
      flex: 1,
      backgroundColor: theme.background,
    },
    content: {
      padding: theme.layout.screenPadding,
      paddingBottom: theme.spacing.xl,
      gap: theme.spacing.md,
    },
    title: {
      color: theme.text,
      fontSize: theme.fontSizes.xxl,
      fontWeight: theme.fontWeights.heavy,
      letterSpacing: -0.5,
      marginBottom: 6,
    },

    row: {
      backgroundColor: theme.card,
      borderColor: theme.border,
      borderRadius: theme.borderRadius.lg,
      borderWidth: 1,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: 18,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: theme.spacing.md,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 10,
      elevation: 2,
    },
    texts: { flex: 1, gap: 4 },
    label: {
      color: theme.text,
      fontSize: theme.fontSizes.mdPlus,
      fontWeight: theme.fontWeights.bold,
    },
    help: {
      color: theme.textMuted,
      fontSize: theme.fontSizes.sm,
    },

    block: {
      backgroundColor: theme.card,
      borderColor: theme.border,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      paddingHorizontal: 14,
      paddingVertical: 12,
      gap: theme.spacing.sm,
    },
    blockTitle: {
      color: theme.text,
      fontSize: theme.fontSizes.mdPlus,
      fontWeight: theme.fontWeights.heavy,
    },

    sectionTitle: {
      color: theme.text,
      fontSize: theme.fontSizes.base,
      fontWeight: theme.fontWeights.heavy,
    },
    sectionSpacingTop: { marginTop: 12 },
    sectionSpacingLargeTop: { marginTop: 14 },

    chips: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
      marginTop: 10,
    },

    allergensList: { marginTop: 6 },
    checkRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 10,
    },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: 7,
      borderWidth: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    checkboxActive: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    checkboxInactive: {
      backgroundColor: "transparent",
      borderColor: theme.border,
    },
    checkText: {
      color: theme.text,
      fontSize: theme.fontSizes.base,
      fontWeight: theme.fontWeights.bold,
    },
  });
}
