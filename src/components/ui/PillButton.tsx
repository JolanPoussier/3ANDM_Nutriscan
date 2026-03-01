import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";

type Props = {
  label: string;
  onPress: () => void;
  textColor?: string;
  backgroundColor?: string;
  fontSize?: number;
};

export default function PillButton({
  label,
  onPress,
  textColor = "#fff",
  backgroundColor = "rgba(255,255,255,0.10)",
  fontSize = 12,
}: Props) {
  return (
    <Pressable onPress={onPress} style={[styles.button, { backgroundColor }]}>
      <Text style={[styles.label, { color: textColor, fontSize }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999 },
  label: { fontWeight: "900" },
});
