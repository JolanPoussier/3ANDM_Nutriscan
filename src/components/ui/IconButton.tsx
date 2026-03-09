import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Insets, Pressable, StyleProp, StyleSheet, ViewStyle } from "react-native";

type Props = {
  iconName: React.ComponentProps<typeof Ionicons>["name"];
  size: number;
  color: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  hitSlop?: Insets | number;
  accessibilityLabel?: string;
};

export default function IconButton({
  iconName,
  size,
  color,
  onPress,
  style,
  hitSlop,
  accessibilityLabel,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={hitSlop}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [styles.base, style, pressed ? styles.pressed : null]}
    >
      <Ionicons name={iconName} size={size} color={color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.82,
  },
});
