import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import type { HistoryStackParamList } from "../navigation/types";
import type { HistoryItem } from "../types/history";
import { getHistory } from "../utils/historyStorage";
import { OFFSearch } from "../utils/api";
import { useDebounce } from "../hooks/useDebounce";

type Props = NativeStackScreenProps<HistoryStackParamList, "ComparePick">;

type OFFSearchHit = {
  code?: string;
  product_name?: string;
  brands?: string;
  image_url?: string;
};

type OFFSearchV2Response = {
  hits?: OFFSearchHit[];
};

type UnifiedItem =
  | { kind: "history"; barcode: string; name?: string; brand?: string; imageUrl?: string }
  | { kind: "api"; barcode: string; name?: string; brand?: string; imageUrl?: string };

export default function ComparePickScreen({ navigation, route }: Props) {
  const { slot, leftBarcode, rightBarcode } = route.params;

  const [q, setQ] = useState("");
  const debouncedQ = useDebounce(q, 400);

  const [history, setHistory] = useState<HistoryItem[]>([]);

  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiHits, setApiHits] = useState<OFFSearchHit[]>([]);

  const requestIdRef = useRef(0);

  useEffect(() => {
    getHistory().then(setHistory).catch(() => setHistory([]));
  }, []);

  function pick(barcode: string) {
    const next =
      slot === "left"
        ? { leftBarcode: barcode, rightBarcode }
        : { leftBarcode, rightBarcode: barcode };

    navigation.navigate("CompareHub", next);
  }

  const filteredHistory = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return history;

    return history.filter((it) => {
      const name = (it.name ?? "").toLowerCase();
      const brand = (it.brand ?? "").toLowerCase();
      const barcode = (it.barcode ?? "").toLowerCase();
      return name.includes(query) || brand.includes(query) || barcode.includes(query);
    });
  }, [history, q]);

  useEffect(() => {
    const query = debouncedQ.trim();
    setApiError(null);

    if (query.length < 2) {
      setApiHits([]);
      setApiLoading(false);
      return;
    }

    const myId = ++requestIdRef.current;

    (async () => {
      try {
        setApiLoading(true);
        setApiError(null);

        const res = await OFFSearch<OFFSearchV2Response>(query, {
          page: 1,
          size: 20,
          sort_by: "unique_scans_n",
          fields: "code,product_name,brands,image_url,unique_scans_n",
        });

        if (myId !== requestIdRef.current) return;

        const hits = Array.isArray(res?.hits) ? res.hits : [];
        setApiHits(hits);
      } catch (e: any) {
        if (myId !== requestIdRef.current) return;
        setApiError(e?.message ?? "Erreur lors de la recherche.");
        setApiHits([]);
      } finally {
        if (myId === requestIdRef.current) setApiLoading(false);
      }
    })();
  }, [debouncedQ]);

  const unified = useMemo<UnifiedItem[]>(() => {
    const seen = new Set<string>();

    const h: UnifiedItem[] = filteredHistory.map((it) => {
      seen.add(it.barcode);
      return {
        kind: "history",
        barcode: it.barcode,
        name: it.name,
        brand: it.brand,
        imageUrl: it.imageUrl,
      };
    });

    const a: UnifiedItem[] = apiHits
      .map((hit) => ({
        barcode: (hit.code ?? "").trim(),
        name: hit.product_name,
        brand: hit.brands,
        imageUrl: hit.image_url,
      }))
      .filter((x) => x.barcode.length > 0)
      .filter((x) => !seen.has(x.barcode))
      .map((x) => ({ kind: "api", ...x }));

    return [...h, ...a];
  }, [filteredHistory, apiHits]);

  const showEmpty =
    unified.length === 0 && !apiLoading && (q.trim().length === 0 || q.trim().length >= 2);

  return (
    <View style={styles.page}>
      <Text style={styles.title}>Choisir un produit</Text>
      <Text style={styles.muted}>
        Recherche dans l’historique + Open Food Facts
      </Text>

      <View style={styles.searchBox}>
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Nom, marque ou code-barres…"
          placeholderTextColor="rgba(255,255,255,0.45)"
          style={styles.input}
          autoCorrect={false}
          autoCapitalize="none"
        />
      </View>

      <View style={{ minHeight: 22 }}>
        {apiLoading ? (
          <View style={styles.inlineRow}>
            <ActivityIndicator />
            <Text style={[styles.muted, { marginLeft: 10 }]}>Recherche…</Text>
          </View>
        ) : apiError ? (
          <Text style={styles.error}>{apiError}</Text>
        ) : q.trim().length > 0 && q.trim().length < 2 ? (
          <Text style={styles.muted}>Tape au moins 2 caractères pour interroger l’API.</Text>
        ) : null}
      </View>

      <FlatList
        data={unified}
        keyExtractor={(item) => `${item.kind}:${item.barcode}`}
        contentContainerStyle={{ paddingBottom: 16 }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={
          showEmpty ? (
            <View style={{ paddingTop: 22 }}>
              <Text style={styles.muted}>Aucun résultat.</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => pick(item.barcode)}>
            <View style={styles.row}>
              <View style={styles.thumbWrap}>
                {item.imageUrl ? (
                  <Image source={{ uri: item.imageUrl }} style={styles.thumb} resizeMode="contain" />
                ) : (
                  <View style={[styles.thumbWrap, styles.thumbPlaceholder]}>
                    <Text style={styles.muted}>{item.kind === "api" ? "OFF" : "—"}</Text>
                  </View>
                )}
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.name} numberOfLines={1}>
                  {item.name ?? "Produit"}
                </Text>
                <Text style={styles.muted} numberOfLines={1}>
                  {item.brand ?? "Marque"} • {item.barcode}
                </Text>

                {item.kind === "history" ? (
                  <Text style={[styles.muted, { marginTop: 4 }]}>Historique</Text>
                ) : (
                  <Text style={[styles.muted, { marginTop: 4 }]}>Open Food Facts</Text>
                )}
              </View>

              <View style={styles.pill}>
                <Text style={styles.pillText}>Choisir</Text>
              </View>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#0b0b0c", padding: 16, gap: 12 },
  title: { color: "#fff", fontSize: 22, fontWeight: "900" },
  muted: { color: "rgba(255,255,255,0.7)", fontSize: 13 },
  error: { color: "#ffb4b4", fontSize: 13, fontWeight: "800" },

  searchBox: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  input: { color: "#fff", fontWeight: "700" },

  inlineRow: { flexDirection: "row", alignItems: "center" },

  card: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  row: { flexDirection: "row", gap: 12, alignItems: "center" },

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

  name: { color: "#fff", fontSize: 14, fontWeight: "900" },

  pill: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.10)" },
  pillText: { color: "#fff", fontWeight: "900", fontSize: 12 },
});