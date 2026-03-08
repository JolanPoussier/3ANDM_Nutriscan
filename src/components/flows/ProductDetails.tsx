import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { useFavorites } from "../../context/FavoritesContext";
import { useAppTheme } from "../../context/ThemeContext";
import type { ProductDetailsParams, HistoryStackParamList } from "../../navigation/types";
import type { OFFProduct, OFFProductResponse } from "../../types/off";
import { OFFFetch } from "../../utils/api";
import NutriScoreBadge from "../ui/NutriScoreBadge";
import ProductThumbnail from "../ui/ProductThumbnail";

type Props = {
  route: RouteProp<Record<string, ProductDetailsParams>, string>;
  navigation: NativeStackNavigationProp<HistoryStackParamList>;
};

function fmt(n?: number, unit = "g") {
  if (n === undefined || n === null || Number.isNaN(n)) return "—";
  return `${n} ${unit}`;
}

export default function ProductDetails({ route, navigation }: Props) {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const barcode = route.params?.barcode;
  const { categories, addOrUpdateFavorite, removeFavorite, isFavorite, getFavorite } = useFavorites();

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
        name: product.product_name?.trim() || "Produit sans nom",
        brand: product.brands?.trim() || "Marque inconnue",
        imageUrl: product.image_url,
        nutriScore: product.nutriscore_grade?.toUpperCase(),
      },
      "default_uncategorized",
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={theme.primary} />
        <Text style={styles.centerMuted}>Chargement du produit…</Text>
      </View>
    );
  }

  if (error || !product) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Oups</Text>
        <Text style={styles.muted}>{error ?? "Impossible de charger le produit."}</Text>
        <Text style={styles.muted}>barcode : {barcode ?? "—"}</Text>
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
        <View style={styles.imageContainer}>
          <ProductThumbnail imageUrl={product.image_url} size={202} radius={theme.borderRadius.md} placeholderText="Pas d'image" backgroundColor="transparent" textColor={theme.textMuted} />
        </View>

        <View style={styles.badges}>
          <NutriScoreBadge grade={grade} shape="pill" prefix="Nutri-Score" textSize={theme.fontSizes.sm} />
          <View style={styles.badgeSoft}>
            <Text style={styles.badgeTextSoft}>NOVA {product.nova_group ?? "—"}</Text>
          </View>
        </View>

        <View style={styles.favoriteRow}>
          <Pressable style={[styles.heartButton, favoriteActive ? styles.heartButtonActive : null]} onPress={onFavoritePress}>
            <Text style={styles.heartIcon}>{favoriteActive ? "♥" : "♡"}</Text>
          </Pressable>
          {favoriteCategoryName ? <Text style={styles.favoriteSubText}>Catégorie: {favoriteCategoryName}</Text> : null}
        </View>
      </View>

      <Pressable style={styles.cta} onPress={() => navigation.navigate("CompareHub", { leftBarcode: barcode! })}>
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
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useAppTheme>["theme"]) {
  return StyleSheet.create({
    page: { flex: 1, backgroundColor: theme.background },
    content: { padding: theme.layout.screenPadding, paddingBottom: theme.spacing.xxl - 2, gap: theme.spacing.md },

    center: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: theme.spacing.lg + 2,
      backgroundColor: theme.background,
      gap: theme.spacing.sm,
    },
    centerMuted: { color: theme.textMuted, fontSize: theme.fontSizes.sm },

    title: { color: theme.text, fontSize: theme.fontSizes.xl, fontWeight: theme.fontWeights.extraBold },
    muted: { color: theme.textMuted, fontSize: theme.fontSizes.sm },
    body: { color: theme.text, fontSize: theme.fontSizes.base, lineHeight: 20 },

    hero: { marginTop: theme.spacing.xs + 2, gap: theme.spacing.sm + 4 },

    imageContainer: {
      width: "100%",
      height: 220,
      borderRadius: theme.borderRadius.lg,
      backgroundColor: theme.card,
      justifyContent: "center",
      alignItems: "center",
      overflow: "hidden",
      borderWidth: 1,
      borderColor: theme.borderSoft,
    },

    badges: { flexDirection: "row", gap: theme.spacing.sm + 2, flexWrap: "wrap" },
    badgeSoft: {
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md - 2,
      borderRadius: theme.borderRadius.pill,
      backgroundColor: theme.badgeSoft,
    },
    badgeTextSoft: { color: theme.text, fontWeight: theme.fontWeights.heavy, fontSize: theme.fontSizes.sm },

    favoriteRow: { marginTop: theme.spacing.xs, flexDirection: "row", alignItems: "center", gap: theme.spacing.sm + 2 },
    heartButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.cardSoft,
      borderWidth: 1,
      borderColor: theme.border,
    },
    heartButtonActive: {
      backgroundColor: theme.errorSoft,
      borderColor: theme.errorBorder,
    },
    heartIcon: { color: theme.text, fontSize: theme.fontSizes.xlMinus, lineHeight: 22, fontWeight: theme.fontWeights.heavy },
    favoriteSubText: { color: theme.primary, fontSize: theme.fontSizes.xs },

    card: {
      backgroundColor: theme.card,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.md,
      gap: theme.spacing.sm + 2,
      borderWidth: 1,
      borderColor: theme.borderSoft,
    },
    cardTitle: { color: theme.text, fontWeight: theme.fontWeights.extraBold, fontSize: theme.fontSizes.base },

    row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: theme.spacing.sm - 2 },
    rowLabel: { color: theme.textMuted },
    rowValue: { color: theme.text, fontWeight: theme.fontWeights.bold },

    cta: {
      marginTop: theme.spacing.sm + 2,
      backgroundColor: theme.primary,
      padding: theme.spacing.sm + 4,
      borderRadius: theme.borderRadius.md,
    },
    ctaText: { color: theme.textInverse, fontWeight: theme.fontWeights.heavy, textAlign: "center" },
  });
}
