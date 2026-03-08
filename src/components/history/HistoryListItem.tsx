import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "../../context/ThemeContext";
import type { HistoryItem } from "../../types/history";
import { formatHistoryDate } from "../../utils/historyMetrics";
import NutriScoreBadge from "../ui/NutriScoreBadge";
import PillButton from "../ui/PillButton";
import ProductThumbnail from "../ui/ProductThumbnail";

type Props = {
  item: HistoryItem;
  onPress: () => void;
  onCompare: () => void;
  onDelete: () => void;
};

export default function HistoryListItem({ item, onPress, onCompare, onDelete }: Props) {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <Pressable style={styles.itemCard} onPress={onPress}>
      <View style={styles.itemRow}>
        <ProductThumbnail imageUrl={item.imageUrl} size={64} radius={theme.borderRadius.md} />

        <View style={styles.flexOne}>
          <Text style={styles.itemName} numberOfLines={1}>
            {item.name ?? "Produit inconnu"}
          </Text>
          <Text style={styles.muted} numberOfLines={1}>
            {(item.brand ?? "Marque inconnue")} • {formatHistoryDate(item.scannedAt)}
          </Text>

          <View style={styles.badgesRow}>
            <NutriScoreBadge grade={item.nutriScore} shape="pill" prefix="Nutri" textSize={12} />
            <Text style={styles.muted}>barcode: {item.barcode}</Text>
          </View>

          <PillButton label="Comparer" onPress={onCompare} textColor={theme.text} />
        </View>

        <Pressable hitSlop={10} style={styles.deleteBtn} onPress={onDelete}>
          <Text style={styles.deleteText}>✕</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

function createStyles(theme: ReturnType<typeof useAppTheme>["theme"]) {
  return StyleSheet.create({
    itemCard: {
      backgroundColor: theme.card,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.md - 2,
      borderWidth: 1,
      borderColor: theme.borderSoft,
    },
    itemRow: { flexDirection: "row", gap: theme.spacing.sm + 4, alignItems: "center" },
    flexOne: { flex: 1 },
    itemName: { color: theme.text, fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.extraBold },
    muted: { color: theme.textMuted, fontSize: theme.fontSizes.sm },
    badgesRow: { marginTop: theme.spacing.sm, flexDirection: "row", gap: theme.spacing.sm, alignItems: "center", flexWrap: "wrap" },
    deleteBtn: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: theme.badgeSoft,
      alignItems: "center",
      justifyContent: "center",
    },
    deleteText: { color: theme.text, fontWeight: theme.fontWeights.heavy, fontSize: theme.fontSizes.base },
  });
}
