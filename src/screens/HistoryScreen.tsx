import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
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
import { Ionicons } from "@expo/vector-icons";

import type { HistoryStackParamList } from "../navigation/types";
import type { HistoryItem } from "../types/history";
import { getHistory, removeFromHistory } from "../utils/historyStorage";
import {
  normalizeNutriGrade,
  nutriGradeToScore,
  nutriScoreNumberToGrade,
  nutriScoreToGrade,
} from "../utils/nutriScore";
import { useAppTheme } from "../context/ThemeContext";
import { getNutriColor } from "../utils/nutriColor";
import { OFFFetch } from "../utils/api";
import type { OFFProductResponse } from "../types/off";
import { resolveProductImageUrl } from "../utils/productImage";

type Props = NativeStackScreenProps<HistoryStackParamList, "Historique">;

function formatDate(ts: number) {
  const d = new Date(ts);
  return `${d.toLocaleDateString()} • ${d.toLocaleTimeString().slice(0, 5)}`;
}

// Permets de renvoyer le timestamp du lundi de la semaine en cours
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
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [resolvedImages, setResolvedImages] = useState<Record<string, string>>({});

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

  useEffect(() => {
    const missing = items
      .filter((item) => !item.imageUrl && !resolvedImages[item.barcode])
      .map((item) => item.barcode);
    if (missing.length === 0) return;

    let cancelled = false;

    async function hydrateImages() {
      const entries = await Promise.all(
        missing.map(async (barcode) => {
          try {
            const data = await OFFFetch<OFFProductResponse>(`product/${barcode}`);
            const url = resolveProductImageUrl(data?.product);
            return url ? ([barcode, url] as const) : null;
          } catch {
            return null;
          }
        }),
      );

      if (cancelled) return;
      const next = entries.filter((e): e is readonly [string, string] => Boolean(e));
      if (next.length === 0) return;

      setResolvedImages((prev) => {
        const merged = { ...prev };
        next.forEach(([barcode, url]) => {
          merged[barcode] = url;
        });
        return merged;
      });
    }

    hydrateImages();
    return () => {
      cancelled = true;
    };
  }, [items, resolvedImages]);

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

  const globalBadgeDynamicStyle = useMemo(
    () => ({ backgroundColor: getNutriColor(theme, globalGrade ?? undefined) }),
    [globalGrade, theme],
  );

  const chartBarStyle = useCallback(
    (average: number) => ({
      height: `${Math.max(8, (average / chartMax) * 100)}%` as const,
      backgroundColor: getNutriColor(theme, nutriScoreToGrade(average) ?? undefined),
    }),
    [chartMax, theme],
  );

  const itemBadgeStyle = useCallback(
    (grade?: string | null) => ({
      backgroundColor: getNutriColor(theme, grade ?? undefined),
    }),
    [theme],
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator />
        <Text style={styles.loadingText}>Chargement…</Text>
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.barcode}
        contentContainerStyle={styles.listContentContainer}
        ListHeaderComponent={
          <View style={[styles.dashboardCard, theme.shadows.md]}>
            <Text style={styles.dashboardTitle}>Score nutritionnel personnel</Text>
            <View style={styles.globalScoreRow}>
              <Text style={styles.globalLabel}>Nutri-Score global</Text>
              <View style={[styles.globalBadge, globalBadgeDynamicStyle]}>
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
                        <View style={[styles.bar, chartBarStyle(point.average)]} />
                      </View>
                    ))}
                  </View>
                  <View style={styles.chartLabelsRow}>
                    {weeklyScores.map((point) => (
                      <Text key={`${point.key}-label`} style={styles.chartLabel}>
                        {point.label}
                      </Text>
                    ))}
                  </View>
                </View>
              )}
            </View>
          </View>
        }
        ListHeaderComponentStyle={styles.listHeaderSpacing}
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
        ItemSeparatorComponent={itemSeparator}
        renderItem={({ item }) => {
          const imageUrl = item.imageUrl || resolvedImages[item.barcode];
          return (
            <Pressable
              style={[styles.card, theme.shadows.sm]}
              onPress={() =>
                navigation.navigate("ProductDetails", { barcode: item.barcode })
              }
            >
              <View style={styles.row}>
                <View style={styles.thumbWrap}>
                  {imageUrl ? (
                    <Image
                      source={{ uri: imageUrl }}
                      style={styles.thumb}
                      resizeMode="contain"
                    />
                  ) : (
                    <View style={[styles.thumbWrap, styles.thumbPlaceholder]}>
                      <Ionicons
                        name="fast-food-outline"
                        size={24}
                        color={theme.textMuted}
                      />
                    </View>
                  )}
                </View>

              <View style={styles.flexOne}>
                <Text style={styles.name} numberOfLines={1}>
                  {item.name ?? "Produit inconnu"}
                </Text>
                <Text style={styles.muted} numberOfLines={1}>
                  {item.brand ?? "Marque inconnue"} • {formatDate(item.scannedAt)}
                </Text>

                <View style={styles.badgeRow}>
                  <View style={[styles.badge, itemBadgeStyle(item.nutriScore)]}>
                    <Text style={styles.badgeText}>
                      Nutri {normalizeNutriGrade(item.nutriScore) ?? "—"}
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
          );
        }}
      />
    </View>
  );
}

function itemSeparator() {
  return <View style={separatorStyles.separator} />;
}

const separatorStyles = StyleSheet.create({
  separator: { height: 8 },
});

function createStyles(theme: ReturnType<typeof useAppTheme>["theme"]) {
  return StyleSheet.create({
    page: {
      flex: 1,
      backgroundColor: theme.background,
    },
    listContentContainer: {
      padding: theme.layout.screenPadding,
      paddingBottom: theme.spacing.xl,
    },
    listHeaderSpacing: {
      marginBottom: theme.spacing.md,
    },

    loadingContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 18,
      backgroundColor: theme.background,
    },
    loadingText: {
      fontSize: theme.fontSizes.sm,
      marginTop: theme.spacing.sm,
      color: theme.textMuted,
    },

    emptyState: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 20,
    },
    emptyText: {
      fontSize: theme.fontSizes.sm,
      textAlign: "center",
      marginTop: theme.spacing.sm,
      color: theme.textMuted,
    },

    title: {
      color: theme.text,
      fontSize: theme.fontSizes.xl,
      fontWeight: theme.fontWeights.extraBold,
      letterSpacing: -0.5,
    },
    muted: {
      fontSize: theme.fontSizes.sm,
      color: theme.textMuted,
    },
    dashboardMuted: {
      fontSize: theme.fontSizes.sm,
      color: theme.textMuted,
    },

    dashboardCard: {
      backgroundColor: theme.card,
      borderColor: theme.border,
      borderRadius: theme.borderRadius.xl,
      padding: theme.spacing.lg,
      borderWidth: 1,
      gap: theme.spacing.sm,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 4,
    },
    dashboardTitle: {
      color: theme.text,
      fontSize: theme.fontSizes.lg,
      fontWeight: theme.fontWeights.extraBold,
    },
    globalScoreRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    globalLabel: {
      color: theme.textMuted,
      fontSize: theme.fontSizes.sm,
      fontWeight: theme.fontWeights.bold,
    },
    globalBadge: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
    },
    globalBadgeText: {
      color: theme.textInverse,
      fontWeight: theme.fontWeights.heavy,
      fontSize: theme.fontSizes.xlMinus,
      textTransform: "uppercase",
    },

    statsRow: {
      flexDirection: "row",
      gap: theme.spacing.sm,
    },
    statCard: {
      flex: 1,
      backgroundColor: theme.imagePlaceholder,
      borderColor: theme.border,
      borderRadius: theme.borderRadius.lg,
      borderWidth: 1,
      padding: theme.spacing.md,
      gap: theme.spacing.xs,
      alignItems: "center",
    },
    statLabel: {
      color: theme.textMuted,
      fontSize: theme.fontSizes.xs,
      fontWeight: theme.fontWeights.bold,
      textTransform: "uppercase",
    },
    statValue: {
      color: theme.text,
      fontSize: theme.fontSizes.lg,
      fontWeight: theme.fontWeights.heavy,
    },

    chartWrap: {
      marginTop: theme.spacing.sm,
      backgroundColor: theme.imagePlaceholder,
      borderColor: theme.border,
      borderRadius: theme.borderRadius.lg,
      borderWidth: 1,
      padding: theme.spacing.md,
      gap: theme.spacing.sm,
    },
    chartTitle: {
      color: theme.textMuted,
      fontSize: theme.fontSizes.sm,
      fontWeight: theme.fontWeights.extraBold,
    },
    chartBarsRow: {
      flexDirection: "row",
      alignItems: "flex-end",
      height: 110,
      gap: theme.spacing.sm,
    },
    barColumn: {
      flex: 1,
      height: "100%",
      justifyContent: "flex-end",
      borderRadius: theme.borderRadius.sm,
      overflow: "hidden",
    },
    bar: {
      width: "100%",
      borderRadius: theme.borderRadius.sm,
    },
    chartLabelsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: theme.spacing.sm,
      marginTop: theme.spacing.xs,
    },
    chartLabel: {
      flex: 1,
      color: theme.textMuted,
      fontSize: theme.fontSizes.xxs,
      fontWeight: theme.fontWeights.semiBold,
      textAlign: "center",
    },

    card: {
      backgroundColor: theme.card,
      borderColor: theme.border,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.md,
      borderWidth: 1,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 2,
    },
    row: {
      flexDirection: "row",
      gap: theme.spacing.md,
      alignItems: "center",
    },

    thumbWrap: {
      width: 68,
      height: 68,
      borderRadius: theme.borderRadius.md,
      overflow: "hidden",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.imagePlaceholder,
    },
    thumb: {
      width: "94%",
      height: "94%",
      borderRadius: Math.max(0, theme.borderRadius.md - 2),
    },
    thumbPlaceholder: {
      alignItems: "center",
      justifyContent: "center",
    },

    name: {
      color: theme.text,
      fontSize: theme.fontSizes.lg,
      fontWeight: theme.fontWeights.extraBold,
    },

    badgeRow: {
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
      marginTop: theme.spacing.sm,
      gap: theme.spacing.sm,
    },
    badge: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: theme.borderRadius.pill,
    },
    badgeText: {
      color: theme.textInverse,
      fontWeight: theme.fontWeights.heavy,
      fontSize: theme.fontSizes.xs,
      letterSpacing: 0.5,
    },
    badgeUnknownRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },

    compareBtn: {
      marginTop: theme.spacing.md,
      alignSelf: "flex-start",
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: theme.borderRadius.pill,
      backgroundColor: theme.badgeSoft,
    },
    compareText: {
      color: theme.text,
      fontWeight: theme.fontWeights.extraBold,
      fontSize: theme.fontSizes.xs,
      letterSpacing: 0.5,
    },

    deleteBtn: {
      width: 36,
      height: 36,
      borderRadius: theme.borderRadius.pill,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.errorSoft,
    },
    deleteText: {
      color: theme.error,
      fontWeight: theme.fontWeights.heavy,
      fontSize: theme.fontSizes.mdPlus,
    },

    flexOne: { flex: 1 },
  });
}
