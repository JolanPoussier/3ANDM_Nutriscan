import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "../../context/ThemeContext";
import type { WeeklyScorePoint } from "../../utils/historyMetrics";
import { nutriColor } from "../../utils/nutriColor";
import { nutriScoreToGrade } from "../../utils/nutriScore";
import NutriScoreBadge from "../ui/NutriScoreBadge";

type Props = {
  averageScore: number | null;
  globalGrade: string | null;
  scannedCount: number;
  bestGrade: string | null;
  worstGrade: string | null;
  weeklyScores: WeeklyScorePoint[];
};

export default function HistoryDashboard({
  averageScore,
  globalGrade,
  scannedCount,
  bestGrade,
  worstGrade,
  weeklyScores,
}: Props) {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const chartMax = useMemo(() => Math.max(5, ...weeklyScores.map((point) => point.average)), [weeklyScores]);

  return (
    <View style={styles.dashboardCard}>
      <Text style={styles.dashboardTitle}>Score nutritionnel personnel</Text>
      <View style={styles.globalScoreRow}>
        <Text style={styles.globalLabel}>Nutri-Score global</Text>
        <NutriScoreBadge grade={globalGrade ?? undefined} shape="circle" size={36} textSize={18} />
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
          <Text style={styles.dashboardMuted}>Pas assez de données pour tracer l'évolution.</Text>
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
                        backgroundColor: nutriColor(theme, nutriScoreToGrade(point.average) ?? undefined),
                      },
                    ]}
                  />
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
  );
}

function createStyles(theme: ReturnType<typeof useAppTheme>["theme"]) {
  return StyleSheet.create({
    dashboardMuted: { color: theme.textMuted, fontSize: theme.fontSizes.xs },
    dashboardCard: {
      backgroundColor: theme.card,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.md - 2,
      borderWidth: 1,
      borderColor: theme.borderSoft,
      gap: theme.spacing.sm + 2,
    },
    dashboardTitle: { color: theme.text, fontSize: theme.fontSizes.lgMinus, fontWeight: theme.fontWeights.heavy },
    globalScoreRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    globalLabel: { color: theme.text, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.bold },
    statsRow: { flexDirection: "row", gap: theme.spacing.sm },
    statCard: {
      flex: 1,
      backgroundColor: theme.cardSoft,
      borderRadius: theme.borderRadius.sm + 2,
      borderWidth: 1,
      borderColor: theme.borderSoft,
      padding: theme.spacing.sm,
      gap: theme.spacing.xs,
    },
    statLabel: { color: theme.textMuted, fontSize: theme.fontSizes.xs, fontWeight: theme.fontWeights.semiBold },
    statValue: { color: theme.text, fontSize: theme.fontSizes.lg, fontWeight: theme.fontWeights.heavy },
    chartWrap: {
      marginTop: theme.spacing.xs,
      backgroundColor: theme.cardSoft,
      borderRadius: theme.borderRadius.sm + 2,
      borderWidth: 1,
      borderColor: theme.borderSoft,
      padding: theme.spacing.sm + 2,
      gap: theme.spacing.sm,
    },
    chartTitle: { color: theme.text, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.extraBold },
    chartBarsRow: { flexDirection: "row", alignItems: "flex-end", height: 96, gap: 6 },
    barColumn: {
      flex: 1,
      height: "100%",
      justifyContent: "flex-end",
      backgroundColor: theme.neutralSoft,
      borderRadius: 6,
      overflow: "hidden",
    },
    bar: { width: "100%", borderRadius: 6 },
    chartLabelsRow: { flexDirection: "row", justifyContent: "space-between", gap: 6 },
    chartLabel: { flex: 1, color: theme.textMuted, fontSize: theme.fontSizes.xxs, textAlign: "center" },
  });
}
