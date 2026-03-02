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
import { useFavorites } from "../context/FavoritesContext";

import { getPreferences } from "../utils/preferencesStorage";
import type { Preferences } from "../types/preferences";
import { ALLERGENS } from "../types/preferences";
import { checkDiet, detectAllergens } from "../utils/productRules";
import { useI18n } from "../context/I18nContext";

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
  const { t } = useI18n();
  const barcode = route.params?.barcode;
  const { categories, addOrUpdateFavorite, removeFavorite, isFavorite, getFavorite } = useFavorites();

  const [loading, setLoading] = useState(true);
  const [prefs, setPrefs] = useState<Preferences | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [product, setProduct] = useState<OFFProduct | null>(null);

  useEffect(() => {
    getPreferences().then(setPrefs).catch(() => setPrefs(null));
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!barcode) {
        setError(t("product.missingBarcode"));
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await OFFFetch<OFFProductResponse>(`product/${barcode}`);

        if (cancelled) return;

        if (data?.status !== 1 || !data.product) {
          setError(t("product.notFound"));
          setProduct(null);
        } else {
          setProduct(data.product);
        }
      } catch {
        if (!cancelled) setError(t("common.networkError"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [barcode, t]);

  const headerTitle = useMemo(
    () => product?.product_name ?? t("navigation.stack.productDetails"),
    [product?.product_name, t]
  );
  const favorite = getFavorite(barcode);
  const favoriteCategoryName = categories.find((cat) => cat.id === favorite?.categoryId)?.name;
  const favoriteActive = isFavorite(barcode);

  function onFavoritePress() {
    if (!barcode || !product) return;
    if (favoriteActive) {
      removeFavorite(barcode);
      return;
    }
    addOrUpdateFavorite(
      {
        barcode,
        name: product.product_name?.trim() || t("common.unknownProduct"),
        brand: product.brands?.trim() || t("common.unknownBrand"),
        imageUrl: product.image_url,
        nutriScore: product.nutriscore_grade?.toUpperCase(),
      },
      "default_uncategorized"
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={[styles.muted, { marginTop: 10 }]}>{t("product.loading")}</Text>
      </View>
    );
  }

  if (error || !product) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Oups</Text>
        <Text style={styles.muted}>{error ?? t("product.failedLoad")}</Text>
        <Text style={[styles.muted, { marginTop: 8 }]}>barcode : {barcode ?? "—"}</Text>
      </View>
    );
  }

  const grade = product.nutriscore_grade?.toUpperCase();

  
  const allergensHit = prefs ? detectAllergens(product, prefs) : [];
  const dietLabel = prefs ? t(`preferences.diets.${prefs.diet}`) : t("preferences.food.none");
  const dietStatus = prefs ? checkDiet(product, prefs.diet) : { ok: true as const };

  const showAlert =
    (prefs && allergensHit.length > 0) ||
    (prefs && prefs.diet !== "none" && dietStatus.ok !== true);

  const allergensText = allergensHit.length > 0
    ? allergensHit
        .map((key) => ALLERGENS.find((a) => a.key === key)?.key ?? key)
        .map((key) => t(`preferences.allergens.${key}`))
        .join(", ")
    : "";

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{headerTitle}</Text>
      <Text style={styles.muted}>
        {(product.brands ?? t("common.unknownBrand"))} • {(product.quantity ?? t("common.unknownQuantity"))}
      </Text>


      {prefs && showAlert ? (
        <View style={styles.alertBox}>
          <Text style={styles.alertTitle}>⚠️ {t("product.warning")}</Text>

          {allergensHit.length > 0 ? (
            <Text style={styles.alertText}>{t("product.allergensDetected", { allergens: allergensText })}</Text>
          ) : null}

          {prefs.diet !== "none" && dietStatus.ok !== true ? (
            <Text style={styles.alertText}>
              {t("product.dietStatus", {
                diet: dietLabel,
                status:
                  dietStatus.ok === "unknown"
                    ? `${t("product.unknownInfo")} - ${dietStatus.reason}`
                    : dietStatus.reason,
              })}
            </Text>
          ) : null}
        </View>
      ) : null}

      <View style={styles.hero}>
        {product.image_url ? (
          <View style={styles.imageContainer}>
            <Image source={{ uri: product.image_url }} style={styles.image} resizeMode="contain" />
          </View>
        ) : (
          <View style={[styles.imageContainer, styles.imagePlaceholder]}>
            <Text style={styles.muted}>{t("common.noImage")}</Text>
          </View>
        )}

        <View style={styles.badges}>
          <View style={[styles.badge, { backgroundColor: nutriColor(product.nutriscore_grade) }]}>
            <Text style={styles.badgeText}>
              {t("product.nutriScore")} {grade ?? "—"}
            </Text>
          </View>

          <View style={[styles.badge, styles.badgeSoft]}>
            <Text style={styles.badgeTextSoft}>NOVA {product.nova_group ?? "—"}</Text>
          </View>
        </View>

        <View style={styles.favoriteRow}>
          <Pressable
            style={[styles.heartButton, favoriteActive ? styles.heartButtonActive : null]}
            onPress={onFavoritePress}
          >
            <Text style={styles.heartIcon}>{favoriteActive ? "♥" : "♡"}</Text>
          </Pressable>
          {favoriteCategoryName ? (
            <Text style={styles.favoriteSubText}>
              {t("product.category")}: {favoriteCategoryName}
            </Text>
          ) : null}
        </View>
      </View>

      <Pressable
        style={styles.cta}
        onPress={() => navigation.navigate("CompareHub", { leftBarcode: barcode! })}
      >
        <Text style={styles.ctaText}>{t("product.compare")}</Text>
      </Pressable>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t("product.nutrition")}</Text>

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
        <Text style={styles.cardTitle}>{t("product.ingredients")}</Text>
        <Text style={styles.body}>{product.ingredients_text?.trim() || "—"}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t("product.allergensTags")}</Text>
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

  alertBox: {
    backgroundColor: "rgba(214,69,65,0.18)",
    borderColor: "rgba(214,69,65,0.35)",
    borderWidth: 1,
    borderRadius: 18,
    padding: 12,
  },
  alertTitle: { color: "#fff", fontWeight: "900", marginBottom: 6 },
  alertText: { color: "rgba(255,255,255,0.85)", fontWeight: "700", lineHeight: 18 },

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
  favoriteRow: { marginTop: 2, flexDirection: "row", alignItems: "center", gap: 10 },
  heartButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  heartButtonActive: {
    backgroundColor: "rgba(239,68,68,0.22)",
    borderColor: "rgba(248,113,113,0.5)",
  },
  heartIcon: { color: "#fff", fontSize: 22, lineHeight: 22, fontWeight: "900" },
  favoriteSubText: { color: "rgba(191,219,254,0.85)", fontSize: 12 },

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
