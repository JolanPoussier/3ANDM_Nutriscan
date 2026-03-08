import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "../../context/ThemeContext";
import { nutriColor } from "../../utils/nutriColor";

type Props = {
  grade?: string;
  shape?: "circle" | "pill";
  size?: number;
  prefix?: string;
  textSize?: number;
};

export default function NutriScoreBadge({
  grade,
  shape = "circle",
  size = 34,
  prefix,
  textSize = 13,
}: Props) {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const normalized = grade ? grade.toUpperCase() : "—";
  const label = prefix ? `${prefix} ${normalized}` : normalized;

  if (shape === "pill") {
    return (
      <View style={[styles.pill, { backgroundColor: nutriColor(theme, grade) }]}>
        <Text style={[styles.text, { fontSize: textSize }]}>{label}</Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: nutriColor(theme, grade),
        },
      ]}
    >
      <Text style={[styles.text, { fontSize: textSize }]}>{label}</Text>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useAppTheme>["theme"]) {
  return StyleSheet.create({
    circle: { alignItems: "center", justifyContent: "center" },
    pill: {
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md - 2,
      borderRadius: theme.borderRadius.pill,
    },
    text: { color: theme.textInverse, fontWeight: theme.fontWeights.heavy },
  });
}
