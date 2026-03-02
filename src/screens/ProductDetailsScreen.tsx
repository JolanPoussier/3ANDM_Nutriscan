import { Ionicons } from "@expo/vector-icons";
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
import { useI18n } from "../context/I18nContext";
import { useAppTheme } from "../context/ThemeContext";
import type { HistoryStackParamList, ProductDetailsParams } from "../navigation/types";
import type { OFFProduct, OFFProductResponse } from "../types/off";
import { ALLERGENS, type Preferences } from "../types/preferences";
import { OFFFetch } from "../utils/api";
import { getNutriColor } from "../utils/nutriColor";
import { getPreferences } from "../utils/preferencesStorage";
import { resolveProductImageUrl } from "../utils/productImage";
import { checkDiet, detectAllergens } from "../utils/productRules";
import { normalizeNutriGrade } from "../utils/nutriScore";

type Props = {
  route: RouteProp<Record<string, ProductDetailsParams>, string>;
  navigation: NativeStackNavigationProp<HistoryStackParamList>;
};

function fmt(n?: number, unit = "g") {
  if (n === undefined || n === null || Number.isNaN(n)) return "—";
  return `${n} ${unit}`;
}

export default function ProductDetailsScreen({ route, navigation }: Props) {
  const { t } = useI18n();
  const { theme, isDark } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const barcode = route.params?.barcode;
  const { categories, addOrUpdateFavorite, removeFavorite, isFavorite, getFavorite } = useFavorites();

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
  const favoriteCategoryName = categories.find((cat) => cat.id === favorite?.categoryId)?.name;
  const favoriteActive = isFavorite(barcode);

  const nutriBadgeStyle = useMemo(
    () => ({ backgroundColor: getNutriColor(theme, product?.nutriscore_grade) }),
    [product?.nutriscore_grade, theme],
  );

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
        imageUrl: resolveProductImageUrl(product),
        nutriScore: normalizeNutriGrade(product.nutriscore_grade) ?? undefined,
      },
      "default_uncategorized",
    );
  }

  async function onSharePress() {
    if (!product) return;

    const shareBarcode = barcode ?? product.code ?? "—";
    const shareName = product.product_name?.trim() || t("common.unknownProduct");
    const shareBrand = product.brands?.trim() || t("common.unknownBrand");
    const shareNutri = normalizeNutriGrade(product.nutriscore_grade) ?? "—";
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
        <Text style={styles.loadingText}>{t("product.loading")}</Text>
      </View>
    );
  }

  if (error || !product) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Oups</Text>
        <Text style={styles.muted}>{error ?? t("product.failedLoad")}</Text>
        <Text style={styles.errorBarcode}>barcode : {barcode ?? "—"}</Text>
      </View>
    );
  }

  const grade = normalizeNutriGrade(product.nutriscore_grade);
  const productImageUrl = resolveProductImageUrl(product);
  const allergensHit = prefs ? detectAllergens(product, prefs) : [];
  const dietLabel = prefs ? t(`preferences.diets.${prefs.diet}`) : t("preferences.food.none");
  const dietStatus = prefs ? checkDiet(product, prefs.diet) : { ok: true as const };

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
    <ScrollView style={styles.page} contentContainerStyle={styles.contentContainer}>
      <View style={styles.headerRow}>
        <View style={styles.headerTextWrap}>
          <Text style={styles.title}>{headerTitle}</Text>
          <Text style={styles.muted}>
            {product.brands ?? t("common.unknownBrand")} • {product.quantity ?? t("common.unknownQuantity")}
          </Text>
          {favoriteCategoryName && favorite?.categoryId !== "default_uncategorized" ? (
            <Text style={styles.favoriteSubText}>{favoriteCategoryName}</Text>
          ) : null}
        </View>
        <View style={styles.headerActions}>
          <Pressable style={[styles.actionIconButton, isDark ? theme.shadows.sm : null]} onPress={onSharePress}>
            <Ionicons name="share-social-outline" size={20} color={theme.text} />
          </Pressable>
          <Pressable
            style={[
              styles.actionIconButton,
              isDark ? theme.shadows.sm : null,
              favoriteActive ? styles.heartButtonActive : null,
            ]}
            onPress={onFavoritePress}
          >
            <Ionicons
              name={favoriteActive ? "heart" : "heart-outline"}
              size={20}
              color={favoriteActive ? theme.error : theme.textMuted}
            />
          </Pressable>
        </View>
      </View>

      {showAlert ? (
        <View style={styles.alertBox}>
          <Text style={styles.alertTitle}>⚠️ {t("product.warning")}</Text>

          {allergensHit.length > 0 ? (
            <Text style={styles.alertText}>
              {t("product.allergensDetected", { allergens: allergensText })}
            </Text>
          ) : null}

          {prefs && prefs.diet !== "none" && dietStatus.ok !== true ? (
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
        {productImageUrl ? (
          <View style={[styles.imageContainer, theme.shadows.sm]}>
            <Image source={{ uri: productImageUrl }} style={styles.image} resizeMode="contain" />
          </View>
        ) : (
          <View style={[styles.imageContainer, styles.imagePlaceholder, theme.shadows.sm]}>
            <Text style={styles.muted}>{t("common.noImage")}</Text>
          </View>
        )}

        <View style={styles.badges}>
          <View style={[styles.badge, styles.nutriBadgeBase, nutriBadgeStyle]}>
            <Text style={styles.badgeText}>
              {t("product.nutriScore")} {grade ?? "—"}
            </Text>
          </View>

          <View style={[styles.badge, styles.novaBadge]}>
            <Text style={styles.badgeTextSoft}>NOVA {product.nova_group ?? "—"}</Text>
          </View>
        </View>

      </View>

      <Pressable
        style={[styles.cta, theme.shadows.md]}
        onPress={() => navigation.navigate("CompareHub", { leftBarcode: barcode! })}
      >
        <Text style={styles.ctaText}>{t("product.compare")}</Text>
      </Pressable>

      <View style={[styles.card, theme.shadows.sm]}>
        <Text style={styles.cardTitle}>{t("product.nutrition")}</Text>

        <NutritionRow styles={styles} label="Calories" value={fmt(product.nutriments?.["energy-kcal_100g"], "kcal")} />
        <NutritionRow styles={styles} label="Graisses" value={fmt(product.nutriments?.fat_100g)} />
        <NutritionRow styles={styles} label="Saturées" value={fmt(product.nutriments?.["saturated-fat_100g"])} />
        <NutritionRow styles={styles} label="Glucides" value={fmt(product.nutriments?.carbohydrates_100g)} />
        <NutritionRow styles={styles} label="Sucres" value={fmt(product.nutriments?.sugars_100g)} />
        <NutritionRow styles={styles} label="Fibres" value={fmt(product.nutriments?.fiber_100g)} />
        <NutritionRow styles={styles} label="Protéines" value={fmt(product.nutriments?.proteins_100g)} />
        <NutritionRow styles={styles} label="Sel" value={fmt(product.nutriments?.salt_100g)} />
      </View>

      <View style={[styles.card, theme.shadows.sm]}>
        <Text style={styles.cardTitle}>{t("product.ingredients")}</Text>
        <Text style={styles.body}>{product.ingredients_text?.trim() || "—"}</Text>
      </View>

      <View style={[styles.card, theme.shadows.sm]}>
        <Text style={styles.cardTitle}>{t("product.allergensTags")}</Text>
        <Text style={styles.body}>{product.allergens_tags?.join(", ") || "—"}</Text>
      </View>
    </ScrollView>
  );
}

function NutritionRow({
  styles,
  label,
  value,
}: {
  styles: ReturnType<typeof createStyles>;
  label: string;
  value: string;
}) {
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
    contentContainer: {
      padding: theme.layout.screenPadding,
      paddingBottom: theme.spacing.xxl,
      gap: theme.spacing.lg,
    },

    center: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 18,
      backgroundColor: theme.background,
    },
    loadingText: {
      marginTop: theme.spacing.sm,
      color: theme.textMuted,
      fontSize: theme.fontSizes.sm,
    },

    title: {
      color: theme.text,
      fontSize: theme.fontSizes.xxl,
      fontWeight: theme.fontWeights.heavy,
      letterSpacing: -0.5,
    },
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: theme.spacing.md,
    },
    headerTextWrap: {
      flex: 1,
      gap: theme.spacing.xs,
    },
    headerActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.sm,
      marginTop: 2,
    },
    actionIconButton: {
      width: 40,
      height: 40,
      backgroundColor: theme.card,
      borderColor: theme.border,
      borderRadius: theme.borderRadius.pill,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
    },
    muted: {
      color: theme.textMuted,
      fontSize: theme.fontSizes.sm,
      fontWeight: theme.fontWeights.medium,
    },
    body: { color: theme.text, fontSize: theme.fontSizes.md, lineHeight: 22 },
    errorBarcode: {
      marginTop: theme.spacing.sm,
      color: theme.textMuted,
      fontSize: theme.fontSizes.sm,
      fontWeight: theme.fontWeights.medium,
    },

    alertBox: {
      backgroundColor: theme.errorSoft,
      borderColor: theme.errorBorder,
      borderWidth: 1,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      gap: theme.spacing.xs,
    },
    alertTitle: {
      color: theme.error,
      fontWeight: theme.fontWeights.heavy,
      marginBottom: 4,
    },
    alertText: {
      color: theme.text,
      fontWeight: theme.fontWeights.semiBold,
      lineHeight: 18,
    },

    hero: { marginTop: 8, gap: 14 },

    imageContainer: {
      width: "100%",
      height: 240,
      backgroundColor: theme.imagePlaceholder,
      borderColor: theme.border,
      borderRadius: theme.borderRadius.xl,
      justifyContent: "center",
      alignItems: "center",
      overflow: "hidden",
      borderWidth: 1,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 10,
      elevation: 3,
    },
    image: { width: "95%", height: "95%" },
    imagePlaceholder: { alignItems: "center", justifyContent: "center" },

    badges: { flexDirection: "row", gap: theme.spacing.sm, flexWrap: "wrap", marginTop: 4 },
    badge: {
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.lg,
      borderRadius: theme.borderRadius.pill,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 2,
    },
    nutriBadgeBase: {},
    novaBadge: { backgroundColor: theme.badgeSoft },
    badgeText: {
      color: theme.textInverse,
      fontWeight: theme.fontWeights.heavy,
      fontSize: theme.fontSizes.sm,
      letterSpacing: 0.5,
    },
    badgeTextSoft: {
      color: theme.text,
      fontWeight: theme.fontWeights.extraBold,
      fontSize: theme.fontSizes.sm,
    },

    heartButtonActive: {
      backgroundColor: theme.errorSoft,
      borderColor: theme.errorBorder,
    },
    favoriteSubText: {
      color: theme.primary,
      fontSize: theme.fontSizes.sm,
      fontWeight: theme.fontWeights.semiBold,
    },

    card: {
      backgroundColor: theme.card,
      borderColor: theme.border,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      gap: theme.spacing.md,
      borderWidth: 1,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 2,
    },
    cardTitle: {
      color: theme.text,
      fontWeight: theme.fontWeights.heavy,
      fontSize: theme.fontSizes.lg,
      letterSpacing: -0.2,
    },

    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: theme.spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.dividerSoft,
    },
    rowLabel: { color: theme.textMuted, fontSize: theme.fontSizes.md },
    rowValue: {
      color: theme.text,
      fontWeight: theme.fontWeights.extraBold,
      fontSize: theme.fontSizes.md,
    },

    cta: {
      marginTop: 12,
      backgroundColor: theme.primary,
      shadowColor: theme.primary,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    ctaText: {
      color: theme.textInverse,
      fontWeight: theme.fontWeights.heavy,
      textAlign: "center",
      fontSize: theme.fontSizes.md,
      letterSpacing: 0.5,
    },
  });
}
