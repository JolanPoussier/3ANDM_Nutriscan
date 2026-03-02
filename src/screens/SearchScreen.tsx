import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { useDebounce } from "../hooks/useDebounce";
import { OFFSearch } from "../utils/api";
import type { SearchStackParamList } from "../navigation/types";
import LoadingDots from "../components/LoadingDots";
import { useI18n } from "../context/I18nContext";

type Props = NativeStackScreenProps<SearchStackParamList, "Recherche">;

type SearchHit = {
  code?: string;
  id?: string;
  _id?: string;
  product_name?: string;
  product_name_en?: string;
  product_name_fr?: string;
  brands?: string;
  brands_tags?: string[];
  image_url?: string;
  image_front_url?: string;
  nutriscore_grade?: string;
  _source?: {
    code?: string;
    id?: string;
    _id?: string;
    product_name?: string;
    product_name_en?: string;
    product_name_fr?: string;
    brands?: string;
    brands_tags?: string[];
    image_url?: string;
    image_front_url?: string;
    nutriscore_grade?: string;
  };
};

type SearchResponse = {
  hits?: SearchHit[];
  products?: SearchHit[];
};

type SearchItem = {
  barcode: string;
  name: string;
  brand: string;
  imageUrl?: string;
  nutriScore?: string;
};
const PAGE_SIZE = 20;

function nutriColor(grade?: string) {
  const g = (grade ?? "").toLowerCase();
  if (g === "a") return "#1b9e3e";
  if (g === "b") return "#7cc043";
  if (g === "c") return "#f6c244";
  if (g === "d") return "#f08a2b";
  if (g === "e") return "#d64541";
  return "rgba(255,255,255,0.18)";
}

function asText(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) return String(value[0] ?? "").trim();
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function normalizeHit(
  hit: SearchHit,
  labels: { unknownBrand: string; unknownProduct: string }
): SearchItem | null {
  const source = hit._source ?? hit;
  const barcode = String(source.code ?? source.id ?? source._id ?? hit.code ?? hit.id ?? hit._id ?? "").trim();
  if (!barcode) return null;

  const rawBrand = asText(source.brands ?? hit.brands);
  const brandFromTags =
    source.brands_tags?.[0]?.replace(/^en:/, "").replace(/-/g, " ") ??
    hit.brands_tags?.[0]?.replace(/^en:/, "").replace(/-/g, " ");
  const brand = rawBrand || brandFromTags || labels.unknownBrand;

  return {
    barcode,
    name:
      asText(source.product_name ?? source.product_name_fr ?? source.product_name_en) ||
      labels.unknownProduct,
    brand,
    imageUrl: source.image_url ?? source.image_front_url ?? hit.image_url ?? hit.image_front_url,
    nutriScore: (source.nutriscore_grade ?? hit.nutriscore_grade)?.toUpperCase(),
  };
}

export default function SearchScreen({ navigation }: Props) {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query.trim(), 450);

  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SearchItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const lastEndReachedAt = useRef(0);

  async function fetchSearchPage(searchTerm: string, nextPage: number) {
    const data = await OFFSearch<SearchResponse>(searchTerm, {
      page: nextPage,
      size: PAGE_SIZE,
      sort_by: "unique_scans_n",
      fields: "code,product_name,product_name_en,brands,image_url,image_front_url,nutriscore_grade",
    });

    const source = data.hits ?? data.products ?? [];
    const mapped = source
      .map((hit) =>
        normalizeHit(hit, {
          unknownBrand: t("common.unknownBrand"),
          unknownProduct: t("common.unknownProduct"),
        })
      )
      .filter((item): item is SearchItem => item !== null);

    return { mapped, sourceLength: source.length };
  }

  useEffect(() => {
    let cancelled = false;

    async function runSearch() {
      if (!debouncedQuery) {
        setResults([]);
        setError(null);
        setLoading(false);
        setLoadingMore(false);
        setPage(1);
        setHasMore(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const { mapped, sourceLength } = await fetchSearchPage(debouncedQuery, 1);
        if (cancelled) return;

        setResults(mapped);
        setPage(1);
        setHasMore(mapped.length > 0);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : t("common.networkError"));
          setResults([]);
          setPage(1);
          setHasMore(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    runSearch();
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, t]);

  const emptyMessage = useMemo(() => {
    if (!debouncedQuery) return t("search.startHint");
    if (loading || loadingMore) return "";
    if (error) return error;
    return t("search.noResults");
  }, [debouncedQuery, error, loading, loadingMore, t]);

  async function loadMore() {
    if (!debouncedQuery || loading || loadingMore || !hasMore) return;

    setLoadingMore(true);
    setError(null);

    try {
      const nextPage = page + 1;
      const { mapped, sourceLength } = await fetchSearchPage(debouncedQuery, nextPage);

      setResults((prev) => {
        const seen = new Set(prev.map((item) => item.barcode));
        const deduped = mapped.filter((item) => !seen.has(item.barcode));
        return [...prev, ...deduped];
      });
      setPage(nextPage);
      setHasMore(sourceLength > 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("common.networkError"));
    } finally {
      setLoadingMore(false);
    }
  }

  function handleScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const distanceFromBottom = contentSize.height - (contentOffset.y + layoutMeasurement.height);
    if (distanceFromBottom < 120) {
      loadMore();
    }
  }

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>{t("search.title")}</Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t("search.inputPlaceholder")}
          placeholderTextColor="rgba(255,255,255,0.45)"
          autoCorrect={false}
          autoCapitalize="none"
          style={styles.input}
        />
      </View>

      {loading ? (
        <View style={styles.center}>
          <LoadingDots />
          <Text style={styles.muted}>{t("search.searching")}</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          contentContainerStyle={results.length === 0 ? styles.emptyList : styles.list}
          keyExtractor={(item) => item.barcode}
          onEndReached={() => {
            const now = Date.now();
            if (now - lastEndReachedAt.current < 600) return;
            lastEndReachedAt.current = now;
            loadMore();
          }}
          onEndReachedThreshold={0.2}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => navigation.navigate("ProductDetails", { barcode: item.barcode })}
              style={styles.item}
            >
              {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} style={styles.image} />
              ) : (
                <View style={[styles.image, styles.imagePlaceholder]}>
                  <Text style={styles.imagePlaceholderText}>No image</Text>
                </View>
              )}

              <View style={styles.itemContent}>
                <Text numberOfLines={2} style={styles.itemTitle}>
                  {item.name}
                </Text>
                <Text numberOfLines={1} style={styles.itemBrand}>
                  {item.brand}
                </Text>
              </View>

              <View style={[styles.badge, { backgroundColor: nutriColor(item.nutriScore) }]}>
                <Text style={styles.badgeText}>{item.nutriScore ?? "—"}</Text>
              </View>
            </Pressable>
          )}
          ListEmptyComponent={
            emptyMessage ? (
              <View style={styles.center}>
                <Text style={styles.muted}>{emptyMessage}</Text>
              </View>
            ) : null
          }
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footer}>
                <LoadingDots size={7} />
                <Text style={styles.muted}>{t("search.loadingMore")}</Text>
              </View>
            ) : hasMore && results.length > 0 ? (
              <View style={styles.footerIdle}>
                <LoadingDots size={6} color="rgba(255,255,255,0.45)" />
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#0b0b0c" },

  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 10, gap: 10 },
  title: { color: "#fff", fontSize: 22, fontWeight: "800" },
  input: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    color: "#fff",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },

  list: { paddingHorizontal: 12, paddingBottom: 20, gap: 10 },
  emptyList: { flexGrow: 1, paddingHorizontal: 18, paddingBottom: 20 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  footer: { alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14 },
  footerIdle: { alignItems: "center", justifyContent: "center", paddingVertical: 10 },
  muted: { color: "rgba(255,255,255,0.7)", textAlign: "center" },

  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  image: { width: 64, height: 64, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.06)" },
  imagePlaceholder: { alignItems: "center", justifyContent: "center" },
  imagePlaceholderText: { color: "rgba(255,255,255,0.5)", fontSize: 11 },

  itemContent: { flex: 1, gap: 4 },
  itemTitle: { color: "#fff", fontWeight: "700", fontSize: 14 },
  itemBrand: { color: "rgba(255,255,255,0.7)", fontSize: 13 },

  badge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { color: "#fff", fontWeight: "900", fontSize: 14 },
});
