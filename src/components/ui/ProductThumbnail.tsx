import React, { useMemo } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { useAppTheme } from "../../context/ThemeContext";

type Props = {
  imageUrl?: string;
  size?: number;
  radius?: number;
  placeholderText?: string;
  backgroundColor?: string;
  textColor?: string;
  resizeMode?: "cover" | "contain" | "stretch" | "repeat" | "center";
};

export default function ProductThumbnail({
  imageUrl,
  size = 56,
  radius = 12,
  placeholderText = "—",
  backgroundColor,
  textColor,
  resizeMode = "contain",
}: Props) {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View
      style={[
        styles.wrap,
        {
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: backgroundColor ?? theme.imagePlaceholder,
        },
      ]}
    >
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.image} resizeMode={resizeMode} />
      ) : (
        <Text style={[styles.placeholderText, { color: textColor ?? theme.imagePlaceholderText }]}>{placeholderText}</Text>
      )}
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useAppTheme>["theme"]) {
  return StyleSheet.create({
    wrap: {
      overflow: "hidden",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.imagePlaceholder,
    },
    image: { width: "92%", height: "92%" },
    placeholderText: {
      fontWeight: theme.fontWeights.bold,
      fontSize: theme.fontSizes.xs,
      color: theme.imagePlaceholderText,
    },
  });
}
