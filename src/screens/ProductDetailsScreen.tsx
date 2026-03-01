import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useFavorites } from "../context/FavoritesContext";
import type {
  HistoryStackParamList,
  ProductDetailsParams,
} from "../navigation/types";
import type { OFFProduct, OFFProductResponse } from "../types/off";
import { OFFFetch } from "../utils/api";

import { useI18n } from "../context/I18nContext";
import type { Preferences } from "../types/preferences";
import { ALLERGENS } from "../types/preferences";
import { getPreferences } from "../utils/preferencesStorage";
import { checkDiet, detectAllergens } from "../utils/productRules";

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
  const {
    categories,
    addOrUpdateFavorite,
    removeFavorite,
    isFavorite,
    getFavorite,
  } = useFavorites();

  const [loading, setLoading] = useState(true);
  const [prefs, setPrefs] = useState<Preferences | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [product, setProduct] = useState<OFFProduct | null>(null);

  useEffect(() => {
    getPreferences()
      .then(setPrefs)
      .catch(() => setPrefs(null));
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
    [product?.product_name, t],
  );
  const favorite = getFavorite(barcode);
  const favoriteCategoryName = categories.find(
    (cat) => cat.id === favorite?.categoryId,
  )?.name;
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
      "default_uncategorized",
    );
  }

  async function onSharePress() {
    if (!product) return;

    const shareBarcode = barcode ?? product.code ?? "—";
    const shareName =
      product.product_name?.trim() || t("common.unknownProduct");
    const shareBrand = product.brands?.trim() || t("common.unknownBrand");
    const shareNutri = grade ?? "—";
    const shareUrl =
      shareBarcode && shareBarcode !== "—"
        ? `https://world.openfoodfacts.org/product/${shareBarcode}`
        : "https://world.openfoodfacts.org";

    try {
      await Share.share({
        title: shareName,
        message: t("product.shareText", {
          name: shareName,
          brand: shareBrand,
          barcode: shareBarcode,
          nutri: shareNutri,
          url: shareUrl,
        }),
      });
    } catch {
      Alert.alert(t("product.shareErrorTitle"), t("product.shareErrorMessage"));
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={[styles.muted, { marginTop: 10 }]}>
          {t("product.loading")}
        </Text>
      </View>
    );
  }

  if (error || !product) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Oups</Text>
        <Text style={styles.muted}>{error ?? t("product.failedLoad")}</Text>
        <Text style={[styles.muted, { marginTop: 8 }]}>
          barcode : {barcode ?? "—"}
        </Text>
      </View>
    );
  }

  const grade = product.nutriscore_grade?.toUpperCase();

  const allergensHit = prefs ? detectAllergens(product, prefs) : [];
  const dietLabel = prefs
    ? t(`preferences.diets.${prefs.diet}`)
    : t("preferences.food.none");
  const dietStatus = prefs
    ? checkDiet(product, prefs.diet)
    : { ok: true as const };

  const showAlert =
    (prefs && allergensHit.length > 0) ||
    (prefs && prefs.diet !== "none" && dietStatus.ok !== true);

  const allergensText =
    allergensHit.length > 0
      ? allergensHit
          .map((key) => ALLERGENS.find((a) => a.key === key)?.key ?? key)
          .map((key) => t(`preferences.allergens.${key}`))
          .join(", ")
      : "";

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{headerTitle}</Text>
      <Text style={styles.muted}>
        {product.brands ?? t("common.unknownBrand")} •{" "}
        {product.quantity ?? t("common.unknownQuantity")}
      </Text>

      {prefs && showAlert ? (
        <View style={styles.alertBox}>
          <Text style={styles.alertTitle}>⚠️ {t("product.warning")}</Text>

          {allergensHit.length > 0 ? (
            <Text style={styles.alertText}>
              {t("product.allergensDetected", { allergens: allergensText })}
            </Text>
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
            <Image
              source={{ uri: product.image_url }}
              style={styles.image}
              resizeMode="contain"
            />
          </View>
        ) : (
          <View style={[styles.imageContainer, styles.imagePlaceholder]}>
            <Text style={styles.muted}>{t("common.noImage")}</Text>
          </View>
        )}

        <View style={styles.badges}>
          <View
            style={[
              styles.badge,
              { backgroundColor: nutriColor(product.nutriscore_grade) },
            ]}
          >
            <Text style={styles.badgeText}>
              {t("product.nutriScore")} {grade ?? "—"}
            </Text>
          </View>

          <View style={[styles.badge, styles.badgeSoft]}>
            <Text style={styles.badgeTextSoft}>
              NOVA {product.nova_group ?? "—"}
            </Text>
          </View>
        </View>

        <View style={styles.favoriteRow}>
          <Pressable
            style={[
              styles.heartButton,
              favoriteActive ? styles.heartButtonActive : null,
            ]}
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
        onPress={() =>
          navigation.navigate("CompareHub", { leftBarcode: barcode! })
        }
      >
        <Text style={styles.ctaText}>{t("product.compare")}</Text>
      </Pressable>

      <Pressable style={styles.cta} onPress={onSharePress}>
        <Text style={styles.ctaText}>{t("product.share")}</Text>
      </Pressable>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t("product.nutrition")}</Text>

        <Row
          label="Calories"
          value={fmt(product.nutriments?.["energy-kcal_100g"], "kcal")}
        />
        <Row label="Graisses" value={fmt(product.nutriments?.fat_100g)} />
        <Row
          label="Saturées"
          value={fmt(product.nutriments?.["saturated-fat_100g"])}
        />
        <Row
          label="Glucides"
          value={fmt(product.nutriments?.carbohydrates_100g)}
        />
        <Row label="Sucres" value={fmt(product.nutriments?.sugars_100g)} />
        <Row label="Fibres" value={fmt(product.nutriments?.fiber_100g)} />
        <Row label="Protéines" value={fmt(product.nutriments?.proteins_100g)} />
        <Row label="Sel" value={fmt(product.nutriments?.salt_100g)} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t("product.ingredients")}</Text>
        <Text style={styles.body}>
          {product.ingredients_text?.trim() || "—"}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t("product.allergensTags")}</Text>
        <Text style={styles.body}>
          {product.allergens_tags?.join(", ") || "—"}
        </Text>
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
  page: { flex: 1, backgroundColor: "#0f172a" },
  content: { padding: 16, paddingBottom: 40, gap: 16 },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
    backgroundColor: "#0f172a",
  },

  title: {
    color: "#f8fafc",
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  muted: { color: "#94a3b8", fontSize: 13, fontWeight: "500" },
  body: { color: "#e2e8f0", fontSize: 15, lineHeight: 22 },

  alertBox: {
    backgroundColor: "rgba(214,69,65,0.18)",
    borderColor: "rgba(214,69,65,0.35)",
    borderWidth: 1,
    borderRadius: 18,
    padding: 12,
  },
  alertTitle: { color: "#fff", fontWeight: "900", marginBottom: 6 },
  alertText: {
    color: "rgba(255,255,255,0.85)",
    fontWeight: "700",
    lineHeight: 18,
  },

  hero: { marginTop: 6, gap: 12 },

  imageContainer: {
    width: "100%",
    height: 240,
    borderRadius: 24,
    backgroundColor: "#1e293b",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#334155",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  image: { width: "95%", height: "95%" },
  imagePlaceholder: { alignItems: "center", justifyContent: "center" },

  badges: { flexDirection: "row", gap: 10, flexWrap: "wrap", marginTop: 4 },
  badge: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 999,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  badgeText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 14,
    letterSpacing: 0.5,
  },
  badgeSoft: { backgroundColor: "#334155" },
  badgeTextSoft: { color: "#f8fafc", fontWeight: "800", fontSize: 14 },
  favoriteRow: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  heartButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "#334155",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  heartButtonActive: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderColor: "rgba(239, 68, 68, 0.4)",
  },
  heartIcon: {
    color: "#ef4444",
    fontSize: 26,
    lineHeight: 26,
    fontWeight: "900",
    marginTop: 2,
  },
  favoriteSubText: { color: "#60a5fa", fontSize: 13, fontWeight: "600" },

  card: {
    backgroundColor: "#1e293b",
    borderRadius: 20,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: "#334155",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    color: "#f8fafc",
    fontWeight: "900",
    fontSize: 16,
    letterSpacing: -0.2,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.03)",
  },
  rowLabel: { color: "#cbd5e1", fontSize: 15 },
  rowValue: { color: "#f8fafc", fontWeight: "800", fontSize: 15 },

  cta: {
    marginTop: 12,
    backgroundColor: "#10b981",
    padding: 16,
    borderRadius: 16,
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaText: {
    color: "#fff",
    fontWeight: "900",
    textAlign: "center",
    fontSize: 15,
    letterSpacing: 0.5,
  },
});
