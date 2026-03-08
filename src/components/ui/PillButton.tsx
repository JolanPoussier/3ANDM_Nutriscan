import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { useAppTheme } from "../../context/ThemeContext";

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
  textColor,
  backgroundColor,
  fontSize = 12,
}: Props) {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <Pressable onPress={onPress} style={[styles.button, { backgroundColor: backgroundColor ?? theme.badgeSoft }]}>
      <Text style={[styles.label, { color: textColor ?? theme.textInverse, fontSize }]}>{label}</Text>
    </Pressable>
  );
}

function createStyles(theme: ReturnType<typeof useAppTheme>["theme"]) {
  return StyleSheet.create({
    button: {
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md - 2,
      borderRadius: theme.borderRadius.pill,
    },
    label: { fontWeight: theme.fontWeights.heavy },
  });
}
