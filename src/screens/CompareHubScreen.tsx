import React, { useEffect, useMemo, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import type { HistoryStackParamList } from "../navigation/types";
import type { HistoryItem } from "../types/history";
import { getHistory } from "../utils/historyStorage";
import { OFFFetch } from "../utils/api";
import type { OFFProductResponse } from "../types/off";

type Props = NativeStackScreenProps<HistoryStackParamList, "CompareHub">;

type MiniProduct = {
  barcode: string;
  name?: string;
  brand?: string;
  imageUrl?: string;
};

export default function CompareHubScreen({ navigation, route }: Props) {
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
    [history, leftBarcode]
  );
  const rightFromHistory = useMemo(
    () => (rightBarcode ? history.find((h) => h.barcode === rightBarcode) : undefined),
    [history, rightBarcode]
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
    ? { barcode: leftFromHistory.barcode, name: leftFromHistory.name, brand: leftFromHistory.brand, imageUrl: leftFromHistory.imageUrl }
    : fallbackLeft ?? undefined;

  const right: MiniProduct | undefined = rightFromHistory
    ? { barcode: rightFromHistory.barcode, name: rightFromHistory.name, brand: rightFromHistory.brand, imageUrl: rightFromHistory.imageUrl }
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
        onPress={() =>
          navigation.navigate("Comparator", { leftBarcode: leftBarcode!, rightBarcode: rightBarcode! })
        }
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

          <View style={{ flex: 1 }}>
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

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#0b0b0c", padding: 16, gap: 12 },
  title: { color: "#fff", fontSize: 22, fontWeight: "900" },
  muted: { color: "rgba(255,255,255,0.7)", fontSize: 13 },

  card: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    gap: 10,
  },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardLabel: { color: "rgba(255,255,255,0.85)", fontWeight: "900" },

  addBox: {
    height: 84,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  addPlus: { color: "#fff", fontSize: 26, fontWeight: "900" },
  addText: { color: "rgba(255,255,255,0.85)", fontWeight: "800" },

  productRow: { flexDirection: "row", gap: 12, alignItems: "center" },
  thumbWrap: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.05)",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  thumb: { width: "92%", height: "92%" },
  thumbPlaceholder: {},

  pName: { color: "#fff", fontWeight: "900", fontSize: 13 },

  smallBtn: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.10)",
  },
  smallBtnText: { color: "#fff", fontWeight: "900", fontSize: 12 },

  primaryBtn: { marginTop: 4, paddingVertical: 14, borderRadius: 16, backgroundColor: "#fff" },
  primaryBtnDisabled: { opacity: 0.35 },
  primaryBtnText: { textAlign: "center", color: "#000", fontWeight: "900" },
});