import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import type { HistoryStackParamList } from "../../navigation/types";
import type { OFFProductResponse, OFFProduct } from "../../types/off";
import { OFFFetch } from "../../utils/api";

type Props = NativeStackScreenProps<HistoryStackParamList, "Comparator">;

type MetricKey =
  | "nutriscore"
  | "nova"
  | "calories"
  | "fat"
  | "sugars"
  | "salt"
  | "fiber"
  | "proteins";

type Metric = {
  key: MetricKey;
  label: string;
  unit?: string; 
};

const METRICS: Metric[] = [
  { key: "nutriscore", label: "Nutri-Score" },
  { key: "nova", label: "NOVA" },
  { key: "calories", label: "Calories", unit: "kcal" },
  { key: "fat", label: "Graisses", unit: "g" },
  { key: "sugars", label: "Sucres", unit: "g" },
  { key: "salt", label: "Sel", unit: "g" },
  { key: "fiber", label: "Fibres", unit: "g" },
  { key: "proteins", label: "Protéines", unit: "g" },
];

function nutriToScore(grade?: string) {
  const g = (grade ?? "").toLowerCase();
  if (g === "a") return 5;
  if (g === "b") return 4;
  if (g === "c") return 3;
  if (g === "d") return 2;
  if (g === "e") return 1;
  return 0;
}

function betterIsHigher(key: MetricKey) {
  return key === "fiber" || key === "proteins";
}

function fmtNumber(n?: number) {
  if (n === undefined || n === null || Number.isNaN(n)) return "—";
  // évite 4.0000
  if (Number.isInteger(n)) return String(n);
  return String(Math.round(n * 10) / 10);
}

function fmtWithUnit(n?: number, unit = "g") {
  const x = fmtNumber(n);
  if (x === "—") return "—";
  return `${x} ${unit}`;
}

function tiny(s?: string) {
  return (s ?? "").trim() || "—";
}

function getMetricValue(p: OFFProduct, key: MetricKey): number | null {
  const n = p.nutriments;
  switch (key) {
    case "nutriscore": {
      const score = nutriToScore(p.nutriscore_grade);
      return score ? score : null;
    }
    case "nova":
      return typeof p.nova_group === "number" ? p.nova_group : null;
    case "calories":
      return n?.["energy-kcal_100g"] ?? null;
    case "fat":
      return n?.fat_100g ?? null;
    case "sugars":
      return n?.sugars_100g ?? null;
    case "salt":
      return n?.salt_100g ?? null;
    case "fiber":
      return n?.fiber_100g ?? null;
    case "proteins":
      return n?.proteins_100g ?? null;
    default:
      return null;
  }
}

function computeWinner(left: OFFProduct, right: OFFProduct) {
  let leftPoints = 0;
  let rightPoints = 0;

  for (const m of METRICS) {
    const lv = getMetricValue(left, m.key);
    const rv = getMetricValue(right, m.key);

    if (lv == null || rv == null) continue;

    if (m.key === "nutriscore") {
      if (lv > rv) leftPoints++;
      else if (rv > lv) rightPoints++;
      continue;
    }

    if (m.key === "nova") {
      if (lv < rv) leftPoints++;
      else if (rv < lv) rightPoints++;
      continue;
    }

    const higherBetter = betterIsHigher(m.key);
    if (higherBetter) {
      if (lv > rv) leftPoints++;
      else if (rv > lv) rightPoints++;
    } else {
      if (lv < rv) leftPoints++;
      else if (rv < lv) rightPoints++;
    }
  }

  if (leftPoints > rightPoints) return { winner: "left" as const, leftPoints, rightPoints };
  if (rightPoints > leftPoints) return { winner: "right" as const, leftPoints, rightPoints };
  return { winner: "tie" as const, leftPoints, rightPoints };
}

export default function Comparator({ route }: Props) {
  const { leftBarcode, rightBarcode } = route.params;

  const [loading, setLoading] = useState(true);
  const [left, setLeft] = useState<OFFProduct | null>(null);
  const [right, setRight] = useState<OFFProduct | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const [l, r] = await Promise.all([
          OFFFetch<OFFProductResponse>(`product/${leftBarcode}`),
          OFFFetch<OFFProductResponse>(`product/${rightBarcode}`),
        ]);

        if (cancelled) return;

        if (!l || l.status !== 1 || !l.product) {
          setError("Impossible de charger le produit 1.");
          setLeft(null);
        } else setLeft(l.product);

        if (!r || r.status !== 1 || !r.product) {
          setError("Impossible de charger le produit 2.");
          setRight(null);
        } else setRight(r.product);
      } catch {
        if (!cancelled) setError("Erreur réseau.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [leftBarcode, rightBarcode]);

  const summary = useMemo(() => {
    if (!left || !right) return null;
    return computeWinner(left, right);
  }, [left, right]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={[styles.muted, { marginTop: 10 }]}>Chargement…</Text>
      </View>
    );
  }

  if (error || !left || !right) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Comparateur</Text>
        <Text style={[styles.muted, { textAlign: "center", marginTop: 8 }]}>
          Impossible d’afficher la comparaison.
        </Text>
        <Text style={[styles.muted, { marginTop: 8 }]}>{error ?? ""}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Comparateur</Text>
      <Text style={styles.muted}>Critères : Nutri-Score, NOVA et nutriments (100g)</Text>

      <View style={styles.twoCols}>
        <ProductHeader product={left} sideLabel="Produit 1" />
        <ProductHeader product={right} sideLabel="Produit 2" />
      </View>

      <View style={styles.table}>
        {METRICS.map((m) => {
          const lv = getMetricValue(left, m.key);
          const rv = getMetricValue(right, m.key);

          let leftBetter = false;
          let rightBetter = false;

          if (lv != null && rv != null) {
            if (m.key === "nutriscore") {
              leftBetter = lv > rv;
              rightBetter = rv > lv;
            } else if (m.key === "nova") {
              leftBetter = lv < rv;
              rightBetter = rv < lv;
            } else {
              const higherBetter = betterIsHigher(m.key);
              if (higherBetter) {
                leftBetter = lv > rv;
                rightBetter = rv > lv;
              } else {
                leftBetter = lv < rv;
                rightBetter = rv < lv;
              }
            }
          }

          const leftText =
            m.key === "nutriscore"
              ? (left.nutriscore_grade ? left.nutriscore_grade.toUpperCase() : "—")
              : m.key === "nova"
                ? fmtNumber(lv ?? undefined)
                : m.unit === "kcal"
                  ? fmtWithUnit(lv ?? undefined, "kcal")
                  : fmtWithUnit(lv ?? undefined, "g");

          const rightText =
            m.key === "nutriscore"
              ? (right.nutriscore_grade ? right.nutriscore_grade.toUpperCase() : "—")
              : m.key === "nova"
                ? fmtNumber(rv ?? undefined)
                : m.unit === "kcal"
                  ? fmtWithUnit(rv ?? undefined, "kcal")
                  : fmtWithUnit(rv ?? undefined, "g");

          return (
            <View key={m.key} style={styles.row}>
              <Text style={styles.metric}>{m.label}</Text>

              <View style={styles.values}>
                <View style={[styles.cell, leftBetter && styles.good, rightBetter && styles.bad]}>
                  <Text style={styles.cellText}>{leftText}</Text>
                </View>
                <View style={[styles.cell, rightBetter && styles.good, leftBetter && styles.bad]}>
                  <Text style={styles.cellText}>{rightText}</Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>

      {summary && (
        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>Résumé</Text>
          <Text style={styles.summaryText}>
            {summary.winner === "tie"
              ? `Égalité (${summary.leftPoints}-${summary.rightPoints})`
              : summary.winner === "left"
                ? `Produit 1 gagne (${summary.leftPoints}-${summary.rightPoints})`
                : `Produit 2 gagne (${summary.leftPoints}-${summary.rightPoints})`}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

function ProductHeader({ product, sideLabel }: { product: OFFProduct; sideLabel: string }) {
  const grade = product.nutriscore_grade?.toUpperCase() ?? "—";
  return (
    <View style={styles.headerCard}>
      <Text style={styles.sideLabel}>{sideLabel}</Text>
      <View style={styles.headerRow}>
        <View style={styles.imgWrap}>
          {product.image_url ? (
            <Image source={{ uri: product.image_url }} style={styles.img} resizeMode="contain" />
          ) : (
            <View style={[styles.imgWrap, styles.imgPlaceholder]}>
              <Text style={styles.muted}>—</Text>
            </View>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.pName} numberOfLines={2}>
            {tiny(product.product_name)}
          </Text>
          <Text style={styles.muted} numberOfLines={1}>
            {tiny(product.brands)}
          </Text>
          <View style={styles.pBadges}>
            <View style={styles.badgeSoft}>
              <Text style={styles.badgeText}>Nutri {grade}</Text>
            </View>
            <View style={styles.badgeSoft}>
              <Text style={styles.badgeText}>NOVA {product.nova_group ?? "—"}</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#0b0b0c" },
  content: { padding: 16, paddingBottom: 28, gap: 14 },

  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 18, backgroundColor: "#0b0b0c" },

  title: { color: "#fff", fontSize: 22, fontWeight: "900" },
  muted: { color: "rgba(255,255,255,0.7)", fontSize: 13 },

  twoCols: { flexDirection: "row", gap: 12 },
  headerCard: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  sideLabel: { color: "rgba(255,255,255,0.7)", fontSize: 12, marginBottom: 8 },

  headerRow: { flexDirection: "row", gap: 10, alignItems: "center" },
  imgWrap: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  img: { width: "92%", height: "92%" },
  imgPlaceholder: {},

  pName: { color: "#fff", fontWeight: "900", fontSize: 13 },
  pBadges: { flexDirection: "row", gap: 8, marginTop: 8, flexWrap: "wrap" },

  badgeSoft: { backgroundColor: "rgba(255,255,255,0.10)", paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999 },
  badgeText: { color: "#fff", fontWeight: "900", fontSize: 12 },

  table: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    gap: 10,
  },
  row: { gap: 8 },
  metric: { color: "rgba(255,255,255,0.8)", fontWeight: "800" },

  values: { flexDirection: "row", gap: 10 },
  cell: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.35)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  cellText: { color: "#fff", fontWeight: "900" },

  good: { backgroundColor: "rgba(27,158,62,0.25)", borderColor: "rgba(27,158,62,0.35)" },
  bad: { backgroundColor: "rgba(214,69,65,0.25)", borderColor: "rgba(214,69,65,0.35)" },

  summary: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  summaryTitle: { color: "#fff", fontWeight: "900", marginBottom: 6 },
  summaryText: { color: "rgba(255,255,255,0.85)", fontWeight: "800" },
});
