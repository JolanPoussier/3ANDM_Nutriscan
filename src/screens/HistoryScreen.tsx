import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import type { HistoryStackParamList } from "../navigation/types";
import type { HistoryItem } from "../types/history";
import { getHistory, removeFromHistory } from "../utils/historyStorage";

type Props = NativeStackScreenProps<HistoryStackParamList, "Historique">;

function nutriColor(grade?: string) {
  const g = (grade ?? "").toLowerCase();
  if (g === "a") return "#1b9e3e";
  if (g === "b") return "#7cc043";
  if (g === "c") return "#f6c244";
  if (g === "d") return "#f08a2b";
  if (g === "e") return "#d64541";
  return "rgba(255,255,255,0.18)";
}

function formatDate(ts: number) {
  const d = new Date(ts);
  return `${d.toLocaleDateString()} • ${d.toLocaleTimeString().slice(0, 5)}`;
}

export default function HistoryScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<HistoryItem[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getHistory();
      setItems(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const empty = useMemo(() => !loading && items.length === 0, [loading, items.length]);

  const onDelete = useCallback((barcode: string) => {
    Alert.alert("Supprimer", "Retirer ce produit de l'historique ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          const next = await removeFromHistory(barcode);
          setItems(next);
        },
      },
    ]);
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={[styles.muted, { marginTop: 10 }]}>Chargement…</Text>
      </View>
    );
  }

  if (empty) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Historique</Text>
        <Text style={[styles.muted, { textAlign: "center", marginTop: 8 }]}>
          Aucun scan pour l’instant.
          {"\n"}Scanne un produit pour le retrouver ici.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.barcode}
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => navigation.navigate("ProductDetails", { barcode: item.barcode })}
          >
            <View style={styles.row}>
              <View style={styles.thumbWrap}>
                {item.imageUrl ? (
                  <Image source={{ uri: item.imageUrl }} style={styles.thumb} resizeMode="contain" />
                ) : (
                  <View style={[styles.thumb, styles.thumbPlaceholder]}>
                    <Text style={styles.thumbText}>—</Text>
                  </View>
                )}
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.name} numberOfLines={1}>
                  {item.name ?? "Produit inconnu"}
                </Text>
                <Text style={styles.muted} numberOfLines={1}>
                  {(item.brand ?? "Marque inconnue")} • {formatDate(item.scannedAt)}
                </Text>

                <View style={{ marginTop: 8, flexDirection: "row", gap: 8, alignItems: "center" }}>
                  <View style={[styles.badge, { backgroundColor: nutriColor(item.nutriScore) }]}>
                    <Text style={styles.badgeText}>
                      Nutri {item.nutriScore ? item.nutriScore.toUpperCase() : "—"}
                    </Text>
                  </View>
                  <Text style={styles.muted}>barcode: {item.barcode}</Text>
                </View>
              </View>
              <Pressable
                hitSlop={10}
                style={styles.deleteBtn}
                onPress={() => onDelete(item.barcode)}
              >
                <Text style={styles.deleteText}>✕</Text>
              </Pressable>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#0b0b0c" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 18, backgroundColor: "#0b0b0c" },

  title: { color: "#fff", fontSize: 22, fontWeight: "800" },
  muted: { color: "rgba(255,255,255,0.7)", fontSize: 13 },

  card: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  row: { flexDirection: "row", gap: 12, alignItems: "center" },

  thumbWrap: {
    width: 64,
    height: 64,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.05)",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  thumb: { width: "92%", height: "92%" },
  thumbPlaceholder: { alignItems: "center", justifyContent: "center" },
  thumbText: { color: "rgba(255,255,255,0.6)", fontWeight: "800" },

  name: { color: "#fff", fontSize: 15, fontWeight: "800" },

  badge: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999 },
  badgeText: { color: "#fff", fontWeight: "900", fontSize: 12 },

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