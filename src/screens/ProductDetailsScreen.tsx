import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { OFFFetch } from "../utils/api";
import type { OFFProductResponse, OFFProduct } from "../types/off";
import type { ProductDetailsParams, HistoryStackParamList } from "../navigation/types";

type Props = {
  route: RouteProp<Record<string, ProductDetailsParams>, string>;
  navigation: NativeStackNavigationProp<HistoryStackParamList>;
};

function nutriColor(grade?: string) {
  const g = (grade ?? "").toLowerCase();
  if (g === "a") return "#1b9e3e";
  if (g === "b") return "#7cc043";
  if (g === "c") return "#f6c244";
  if (g === "d") return "#f08a2b";
  if (g === "e") return "#d64541";
  return "rgba(255,255,255,0.18)";
}

function fmt(n?: number, unit = "g") {
  if (n === undefined || n === null || Number.isNaN(n)) return "—";
  return `${n} ${unit}`;
}

export default function ProductDetailsScreen({ route, navigation }: Props) {
  const barcode = route.params?.barcode;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [product, setProduct] = useState<OFFProduct | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!barcode) {
        setError("Code-barres manquant.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await OFFFetch<OFFProductResponse>(`product/${barcode}`);

        if (cancelled) return;

        if (data?.status !== 1 || !data.product) {
          setError("Produit introuvable.");
          setProduct(null);
        } else {
          setProduct(data.product);
        }
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
  }, [barcode]);

  const headerTitle = useMemo(() => product?.product_name ?? "Fiche produit", [product?.product_name]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={[styles.muted, { marginTop: 10 }]}>Chargement du produit…</Text>
      </View>
    );
  }

  if (error || !product) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Oups</Text>
        <Text style={styles.muted}>{error ?? "Impossible de charger le produit."}</Text>
        <Text style={[styles.muted, { marginTop: 8 }]}>barcode : {barcode ?? "—"}</Text>
      </View>
    );
  }

  const grade = product.nutriscore_grade?.toUpperCase();

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{headerTitle}</Text>
      <Text style={styles.muted}>
        {(product.brands ?? "Marque inconnue")} • {(product.quantity ?? "Quantité inconnue")}
      </Text>

      <View style={styles.hero}>
        {product.image_url ? (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: product.image_url }}
              style={styles.image}
              resizeMode="contain"
            />
          </View>
        ) : (
          <View style={[styles.imageContainer, styles.imagePlaceholder]}>
            <Text style={styles.muted}>Pas d’image</Text>
          </View>
        )}

        <View style={styles.badges}>
          <View style={[styles.badge, { backgroundColor: nutriColor(product.nutriscore_grade) }]}>
            <Text style={styles.badgeText}>Nutri-Score {grade ?? "—"}</Text>
          </View>

          <View style={[styles.badge, styles.badgeSoft]}>
            <Text style={styles.badgeTextSoft}>NOVA {product.nova_group ?? "—"}</Text>
          </View>
        </View>
      </View>
      
      <Pressable
        style={styles.cta}
        onPress={() => navigation.navigate("CompareHub", { leftBarcode: barcode! })}
      >
        <Text style={styles.ctaText}>Comparer avec un autre produit</Text>
      </Pressable>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Nutrition (pour 100g)</Text>

        <Row label="Calories" value={fmt(product.nutriments?.["energy-kcal_100g"], "kcal")} />
        <Row label="Graisses" value={fmt(product.nutriments?.fat_100g)} />
        <Row label="Saturées" value={fmt(product.nutriments?.["saturated-fat_100g"])} />
        <Row label="Glucides" value={fmt(product.nutriments?.carbohydrates_100g)} />
        <Row label="Sucres" value={fmt(product.nutriments?.sugars_100g)} />
        <Row label="Fibres" value={fmt(product.nutriments?.fiber_100g)} />
        <Row label="Protéines" value={fmt(product.nutriments?.proteins_100g)} />
        <Row label="Sel" value={fmt(product.nutriments?.salt_100g)} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Ingrédients</Text>
        <Text style={styles.body}>{product.ingredients_text?.trim() || "—"}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Allergènes (tags)</Text>
        <Text style={styles.body}>{product.allergens_tags?.join(", ") || "—"}</Text>
      </View>
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#0b0b0c" },
  content: { padding: 16, paddingBottom: 30, gap: 14 },

  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 18, backgroundColor: "#0b0b0c" },

  title: { color: "#fff", fontSize: 22, fontWeight: "800" },
  muted: { color: "rgba(255,255,255,0.7)", fontSize: 13 },
  body: { color: "rgba(255,255,255,0.85)", fontSize: 14, lineHeight: 20 },

  hero: { marginTop: 6, gap: 12 },

  imageContainer: {
    width: "100%",
    height: 220,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.06)",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  image: { width: "92%", height: "92%" },
  imagePlaceholder: { alignItems: "center", justifyContent: "center" },

  badges: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  badge: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999 },
  badgeText: { color: "#fff", fontWeight: "900", fontSize: 13 },
  badgeSoft: { backgroundColor: "rgba(255,255,255,0.10)" },
  badgeTextSoft: { color: "rgba(255,255,255,0.92)", fontWeight: "900", fontSize: 13 },

  card: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 18,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  cardTitle: { color: "#fff", fontWeight: "800", fontSize: 14 },

  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
  rowLabel: { color: "rgba(255,255,255,0.75)" },
  rowValue: { color: "#fff", fontWeight: "700" },

  cta: { marginTop: 10, backgroundColor: "rgba(255,255,255,0.10)", padding: 12, borderRadius: 16 },
  ctaText: { color: "#fff", fontWeight: "900", textAlign: "center" },
});