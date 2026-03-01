import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";

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
  backgroundColor = "rgba(255,255,255,0.06)",
  textColor = "rgba(255,255,255,0.6)",
  resizeMode = "contain",
}: Props) {
  return (
    <View style={[styles.wrap, { width: size, height: size, borderRadius: radius, backgroundColor }]}>
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.image} resizeMode={resizeMode} />
      ) : (
        <Text style={[styles.placeholderText, { color: textColor }]}>{placeholderText}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  image: { width: "92%", height: "92%" },
  placeholderText: { fontWeight: "700", fontSize: 11 },
});
