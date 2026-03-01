import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useCallback, useMemo, useState } from "react";
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

import type { HistoryStackParamList } from "../navigation/types";
import type { HistoryItem } from "../types/history";
import { getHistory, removeFromHistory } from "../utils/historyStorage";
import {
  nutriGradeToScore,
  nutriScoreNumberToGrade,
  nutriScoreToGrade,
} from "../utils/nutriScore";

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

//Permets de renvoyer le timestamp du lundi de la semaine en cours
function getWeekStartTimestamp(timestamp: number) {
  const d = new Date(timestamp);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + diff);
  return d.getTime();
}

function formatWeekLabel(timestamp: number) {
  const d = new Date(timestamp);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

type WeeklyScorePoint = {
  key: string;
  label: string;
  average: number;
};

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
    }, [load]),
  );

  const scannedCount = items.length;

  const scoredItems = useMemo(
    () =>
      items
        .map((item) => ({ ...item, score: nutriGradeToScore(item.nutriScore) }))
        .filter((item) => item.score !== null) as Array<
          HistoryItem & { score: number }
        >,
    [items],
  );

  const averageScore = useMemo(() => {
    if (scoredItems.length === 0) return null;
    const sum = scoredItems.reduce((acc, item) => acc + item.score, 0);
    return sum / scoredItems.length;
  }, [scoredItems]);

  const globalGrade = useMemo(
    () => nutriScoreToGrade(averageScore ?? undefined),
    [averageScore],
  );

  const bestGrade = useMemo(() => {
    if (scoredItems.length === 0) return null;
    const maxScore = scoredItems.reduce(
      (max, item) => Math.max(max, item.score),
      1,
    );
    return nutriScoreNumberToGrade(maxScore);
  }, [scoredItems]);

  const worstGrade = useMemo(() => {
    if (scoredItems.length === 0) return null;
    const minScore = scoredItems.reduce(
      (min, item) => Math.min(min, item.score),
      5,
    );
    return nutriScoreNumberToGrade(minScore);
  }, [scoredItems]);

  const weeklyScores = useMemo<WeeklyScorePoint[]>(() => {
    const buckets = new Map<number, { total: number; count: number }>();
    scoredItems.forEach((item) => {
      const weekStart = getWeekStartTimestamp(item.scannedAt);
      const existing = buckets.get(weekStart) ?? { total: 0, count: 0 };
      existing.total += item.score;
      existing.count += 1;
      buckets.set(weekStart, existing);
    });

    return [...buckets.entries()]
      .sort((a, b) => a[0] - b[0])
      .slice(-8)
      .map(([weekStart, value]) => ({
        key: String(weekStart),
        label: formatWeekLabel(weekStart),
        average: value.total / value.count,
      }));
  }, [scoredItems]);

  const chartMax = useMemo(
    () => Math.max(5, ...weeklyScores.map((point) => point.average)),
    [weeklyScores],
  );

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
          <View style={styles.dashboardCard}>
            <Text style={styles.dashboardTitle}>
              Score nutritionnel personnel
            </Text>
            <View style={styles.globalScoreRow}>
              <Text style={styles.globalLabel}>Nutri-Score global</Text>
              <View
                style={[
                  styles.globalBadge,
                  { backgroundColor: nutriColor(globalGrade ?? undefined) },
                ]}
              >
                <Text style={styles.globalBadgeText}>{globalGrade ?? "—"}</Text>
              </View>
            </View>
            <Text style={styles.dashboardMuted}>
              {averageScore !== null
                ? `Moyenne: ${averageScore.toFixed(2)} / 5`
                : "Aucun Nutri-Score exploitable pour calculer la moyenne."}
            </Text>

            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Produits scannés</Text>
                <Text style={styles.statValue}>{scannedCount}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Meilleur score</Text>
                <Text style={styles.statValue}>{bestGrade ?? "—"}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Moins bon score</Text>
                <Text style={styles.statValue}>{worstGrade ?? "—"}</Text>
              </View>
            </View>

            <View style={styles.chartWrap}>
              <Text style={styles.chartTitle}>Evolution hebdomadaire</Text>
              {weeklyScores.length === 0 ? (
                <Text style={styles.dashboardMuted}>
                  Pas assez de données pour tracer l'évolution.
                </Text>
              ) : (
                <View>
                  <View style={styles.chartBarsRow}>
                    {weeklyScores.map((point) => (
                      <View key={point.key} style={styles.barColumn}>
                        <View
                          style={[
                            styles.bar,
                            {
                              height: `${Math.max(8, (point.average / chartMax) * 100)}%`,
                              backgroundColor: nutriColor(
                                nutriScoreToGrade(point.average) ?? undefined,
                              ),
                            },
                          ]}
                        />
                      </View>
                    ))}
                  </View>
                  <View style={styles.chartLabelsRow}>
                    {weeklyScores.map((point) => (
                      <Text
                        key={`${point.key}-label`}
                        style={styles.chartLabel}
                      >
                        {point.label}
                      </Text>
                    ))}
                  </View>
                </View>
              )}
            </View>
          </View>
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
          <Pressable
            style={styles.card}
            onPress={() =>
              navigation.navigate("ProductDetails", { barcode: item.barcode })
            }
          >
            <View style={styles.row}>
              <View style={styles.thumbWrap}>
                {item.imageUrl ? (
                  <Image
                    source={{ uri: item.imageUrl }}
                    style={styles.thumb}
                    resizeMode="contain"
                  />
                ) : (
                  <View style={[styles.thumbWrap, styles.thumbPlaceholder]}>
                    <Text style={styles.thumbText}>—</Text>
                  </View>
                )}
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.name} numberOfLines={1}>
                  {item.name ?? "Produit inconnu"}
                </Text>
                <Text style={styles.muted} numberOfLines={1}>
                  {item.brand ?? "Marque inconnue"} •{" "}
                  {formatDate(item.scannedAt)}
                </Text>

                <View
                  style={{
                    marginTop: 8,
                    flexDirection: "row",
                    gap: 8,
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: nutriColor(item.nutriScore) },
                    ]}
                  >
                    <Text style={styles.badgeText}>
                      Nutri{" "}
                      {item.nutriScore ? item.nutriScore.toUpperCase() : "—"}
                    </Text>
                  </View>
                  <Text style={styles.muted}>barcode: {item.barcode}</Text>
                </View>

                <Pressable
                  style={styles.compareBtn}
                  onPress={() =>
                    navigation.navigate("CompareHub", {
                      leftBarcode: item.barcode,
                    })
                  }
                >
                  <Text style={styles.compareText}>Comparer</Text>
                </Pressable>
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
  page: { flex: 1, backgroundColor: "#0f172a" },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
    backgroundColor: "#0f172a",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },

  title: { color: "#f8fafc", fontSize: 24, fontWeight: "800", letterSpacing: -0.5 },
  muted: { color: "#94a3b8", fontSize: 13 },
  dashboardMuted: { color: "#94a3b8", fontSize: 13 },

  dashboardCard: {
    backgroundColor: "#1e293b",
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: "#334155",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  dashboardTitle: { color: "#f8fafc", fontSize: 18, fontWeight: "800" },
  globalScoreRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  globalLabel: {
    color: "#cbd5e1",
    fontSize: 14,
    fontWeight: "700",
  },
  globalBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  globalBadgeText: { color: "#fff", fontWeight: "900", fontSize: 20 },

  statsRow: { flexDirection: "row", gap: 10 },
  statCard: {
    flex: 1,
    backgroundColor: "#0f172a",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#334155",
    padding: 12,
    gap: 4,
    alignItems: "center",
  },
  statLabel: {
    color: "#64748b",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  statValue: { color: "#f8fafc", fontSize: 20, fontWeight: "900" },

  chartWrap: {
    marginTop: 6,
    backgroundColor: "#0f172a",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#334155",
    padding: 14,
    gap: 10,
  },
  chartTitle: {
    color: "#cbd5e1",
    fontSize: 14,
    fontWeight: "800",
  },
  chartBarsRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 110,
    gap: 8,
  },
  barColumn: {
    flex: 1,
    height: "100%",
    justifyContent: "flex-end",
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 8,
    overflow: "hidden",
  },
  bar: { width: "100%", borderRadius: 8 },
  chartLabelsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    marginTop: 4,
  },
  chartLabel: {
    flex: 1,
    color: "#64748b",
    fontSize: 10,
    fontWeight: "600",
    textAlign: "center",
  },

  card: {
    backgroundColor: "#1e293b",
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: "#334155",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  row: { flexDirection: "row", gap: 14, alignItems: "center" },

  thumbWrap: {
    width: 68,
    height: 68,
    borderRadius: 16,
    backgroundColor: "#0f172a",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  thumb: { width: "94%", height: "94%", borderRadius: 12 },
  thumbPlaceholder: { alignItems: "center", justifyContent: "center" },
  thumbText: { color: "#64748b", fontWeight: "800" },

  name: { color: "#f8fafc", fontSize: 16, fontWeight: "800" },

  badge: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999 },
  badgeText: { color: "#fff", fontWeight: "900", fontSize: 12, letterSpacing: 0.5 },

  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  deleteText: {
    color: "#ef4444",
    fontWeight: "900",
    fontSize: 16,
  },

  compareBtn: {
    marginTop: 12,
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: "#334155",
  },
  compareText: { color: "#f8fafc", fontWeight: "800", fontSize: 12, letterSpacing: 0.5 },
});
