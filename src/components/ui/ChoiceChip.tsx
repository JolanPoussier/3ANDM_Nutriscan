import React from "react";
import { Pressable, StyleProp, StyleSheet, Text, TextStyle, ViewStyle } from "react-native";

import { useAppTheme } from "../../context/ThemeContext";

type Props = {
  label: string;
  active: boolean;
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

export default function ChoiceChip({ label, active, onPress, disabled, style, textStyle }: Props) {
  const { theme } = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.base,
        {
          borderRadius: theme.borderRadius.pill,
          borderWidth: 1,
          borderColor: active ? "transparent" : theme.border,
          backgroundColor: active ? theme.primary : theme.neutralSoft,
        },
        style,
        (pressed || disabled) ? styles.pressed : null,
      ]}
    >
      <Text
        style={[
          styles.label,
          {
            color: active ? theme.textInverse : theme.text,
            fontWeight: theme.fontWeights.heavy,
            fontSize: theme.fontSizes.xs,
          },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  label: {},
  pressed: {
    opacity: 0.82,
  },
});
