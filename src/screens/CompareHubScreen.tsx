import React, { useEffect, useMemo, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import type { HistoryStackParamList } from "../navigation/types";
import type { HistoryItem } from "../types/history";
import { getHistory } from "../utils/historyStorage";
import { OFFFetch } from "../utils/api";
import type { OFFProductResponse } from "../types/off";
import { useAppTheme } from "../context/ThemeContext";

type Props = NativeStackScreenProps<HistoryStackParamList, "CompareHub">;

type MiniProduct = {
  barcode: string;
  name?: string;
  brand?: string;
  imageUrl?: string;
};

export default function CompareHubScreen({ navigation, route }: Props) {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const leftBarcode = route.params?.leftBarcode;
  const rightBarcode = route.params?.rightBarcode;

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [fallbackLeft, setFallbackLeft] = useState<MiniProduct | null>(null);
  const [fallbackRight, setFallbackRight] = useState<MiniProduct | null>(null);

  useEffect(() => {
    getHistory().then(setHistory).catch(() => setHistory([]));
  }, []);

  const leftFromHistory = useMemo(
    () => (leftBarcode ? history.find((h) => h.barcode === leftBarcode) : undefined),
    [history, leftBarcode],
  );
  const rightFromHistory = useMemo(
    () => (rightBarcode ? history.find((h) => h.barcode === rightBarcode) : undefined),
    [history, rightBarcode],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadFallback(barcode: string, side: "left" | "right") {
      try {
        const data = await OFFFetch<OFFProductResponse>(`product/${barcode}`);
        if (cancelled) return;
        if (data?.status !== 1 || !data.product) return;

        const mini: MiniProduct = {
          barcode,
          name: data.product.product_name ?? undefined,
          brand: data.product.brands ?? undefined,
          imageUrl: data.product.image_url ?? undefined,
        };

        if (side === "left") setFallbackLeft(mini);
        else setFallbackRight(mini);
      } catch {}
    }

    setFallbackLeft(null);
    setFallbackRight(null);

    if (leftBarcode && !leftFromHistory) loadFallback(leftBarcode, "left");
    if (rightBarcode && !rightFromHistory) loadFallback(rightBarcode, "right");

    return () => {
      cancelled = true;
    };
  }, [leftBarcode, rightBarcode, leftFromHistory, rightFromHistory]);

  const left: MiniProduct | undefined = leftFromHistory
    ? {
        barcode: leftFromHistory.barcode,
        name: leftFromHistory.name,
        brand: leftFromHistory.brand,
        imageUrl: leftFromHistory.imageUrl,
      }
    : fallbackLeft ?? undefined;

  const right: MiniProduct | undefined = rightFromHistory
    ? {
        barcode: rightFromHistory.barcode,
        name: rightFromHistory.name,
        brand: rightFromHistory.brand,
        imageUrl: rightFromHistory.imageUrl,
      }
    : fallbackRight ?? undefined;

  const canCompare = Boolean(leftBarcode && rightBarcode);

  return (
    <View style={styles.page}>
      <Text style={styles.title}>Comparer des produits</Text>
      <Text style={styles.muted}>Ajoute 2 produits puis lance la comparaison.</Text>

      <SlotCard
        label="Produit 1"
        item={left}
        barcode={leftBarcode}
        onAdd={() => navigation.navigate("ComparePick", { slot: "left", leftBarcode, rightBarcode })}
        onRemove={() => navigation.setParams({ leftBarcode: undefined, rightBarcode })}
      />

      <SlotCard
        label="Produit 2"
        item={right}
        barcode={rightBarcode}
        onAdd={() => navigation.navigate("ComparePick", { slot: "right", leftBarcode, rightBarcode })}
        onRemove={() => navigation.setParams({ leftBarcode, rightBarcode: undefined })}
      />

      <Pressable
        disabled={!canCompare}
        style={[styles.primaryBtn, !canCompare && styles.primaryBtnDisabled]}
        onPress={() => navigation.navigate("Comparator", { leftBarcode: leftBarcode!, rightBarcode: rightBarcode! })}
      >
        <Text style={styles.primaryBtnText}>Comparer</Text>
      </Pressable>
    </View>
  );
}

function SlotCard({
  label,
  item,
  barcode,
  onAdd,
  onRemove,
}: {
  label: string;
  item?: MiniProduct;
  barcode?: string;
  onAdd: () => void;
  onRemove: () => void;
}) {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const has = Boolean(barcode);

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <Text style={styles.cardLabel}>{label}</Text>

        {has ? (
          <Pressable onPress={onRemove} style={styles.smallBtn}>
            <Text style={styles.smallBtnText}>Retirer</Text>
          </Pressable>
        ) : null}
      </View>

      {!has ? (
        <Pressable onPress={onAdd} style={styles.addBox}>
          <Text style={styles.addPlus}>＋</Text>
          <Text style={styles.addText}>Ajouter un produit</Text>
        </Pressable>
      ) : (
        <View style={styles.productRow}>
          <View style={styles.thumbWrap}>
            {item?.imageUrl ? (
              <Image source={{ uri: item.imageUrl }} style={styles.thumb} resizeMode="contain" />
            ) : (
              <View style={[styles.thumbWrap, styles.thumbPlaceholder]}>
                <Text style={styles.muted}>—</Text>
              </View>
            )}
          </View>

          <View style={styles.flexOne}>
            <Text style={styles.pName} numberOfLines={2}>
              {item?.name ?? "Produit"}
            </Text>
            <Text style={styles.muted} numberOfLines={1}>
              {item?.brand ?? "Marque"} • {barcode}
            </Text>
          </View>

          <Pressable onPress={onAdd} style={styles.smallBtn}>
            <Text style={styles.smallBtnText}>Changer</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useAppTheme>["theme"]) {
  return StyleSheet.create({
    page: { flex: 1, padding: 16, gap: 14, backgroundColor: theme.background },
    title: {
      color: theme.text,
      fontSize: theme.fontSizes.xxl,
      fontWeight: theme.fontWeights.heavy,
      letterSpacing: -0.5,
    },
    muted: { color: theme.textMuted, fontSize: theme.fontSizes.sm },

    card: {
      backgroundColor: theme.card,
      borderColor: theme.border,
      borderRadius: 20,
      padding: 16,
      borderWidth: 1,
      gap: 12,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 2,
    },
    cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    cardLabel: { color: theme.textMuted, fontWeight: theme.fontWeights.heavy, fontSize: theme.fontSizes.md },

    addBox: {
      height: 90,
      borderRadius: 16,
      borderWidth: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.neutralSoft,
      borderColor: theme.border,
    },
    addPlus: { color: theme.textSoft, fontSize: theme.fontSizes.xxxl, fontWeight: theme.fontWeights.heavy },
    addText: { color: theme.textMuted, fontWeight: theme.fontWeights.extraBold, marginTop: 4 },

    productRow: { flexDirection: "row", gap: 14, alignItems: "center" },
    thumbWrap: {
      width: 68,
      height: 68,
      borderRadius: 16,
      overflow: "hidden",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.imagePlaceholder,
    },
    thumb: { width: "95%", height: "95%" },
    thumbPlaceholder: {},

    pName: { color: theme.text, fontWeight: theme.fontWeights.heavy, fontSize: theme.fontSizes.md },

    smallBtn: {
      backgroundColor: theme.badgeSoft,
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: theme.borderRadius.pill,
    },
    smallBtnText: {
      color: theme.text,
      fontWeight: theme.fontWeights.heavy,
      fontSize: theme.fontSizes.xs,
      letterSpacing: 0.5,
    },

    primaryBtn: {
      marginTop: 8,
      paddingVertical: 16,
      borderRadius: 16,
      backgroundColor: theme.primary,
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    primaryBtnDisabled: { opacity: 0.4, shadowOpacity: 0, elevation: 0 },
    primaryBtnText: {
      color: theme.textInverse,
      textAlign: "center",
      fontWeight: theme.fontWeights.heavy,
      fontSize: theme.fontSizes.mdPlus,
      letterSpacing: 0.5,
    },
    flexOne: { flex: 1 },
  });
}
