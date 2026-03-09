import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import PersonalNutriScoreCard from "../components/PersonalNutriScoreCard";
import AppButton from "../components/ui/AppButton";
import ProductThumbnail from "../components/ui/ProductThumbnail";
import { useAppTheme } from "../context/ThemeContext";
import type { HistoryStackParamList } from "../navigation/types";
import type { HistoryItem } from "../types/history";
import type { OFFProductResponse } from "../types/off";
import { OFFFetch } from "../utils/api";
import { getHistory, removeFromHistory } from "../utils/historyStorage";
import { getNutriColor } from "../utils/nutriColor";
import { normalizeNutriGrade } from "../utils/nutriScore";
import { resolveProductImageUrl } from "../utils/productImage";

type Props = NativeStackScreenProps<HistoryStackParamList, "Historique">;

function formatDate(ts: number) {
  const d = new Date(ts);
  return `${d.toLocaleDateString()} • ${d.toLocaleTimeString().slice(0, 5)}`;
}

export default function HistoryScreen({ navigation }: Props) {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [resolvedImages, setResolvedImages] = useState<Record<string, string>>(
    {},
  );

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
            const data = await OFFFetch<OFFProductResponse>(
              `product/${barcode}`,
            );
            const url = resolveProductImageUrl(data?.product);
            return url ? ([barcode, url] as const) : null;
          } catch {
            return null;
          }
        }),
      );

      if (cancelled) return;
      const next = entries.filter((e): e is readonly [string, string] =>
        Boolean(e),
      );
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
        ListHeaderComponent={<PersonalNutriScoreCard items={items} />}
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
                <ProductThumbnail
                  imageUrl={imageUrl}
                  size={68}
                  borderRadius={theme.borderRadius.md}
                  iconSize={24}
                />

                <View style={styles.flexOne}>
                  <Text style={styles.name} numberOfLines={1}>
                    {item.name ?? "Produit inconnu"}
                  </Text>
                  <Text style={styles.muted} numberOfLines={1}>
                    {item.brand ?? "Marque inconnue"} •{" "}
                    {formatDate(item.scannedAt)}
                  </Text>

                  <View style={styles.badgeRow}>
                    <View
                      style={[styles.badge, itemBadgeStyle(item.nutriScore)]}
                    >
                      <Text style={styles.badgeText}>
                        Nutri {normalizeNutriGrade(item.nutriScore) ?? "—"}
                      </Text>
                    </View>
                    <Text style={styles.muted}>barcode: {item.barcode}</Text>
                  </View>

                  <AppButton
                    label="Comparer"
                    onPress={() =>
                      navigation.navigate("CompareHub", {
                        leftBarcode: item.barcode,
                      })
                    }
                    style={styles.compareBtn}
                    textStyle={styles.compareText}
                  />
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
