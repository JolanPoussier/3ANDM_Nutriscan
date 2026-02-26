import React from "react";
import { StyleSheet, Switch, Text, View } from "react-native";
import { useAppTheme } from "../context/ThemeContext";

export default function SettingsScreen() {
  const { mode, setMode } = useAppTheme();
  const isDark = mode === "dark";

  return (
    <View
      style={[styles.page, { backgroundColor: isDark ? "#0b0b0c" : "#f7f7f8" }]}
    >
      <Text style={[styles.title, { color: isDark ? "#ffffff" : "#101114" }]}>
        Paramètres utilisateurs
      </Text>

      <View
        style={[
          styles.row,
          {
            backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "#ffffff",
            borderColor: isDark
              ? "rgba(255,255,255,0.12)"
              : "rgba(16,17,20,0.1)",
          },
        ]}
      >
        <View style={styles.texts}>
          <Text
            style={[styles.label, { color: isDark ? "#ffffff" : "#101114" }]}
          >
            Dark mode
          </Text>
          <Text
            style={[
              styles.help,
              {
                color: isDark ? "rgba(255,255,255,0.7)" : "rgba(16,17,20,0.65)",
              },
            ]}
          >
            Active le thème sombre de l’application
          </Text>
        </View>

        <Switch
          value={isDark}
          onValueChange={(value) => setMode(value ? "dark" : "light")}
          trackColor={{ false: "#bfc4cf", true: "#4f46e5" }}
          thumbColor="#ffffff"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, padding: 16, gap: 14 },
  title: { fontSize: 22, fontWeight: "800" },
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
});
