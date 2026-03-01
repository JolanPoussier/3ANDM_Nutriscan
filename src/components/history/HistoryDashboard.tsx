import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

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
                        backgroundColor: nutriColor(nutriScoreToGrade(point.average) ?? undefined),
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

const styles = StyleSheet.create({
  dashboardMuted: { color: "rgba(255,255,255,0.7)", fontSize: 12 },
  dashboardCard: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    gap: 10,
  },
  dashboardTitle: { color: "#fff", fontSize: 17, fontWeight: "900" },
  globalScoreRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  globalLabel: { color: "rgba(255,255,255,0.85)", fontSize: 13, fontWeight: "700" },
  statsRow: { flexDirection: "row", gap: 8 },
  statCard: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    padding: 8,
    gap: 4,
  },
  statLabel: { color: "rgba(255,255,255,0.65)", fontSize: 11, fontWeight: "600" },
  statValue: { color: "#fff", fontSize: 18, fontWeight: "900" },
  chartWrap: {
    marginTop: 4,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    padding: 10,
    gap: 8,
  },
  chartTitle: { color: "rgba(255,255,255,0.85)", fontSize: 13, fontWeight: "800" },
  chartBarsRow: { flexDirection: "row", alignItems: "flex-end", height: 96, gap: 6 },
  barColumn: {
    flex: 1,
    height: "100%",
    justifyContent: "flex-end",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 6,
    overflow: "hidden",
  },
  bar: { width: "100%", borderRadius: 6 },
  chartLabelsRow: { flexDirection: "row", justifyContent: "space-between", gap: 6 },
  chartLabel: { flex: 1, color: "rgba(255,255,255,0.6)", fontSize: 10, textAlign: "center" },
});
