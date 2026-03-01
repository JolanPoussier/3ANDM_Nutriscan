import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

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
  return (
    <Pressable style={styles.itemCard} onPress={onPress}>
      <View style={styles.itemRow}>
        <ProductThumbnail imageUrl={item.imageUrl} size={64} radius={14} />

        <View style={{ flex: 1 }}>
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

          <PillButton label="Comparer" onPress={onCompare} />
        </View>

        <Pressable hitSlop={10} style={styles.deleteBtn} onPress={onDelete}>
          <Text style={styles.deleteText}>✕</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  itemCard: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  itemRow: { flexDirection: "row", gap: 12, alignItems: "center" },
  itemName: { color: "#fff", fontSize: 15, fontWeight: "800" },
  muted: { color: "rgba(255,255,255,0.7)", fontSize: 13 },
  badgesRow: { marginTop: 8, flexDirection: "row", gap: 8, alignItems: "center", flexWrap: "wrap" },
  deleteBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  deleteText: { color: "rgba(255,255,255,0.85)", fontWeight: "900", fontSize: 14 },
});
