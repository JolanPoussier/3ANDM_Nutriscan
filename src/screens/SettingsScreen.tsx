import React, { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useAppTheme } from "../context/ThemeContext";
import { ALLERGENS, DEFAULT_PREFERENCES, DIETS, type AllergenKey, type Diet, type Preferences } from "../types/preferences";
import { getPreferences, setPreferences } from "../utils/preferencesStorage";

export default function SettingsScreen() {
  const { mode, setMode } = useAppTheme();
  const isDark = mode === "dark";

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

  const cardBg = isDark ? "rgba(255,255,255,0.08)" : "#ffffff";
  const cardBorder = isDark ? "rgba(255,255,255,0.12)" : "rgba(16,17,20,0.1)";
  const titleColor = isDark ? "#ffffff" : "#101114";
  const subColor = isDark ? "rgba(255,255,255,0.7)" : "rgba(16,17,20,0.65)";

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

  const dietLabel = useMemo(() => DIETS.find((d) => d.key === prefs.diet)?.label ?? "Aucun", [prefs.diet]);

  return (
    <ScrollView style={[styles.page, { backgroundColor: isDark ? "#0b0b0c" : "#f7f7f8" }]} contentContainerStyle={{ paddingBottom: 24 }}>
      <Text style={[styles.title, { color: titleColor }]}>Paramètres utilisateurs</Text>

      <View style={[styles.row, { backgroundColor: cardBg, borderColor: cardBorder }]}>
        <View style={styles.texts}>
          <Text style={[styles.label, { color: titleColor }]}>Dark mode</Text>
          <Text style={[styles.help, { color: subColor }]}>Active le thème sombre de l’application</Text>
        </View>

        <Switch
          value={isDark}
          onValueChange={(value) => setMode(value ? "dark" : "light")}
          trackColor={{ false: "#bfc4cf", true: "#4f46e5" }}
          thumbColor="#ffffff"
        />
      </View>

      <View style={[styles.block, { backgroundColor: cardBg, borderColor: cardBorder }]}>
        <Text style={[styles.blockTitle, { color: titleColor }]}>Préférences alimentaires</Text>
        <Text style={[styles.help, { color: subColor }]}>
          Ces préférences sont utilisées pour afficher une alerte sur la fiche produit.
        </Text>

        <View style={{ marginTop: 12 }}>
          <Text style={[styles.sectionTitle, { color: titleColor }]}>Régime</Text>
          <Text style={[styles.help, { color: subColor }]}>Actuel : {dietLabel}</Text>

          <View style={styles.chips}>
            {DIETS.map((d) => {
              const active = prefs.diet === d.key;
              return (
                <Pressable
                  key={d.key}
                  onPress={() => changeDiet(d.key)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: active ? (isDark ? "#ffffff" : "#101114") : (isDark ? "rgba(255,255,255,0.08)" : "rgba(16,17,20,0.06)"),
                      borderColor: active ? "transparent" : cardBorder,
                    },
                  ]}
                  disabled={!prefsLoaded}
                >
                  <Text style={{ color: active ? (isDark ? "#000" : "#fff") : titleColor, fontWeight: "900", fontSize: 12 }}>
                    {d.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>


        <View style={{ marginTop: 14 }}>
          <Text style={[styles.sectionTitle, { color: titleColor }]}>Allergènes à éviter</Text>
          <Text style={[styles.help, { color: subColor }]}>Sélectionne ceux que tu veux éviter.</Text>

          <View style={{ marginTop: 6 }}>
            {ALLERGENS.map((a) => {
              const checked = prefs.avoidAllergens.includes(a.key);
              return (
                <Pressable
                  key={a.key}
                  onPress={() => toggleAllergen(a.key)}
                  style={styles.checkRow}
                  disabled={!prefsLoaded}
                >
                  <View
                    style={[
                      styles.checkbox,
                      {
                        borderColor: cardBorder,
                        backgroundColor: checked ? (isDark ? "#ffffff" : "#101114") : "transparent",
                      },
                    ]}
                  >
                    {checked ? (
                      <Ionicons name="checkmark" size={16} color={isDark ? "#000" : "#fff"} />
                    ) : null}
                  </View>
                  <Text style={[styles.checkText, { color: titleColor }]}>{a.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, padding: 16, gap: 14 },
  title: { fontSize: 22, fontWeight: "800", marginBottom: 6 },

  row: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
  },
  texts: { flex: 1, gap: 4 },
  label: { fontSize: 16, fontWeight: "700" },
  help: { fontSize: 13 },

  block: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
  },
  blockTitle: { fontSize: 16, fontWeight: "900" },

  sectionTitle: { fontSize: 14, fontWeight: "900" },

  chips: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 10 },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
  },

  checkRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  checkText: { fontSize: 14, fontWeight: "800" },
});