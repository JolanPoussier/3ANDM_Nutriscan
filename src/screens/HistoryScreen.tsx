import React, { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import HistoryDashboard from "../components/history/HistoryDashboard";
import HistoryListItem from "../components/history/HistoryListItem";
import { useAppTheme } from "../context/ThemeContext";
import type { HistoryStackParamList } from "../navigation/types";
import type { HistoryItem } from "../types/history";
import { computeHistoryMetrics } from "../utils/historyMetrics";
import { getHistory, removeFromHistory } from "../utils/historyStorage";

type Props = NativeStackScreenProps<HistoryStackParamList, "Historique">;

export default function HistoryScreen({ navigation }: Props) {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

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
    }, [load]),
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
        <ActivityIndicator color={theme.primary} />
        <Text style={styles.centerMuted}>Chargement…</Text>
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.barcode}
        contentContainerStyle={styles.listContent}
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
        ListHeaderComponentStyle={styles.listHeader}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.title}>Historique</Text>
            <Text style={styles.emptyText}>
              Aucun scan pour l’instant.
              {"\n"}
              Scanne un produit pour alimenter ton score.
            </Text>
          </View>
        }
        ItemSeparatorComponent={ItemSeparator}
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

function ItemSeparator() {
  return <View style={separatorStyles.separator} />;
}

const separatorStyles = StyleSheet.create({
  separator: { height: 10 },
});

function createStyles(theme: ReturnType<typeof useAppTheme>["theme"]) {
  return StyleSheet.create({
    page: { flex: 1, backgroundColor: theme.background },
    center: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: theme.spacing.lg + 2,
      backgroundColor: theme.background,
      gap: theme.spacing.sm,
    },
    centerMuted: { color: theme.textMuted, fontSize: theme.fontSizes.sm },

    listContent: { padding: theme.layout.screenPadding, paddingBottom: theme.spacing.xl },
    listHeader: { marginBottom: theme.spacing.sm + 4 },

    emptyState: { alignItems: "center", justifyContent: "center", paddingVertical: theme.spacing.xl - 4 },
    title: { color: theme.text, fontSize: theme.fontSizes.xl, fontWeight: theme.fontWeights.extraBold },
    emptyText: { color: theme.textMuted, fontSize: theme.fontSizes.sm, textAlign: "center", marginTop: theme.spacing.sm },
  });
}
