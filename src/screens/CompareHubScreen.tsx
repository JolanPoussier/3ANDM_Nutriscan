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
  page: { flex: 1, backgroundColor: "#0f172a", padding: 16, gap: 14 },
  title: { color: "#f8fafc", fontSize: 26, fontWeight: "900", letterSpacing: -0.5 },
  muted: { color: "#94a3b8", fontSize: 13 },

  card: {
    backgroundColor: "#1e293b",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#334155",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardLabel: { color: "#cbd5e1", fontWeight: "900", fontSize: 15 },

  addBox: {
    height: 90,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#334155",
    backgroundColor: "rgba(255,255,255,0.03)",
    alignItems: "center",
    justifyContent: "center",
  },
  addPlus: { color: "#64748b", fontSize: 28, fontWeight: "900" },
  addText: { color: "#94a3b8", fontWeight: "800", marginTop: 4 },

  productRow: { flexDirection: "row", gap: 14, alignItems: "center" },
  thumbWrap: {
    width: 68,
    height: 68,
    borderRadius: 16,
    backgroundColor: "#0f172a",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  thumb: { width: "95%", height: "95%" },
  thumbPlaceholder: {},

  pName: { color: "#f8fafc", fontWeight: "900", fontSize: 15 },

  smallBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: "#334155",
  },
  smallBtnText: { color: "#f8fafc", fontWeight: "900", fontSize: 12, letterSpacing: 0.5 },

  primaryBtn: { marginTop: 8, paddingVertical: 16, borderRadius: 16, backgroundColor: "#10b981", shadowColor: "#10b981", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  primaryBtnDisabled: { opacity: 0.4, shadowOpacity: 0, elevation: 0 },
  primaryBtnText: { textAlign: "center", color: "#fff", fontWeight: "900", fontSize: 16, letterSpacing: 0.5 },
});