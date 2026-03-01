import React from "react";
import { StyleSheet, Text, View } from "react-native";

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
  const normalized = grade ? grade.toUpperCase() : "—";
  const label = prefix ? `${prefix} ${normalized}` : normalized;

  if (shape === "pill") {
    return (
      <View style={[styles.pill, { backgroundColor: nutriColor(grade) }]}>
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
          backgroundColor: nutriColor(grade),
        },
      ]}
    >
      <Text style={[styles.text, { fontSize: textSize }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { alignItems: "center", justifyContent: "center" },
  pill: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999 },
  text: { color: "#fff", fontWeight: "900" },
});
