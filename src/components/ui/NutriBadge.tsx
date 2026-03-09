import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "../../context/ThemeContext";
import { getNutriColor } from "../../utils/nutriColor";
import { normalizeNutriGrade } from "../../utils/nutriScore";

type Props = {
  grade?: string;
  size?: number;
  textSize?: number;
};

export default function NutriBadge({ grade, size = 36, textSize = 12 }: Props) {
  const { theme } = useAppTheme();
  const normalized = normalizeNutriGrade(grade);

  return (
    <View
      style={[
        styles.badge,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: getNutriColor(theme, grade),
        },
      ]}
    >
      <Text style={[styles.text, { fontSize: textSize }]}>{normalized ?? "—"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    color: "white",
    fontWeight: "800",
    textTransform: "uppercase",
  },
});
