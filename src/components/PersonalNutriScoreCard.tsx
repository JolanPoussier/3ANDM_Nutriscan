import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "../context/ThemeContext";
import type { HistoryItem } from "../types/history";
import { getNutriColor } from "../utils/nutriColor";
import {
  nutriGradeToScore,
  nutriScoreNumberToGrade,
  nutriScoreToGrade,
} from "../utils/nutriScore";

type WeeklyPoint = {
  key: string;
  label: string;
  average: number;
  count: number;
};

type Props = {
  items: HistoryItem[];
};

function getWeekStartTimestamp(timestamp: number) {
  const d = new Date(timestamp);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + diff);
  return d.getTime();
}

export default function PersonalNutriScoreCard({ items }: Props) {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

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

  const weeklyScores = useMemo<WeeklyPoint[]>(() => {
    const weeksToShow = 8;
    const currentWeekStart = getWeekStartTimestamp(Date.now());
    const dayMs = 24 * 60 * 60 * 1000;

    const buckets = new Map<number, { total: number; count: number }>();

    scoredItems.forEach((item) => {
      const weekStart = getWeekStartTimestamp(item.scannedAt);
      const existing = buckets.get(weekStart) ?? { total: 0, count: 0 };
      existing.total += item.score;
      existing.count += 1;
      buckets.set(weekStart, existing);
    });

    const firstWeekStart = currentWeekStart - (weeksToShow - 1) * 7 * dayMs;

    return Array.from({ length: weeksToShow }).map((_, index) => {
      const weekStart = firstWeekStart + index * 7 * dayMs;
      const bucket = buckets.get(weekStart);
      const date = new Date(weekStart);
      return {
        key: String(weekStart),
        label: `${date.getDate()}/${date.getMonth() + 1}`,
        average: bucket ? bucket.total / bucket.count : 0,
        count: bucket?.count ?? 0,
      };
    });
  }, [scoredItems]);

  const chartMax = 5;

  const globalBadgeDynamicStyle = useMemo(
    () => ({ backgroundColor: getNutriColor(theme, globalGrade ?? undefined) }),
    [globalGrade, theme],
  );

  const bestGradeBadgeStyle = useMemo(
    () => ({ backgroundColor: getNutriColor(theme, bestGrade ?? undefined) }),
    [bestGrade, theme],
  );

  const worstGradeBadgeStyle = useMemo(
    () => ({ backgroundColor: getNutriColor(theme, worstGrade ?? undefined) }),
    [worstGrade, theme],
  );

  return (
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
          <View style={styles.statTopRow}>
            <Ionicons name="scan-outline" size={14} color={theme.primary} />
          </View>
          <Text style={styles.statLabel}>Produits scannés</Text>
          <View style={[styles.scorePill, styles.scorePillNeutral]}>
            <Text style={[styles.scorePillText, styles.scorePillTextNeutral]}>
              {scannedCount}
            </Text>
          </View>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statTopRow}>
            <Ionicons
              name="trending-up-outline"
              size={14}
              color={theme.nutriA}
            />
          </View>
          <Text style={styles.statLabel}>Meilleur score</Text>
          <View style={[styles.scorePill, bestGradeBadgeStyle]}>
            <Text style={styles.scorePillText}>{bestGrade ?? "—"}</Text>
          </View>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statTopRow}>
            <Ionicons
              name="trending-down-outline"
              size={14}
              color={theme.nutriE}
            />
          </View>
          <Text style={styles.statLabel}>Moins bon score</Text>
          <View style={[styles.scorePill, worstGradeBadgeStyle]}>
            <Text style={styles.scorePillText}>{worstGrade ?? "—"}</Text>
          </View>
        </View>
      </View>

      <View style={styles.chartWrap}>
        <Text style={styles.chartTitle}>
          Diagramme hebdomadaire (8 dernières semaines)
        </Text>
        {weeklyScores.every((point) => point.count === 0) ? (
          <Text style={styles.dashboardMuted}>
            Pas assez de données pour tracer le diagramme.
          </Text>
        ) : (
          <View>
            <View style={styles.chartMainRow}>
              <View style={styles.chartYAxis}>
                {[5, 4, 3, 2, 1].map((tick) => (
                  <Text key={`tick-${tick}`} style={styles.yAxisLabel}>
                    {tick}
                  </Text>
                ))}
              </View>

              <View style={styles.chartBarsRow}>
                {weeklyScores.map((point) => {
                  const barHeight =
                    point.count > 0
                      ? `${Math.max(10, (point.average / chartMax) * 100)}%`
                      : "6%";

                  return (
                    <View key={point.key} style={styles.barColumn}>
                      <Text style={styles.barValue}>
                        {point.count > 0 ? point.average.toFixed(1) : "–"}
                      </Text>
                      <View style={styles.barTrack}>
                        <View
                          style={[
                            styles.bar,
                            {
                              height: barHeight as `${number}%`,
                              backgroundColor:
                                point.count > 0
                                  ? getNutriColor(
                                      theme,
                                      nutriScoreToGrade(point.average) ??
                                        undefined,
                                    )
                                  : theme.border,
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.chartLabel}>{point.label}</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            <View style={styles.chartLegendRow}>
              <View style={styles.legendItem}>
                <View
                  style={[styles.legendDot, { backgroundColor: theme.primary }]}
                />
                <Text style={styles.legendText}>
                  Moyenne Nutri-Score / semaine
                </Text>
              </View>
              <View style={styles.legendItem}>
                <View
                  style={[styles.legendDot, { backgroundColor: theme.border }]}
                />
                <Text style={styles.legendText}>Aucun scan</Text>
              </View>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useAppTheme>["theme"]) {
  return StyleSheet.create({
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
    dashboardMuted: {
      fontSize: theme.fontSizes.sm,
      color: theme.textMuted,
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
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.sm,
      gap: theme.spacing.xs,
      alignItems: "center",
      justifyContent: "center",
      minHeight: 112,
    },
    statTopRow: {
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      minHeight: 16,
    },
    scorePill: {
      minWidth: 42,
      minHeight: 34,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: theme.borderRadius.pill,
      alignItems: "center",
      justifyContent: "center",
    },
    scorePillNeutral: {
      backgroundColor: theme.badgeSoft,
    },
    scorePillText: {
      color: theme.textInverse,
      fontSize: theme.fontSizes.mdPlus,
      fontWeight: theme.fontWeights.heavy,
      textTransform: "uppercase",
    },
    scorePillTextNeutral: {
      color: theme.text,
    },
    statLabel: {
      color: theme.textMuted,
      fontSize: theme.fontSizes.xs,
      fontWeight: theme.fontWeights.bold,
      textTransform: "uppercase",
      textAlign: "center",
      width: "100%",
      minHeight: 30,
      textAlignVertical: "center",
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
    chartMainRow: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: theme.spacing.sm,
    },
    chartYAxis: {
      height: 130,
      justifyContent: "space-between",
      paddingBottom: 22,
    },
    yAxisLabel: {
      color: theme.textSoft,
      fontSize: theme.fontSizes.xxs,
      fontWeight: theme.fontWeights.bold,
      textAlign: "right",
      width: 14,
    },
    chartBarsRow: {
      flex: 1,
      flexDirection: "row",
      alignItems: "flex-end",
      height: 130,
      gap: theme.spacing.sm,
    },
    barColumn: {
      flex: 1,
      height: "100%",
      justifyContent: "flex-end",
      alignItems: "center",
      gap: 4,
    },
    barValue: {
      color: theme.text,
      fontSize: theme.fontSizes.xxs,
      fontWeight: theme.fontWeights.bold,
      minHeight: 12,
    },
    barTrack: {
      width: "100%",
      height: 92,
      borderRadius: theme.borderRadius.sm,
      justifyContent: "flex-end",
      backgroundColor: theme.neutralSoft,
      overflow: "hidden",
    },
    bar: {
      width: "100%",
      borderRadius: theme.borderRadius.sm,
    },
    chartLabel: {
      color: theme.textMuted,
      fontSize: theme.fontSizes.xxs,
      fontWeight: theme.fontWeights.semiBold,
      textAlign: "center",
    },
    chartLegendRow: {
      marginTop: theme.spacing.sm,
      flexDirection: "row",
      gap: theme.spacing.md,
      flexWrap: "wrap",
    },
    legendItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    legendDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    legendText: {
      color: theme.textMuted,
      fontSize: theme.fontSizes.xs,
      fontWeight: theme.fontWeights.medium,
    },
  });
}
