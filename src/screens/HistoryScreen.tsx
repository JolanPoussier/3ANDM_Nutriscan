import React, { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import HistoryDashboard from "../components/history/HistoryDashboard";
import HistoryListItem from "../components/history/HistoryListItem";
import type { HistoryStackParamList } from "../navigation/types";
import type { HistoryItem } from "../types/history";
import { getHistory, removeFromHistory } from "../utils/historyStorage";
import { computeHistoryMetrics } from "../utils/historyMetrics";

type Props = NativeStackScreenProps<HistoryStackParamList, "Historique">;

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

  const metrics = useMemo(() => computeHistoryMetrics(items), [items]);

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

  return (
    <View style={styles.page}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.barcode}
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        ListHeaderComponent={
          <HistoryDashboard
            averageScore={metrics.averageScore}
            globalGrade={metrics.globalGrade}
            scannedCount={metrics.scannedCount}
            bestGrade={metrics.bestGrade}
            worstGrade={metrics.worstGrade}
            weeklyScores={metrics.weeklyScores}
          />
        }
        ListHeaderComponentStyle={{ marginBottom: 12 }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.title}>Historique</Text>
            <Text style={[styles.muted, { textAlign: "center", marginTop: 8 }]}>
              Aucun scan pour l’instant.
              {"\n"}Scanne un produit pour alimenter ton score.
            </Text>
          </View>
        }
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={({ item }) => (
          <HistoryListItem
            item={item}
            onPress={() => navigation.navigate("ProductDetails", { barcode: item.barcode })}
            onCompare={() => navigation.navigate("CompareHub", { leftBarcode: item.barcode })}
            onDelete={() => onDelete(item.barcode)}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#0b0b0c" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 18, backgroundColor: "#0b0b0c" },
  emptyState: { alignItems: "center", justifyContent: "center", paddingVertical: 20 },
  title: { color: "#fff", fontSize: 22, fontWeight: "800" },
  muted: { color: "rgba(255,255,255,0.7)", fontSize: 13 },
});
