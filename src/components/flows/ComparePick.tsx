import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { useAppTheme } from "../../context/ThemeContext";
import { useDebounce } from "../../hooks/useDebounce";
import type { HistoryStackParamList } from "../../navigation/types";
import type { HistoryItem } from "../../types/history";
import { OFFSearch } from "../../utils/api";
import { getHistory } from "../../utils/historyStorage";
import PillButton from "../ui/PillButton";
import ProductThumbnail from "../ui/ProductThumbnail";

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

export default function ComparePick({ navigation, route }: Props) {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
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
      <Text style={styles.muted}>Recherche dans l’historique + Open Food Facts</Text>

      <View style={styles.searchBox}>
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Nom, marque ou code-barres…"
          placeholderTextColor={theme.textMuted}
          style={styles.input}
          autoCorrect={false}
          autoCapitalize="none"
        />
      </View>

      <View style={styles.statusContainer}>
        {apiLoading ? (
          <View style={styles.inlineRow}>
            <ActivityIndicator color={theme.primary} />
            <Text style={styles.statusText}>Recherche…</Text>
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
        contentContainerStyle={styles.listContentContainer}
        ItemSeparatorComponent={ItemSeparator}
        ListEmptyComponent={
          showEmpty ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.muted}>Aucun résultat.</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => pick(item.barcode)}>
            <View style={styles.row}>
              <ProductThumbnail imageUrl={item.imageUrl} size={56} radius={14} placeholderText={item.kind === "api" ? "OFF" : "—"} />

              <View style={styles.flexOne}>
                <Text style={styles.name} numberOfLines={1}>
                  {item.name ?? "Produit"}
                </Text>
                <Text style={styles.muted} numberOfLines={1}>
                  {item.brand ?? "Marque"} • {item.barcode}
                </Text>

                <Text style={styles.kindText}>{item.kind === "history" ? "Historique" : "Open Food Facts"}</Text>
              </View>

              <PillButton label="Choisir" onPress={() => pick(item.barcode)} textColor={theme.text} />
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

function ItemSeparator() {
  return <View style={separatorStyles.separator} />;
}

const separatorStyles = StyleSheet.create({
  separator: { height: 10 },
});

function createStyles(theme: ReturnType<typeof useAppTheme>["theme"]) {
  return StyleSheet.create({
    page: {
      flex: 1,
      backgroundColor: theme.background,
      padding: theme.layout.screenPadding,
      gap: theme.spacing.md,
    },
    title: { color: theme.text, fontSize: theme.fontSizes.xl, fontWeight: theme.fontWeights.heavy },
    muted: { color: theme.textMuted, fontSize: theme.fontSizes.sm },
    error: { color: theme.errorText, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.extraBold },

    searchBox: {
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.card,
      paddingHorizontal: theme.spacing.sm + 4,
      paddingVertical: theme.spacing.sm + 2,
    },
    input: { color: theme.text, fontWeight: theme.fontWeights.bold },

    statusContainer: { minHeight: 22, justifyContent: "center" },
    statusText: { color: theme.textMuted, fontSize: theme.fontSizes.sm, marginLeft: theme.spacing.md - 4 },
    inlineRow: { flexDirection: "row", alignItems: "center" },

    listContentContainer: { paddingBottom: theme.spacing.lg },
    emptyContainer: { paddingTop: theme.spacing.xl - 2 },

    card: {
      backgroundColor: theme.card,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.md - 2,
      borderWidth: 1,
      borderColor: theme.borderSoft,
    },
    row: { flexDirection: "row", gap: theme.spacing.sm + 4, alignItems: "center" },

    flexOne: { flex: 1 },
    name: { color: theme.text, fontSize: theme.fontSizes.base, fontWeight: theme.fontWeights.heavy },
    kindText: { marginTop: theme.spacing.xs, color: theme.textSoft, fontSize: theme.fontSizes.xs },
  });
}
