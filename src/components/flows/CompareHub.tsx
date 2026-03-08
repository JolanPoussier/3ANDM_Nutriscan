import React, { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { useAppTheme } from "../../context/ThemeContext";
import type { HistoryStackParamList } from "../../navigation/types";
import type { HistoryItem } from "../../types/history";
import { OFFFetch } from "../../utils/api";
import { getHistory } from "../../utils/historyStorage";
import type { OFFProductResponse } from "../../types/off";
import PillButton from "../ui/PillButton";
import ProductThumbnail from "../ui/ProductThumbnail";

type Props = NativeStackScreenProps<HistoryStackParamList, "CompareHub">;

type MiniProduct = {
  barcode: string;
  name?: string;
  brand?: string;
  imageUrl?: string;
};

export default function CompareHub({ navigation, route }: Props) {
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
      } catch {
        // ignore fallback errors
      }
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
        {has ? <PillButton label="Retirer" onPress={onRemove} textColor={theme.text} /> : null}
      </View>

      {!has ? (
        <Pressable onPress={onAdd} style={styles.addBox}>
          <Text style={styles.addPlus}>＋</Text>
          <Text style={styles.addText}>Ajouter un produit</Text>
        </Pressable>
      ) : (
        <View style={styles.productRow}>
          <ProductThumbnail imageUrl={item?.imageUrl} size={56} radius={theme.borderRadius.md} />

          <View style={styles.flexOne}>
            <Text style={styles.pName} numberOfLines={2}>
              {item?.name ?? "Produit"}
            </Text>
            <Text style={styles.muted} numberOfLines={1}>
              {item?.brand ?? "Marque"} • {barcode}
            </Text>
          </View>

          <PillButton label="Changer" onPress={onAdd} textColor={theme.text} />
        </View>
      )}
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useAppTheme>["theme"]) {
  return StyleSheet.create({
    page: {
      flex: 1,
      backgroundColor: theme.background,
      padding: theme.layout.screenPadding,
      gap: theme.spacing.md,
    },
    title: {
      color: theme.text,
      fontSize: theme.fontSizes.xl,
      fontWeight: theme.fontWeights.heavy,
    },
    muted: { color: theme.textMuted, fontSize: theme.fontSizes.sm },

    card: {
      backgroundColor: theme.card,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.md - 2,
      borderWidth: 1,
      borderColor: theme.borderSoft,
      gap: theme.spacing.sm + 2,
    },
    cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    cardLabel: { color: theme.textMuted, fontWeight: theme.fontWeights.heavy, fontSize: theme.fontSizes.sm },

    addBox: {
      height: 84,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.neutralSoft,
      alignItems: "center",
      justifyContent: "center",
    },
    addPlus: { color: theme.text, fontSize: theme.fontSizes.xxl, fontWeight: theme.fontWeights.heavy },
    addText: { color: theme.textMuted, fontWeight: theme.fontWeights.extraBold },

    productRow: { flexDirection: "row", gap: theme.spacing.sm + 4, alignItems: "center" },
    flexOne: { flex: 1 },
    pName: { color: theme.text, fontWeight: theme.fontWeights.heavy, fontSize: theme.fontSizes.base },

    primaryBtn: {
      marginTop: theme.spacing.xs,
      paddingVertical: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      backgroundColor: theme.primary,
    },
    primaryBtnDisabled: { opacity: 0.45 },
    primaryBtnText: { textAlign: "center", color: theme.textInverse, fontWeight: theme.fontWeights.heavy },
  });
}
