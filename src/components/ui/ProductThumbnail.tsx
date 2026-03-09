import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "../../context/ThemeContext";

type Props = {
  imageUrl?: string;
  size?: number;
  borderRadius?: number;
  iconSize?: number;
  placeholderMode?: "icon" | "dash";
  placeholderText?: string;
};

export default function ProductThumbnail({
  imageUrl,
  size = 64,
  borderRadius = 12,
  iconSize = 28,
  placeholderMode = "icon",
  placeholderText = "—",
}: Props) {
  const { theme } = useAppTheme();

  return (
    <View
      style={[
        styles.wrap,
        {
          width: size,
          height: size,
          borderRadius,
          backgroundColor: theme.imagePlaceholder,
        },
      ]}
    >
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="contain" />
      ) : (
        <View style={styles.placeholder}>
          {placeholderMode === "dash" ? (
            <Text style={[styles.placeholderText, { color: theme.textMuted }]}>{placeholderText}</Text>
          ) : (
            <Ionicons name="fast-food-outline" size={iconSize} color={theme.textMuted} />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: "hidden",
  },
  image: {
    width: "95%",
    height: "95%",
    alignSelf: "center",
  },
  placeholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
