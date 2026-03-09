import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import LoadingDots from "../components/LoadingDots";
import { useI18n } from "../context/I18nContext";
import { useAppTheme } from "../context/ThemeContext";
import { useDebounce } from "../hooks/useDebounce";
import type { SearchStackParamList } from "../navigation/types";
import { OFFSearch } from "../utils/api";
import { getNutriColor } from "../utils/nutriColor";
import { normalizeNutriGrade } from "../utils/nutriScore";
import { normalizeImageUrl } from "../utils/productImage";

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
  image_front_small_url?: string;
  image_small_url?: string;
  image_thumb_url?: string;
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
    image_front_small_url?: string;
    image_small_url?: string;
    image_thumb_url?: string;
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
const MIN_QUERY_LENGTH = 3;

function asText(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) return String(value[0] ?? "").trim();
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function normalizeHit(
  hit: SearchHit,
  labels: { unknownBrand: string; unknownProduct: string },
): SearchItem | null {
  const source = hit._source ?? hit;
  const barcode = String(
    source.code ?? source.id ?? source._id ?? hit.code ?? hit.id ?? hit._id ?? "",
  ).trim();
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
    imageUrl: normalizeImageUrl(
      source.image_url ||
      source.image_front_url ||
      source.image_front_small_url ||
      source.image_small_url ||
      source.image_thumb_url ||
      hit.image_url ||
      hit.image_front_url ||
      hit.image_front_small_url ||
      hit.image_small_url ||
      hit.image_thumb_url,
    ),
    nutriScore: normalizeNutriGrade(source.nutriscore_grade ?? hit.nutriscore_grade) ?? undefined,
  };
}

export default function SearchScreen({ navigation }: Props) {
  const { t } = useI18n();
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query.trim(), 450);

  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SearchItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const lastEndReachedAt = useRef(0);
  const canSearch = debouncedQuery.length >= MIN_QUERY_LENGTH;

  const nutriBadgeStyle = useMemo(
    () => (nutri?: string) => ({ backgroundColor: getNutriColor(theme, nutri) }),
    [theme],
  );

  async function fetchSearchPage(searchTerm: string, nextPage: number) {
    const data = await OFFSearch<SearchResponse>(searchTerm, {
      page: nextPage,
      size: PAGE_SIZE,
      sort_by: "unique_scans_n",
      fields: "code,product_name,product_name_en,brands,image_url,image_front_url,image_front_small_url,image_small_url,image_thumb_url,nutriscore_grade",
    });

    const source = data.hits ?? data.products ?? [];
    const mapped = source
      .map((hit) =>
        normalizeHit(hit, {
          unknownBrand: t("common.unknownBrand"),
          unknownProduct: t("common.unknownProduct"),
        }),
      )
      .filter((item): item is SearchItem => item !== null);
    return { mapped, sourceLength: source.length };
  }

  useEffect(() => {
    let cancelled = false;

    async function runSearch() {
      if (!canSearch) {
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
        setHasMore(sourceLength === PAGE_SIZE);
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
  }, [canSearch, debouncedQuery, t]);

  const emptyMessage = useMemo(() => {
    if (!canSearch) return t("search.startHint");
    if (loading || loadingMore) return "";
    if (error) return error;
    return t("search.noResults");
  }, [canSearch, error, loading, loadingMore, t]);

  async function loadMore() {
    if (!canSearch || loading || loadingMore || !hasMore) return;

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
      setHasMore(sourceLength === PAGE_SIZE);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("common.networkError"));
    } finally {
      setLoadingMore(false);
    }
  }

  const listContentStyle = results.length === 0 ? styles.emptyList : styles.list;

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>{t("search.title")}</Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t("search.inputPlaceholder")}
          placeholderTextColor={theme.textMuted}
          autoCorrect={false}
          autoCapitalize="none"
          style={[styles.input, theme.shadows.sm]}
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
          contentContainerStyle={listContentStyle}
          keyExtractor={(item) => item.barcode}
          onEndReached={() => {
            const now = Date.now();
            if (now - lastEndReachedAt.current < 600) return;
            lastEndReachedAt.current = now;
            loadMore();
          }}
          onEndReachedThreshold={0.2}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => navigation.navigate("ProductDetails", { barcode: item.barcode })}
              style={[styles.item, theme.shadows.sm]}
            >
              <View style={styles.image}>
                {item.imageUrl ? (
                  <Image source={{ uri: item.imageUrl }} style={styles.image} />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Ionicons name="fast-food-outline" size={28} color={theme.textMuted} />
                  </View>
                )}
              </View>

              <View style={styles.itemContent}>
                <Text numberOfLines={2} style={styles.itemTitle}>
                  {item.name}
                </Text>
                <Text numberOfLines={1} style={styles.itemBrand}>
                  {item.brand}
                </Text>
              </View>

              <View style={[styles.badge, nutriBadgeStyle(item.nutriScore)]}>
                {item.nutriScore ? (
                  <Text style={styles.badgeText}>{item.nutriScore}</Text>
                ) : (
                  <Text style={styles.badgeText}>—</Text>
                )}
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
                <LoadingDots size={6} color={theme.badgeMuted} />
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useAppTheme>["theme"]) {
  return StyleSheet.create({
    page: { flex: 1, backgroundColor: theme.background },
    header: {
      paddingHorizontal: theme.layout.screenPadding,
      paddingTop: theme.layout.screenPadding,
      paddingBottom: 10,
      gap: 10,
    },
    title: {
      color: theme.text,
      fontSize: theme.fontSizes.xxl,
      fontWeight: theme.fontWeights.heavy,
      letterSpacing: -0.5,
    },
    input: {
      backgroundColor: theme.card,
      borderColor: theme.border,
      color: theme.text,
      borderRadius: theme.borderRadius.lg,
      borderWidth: 1,
      paddingHorizontal: theme.layout.screenPadding,
      paddingVertical: 14,
      fontSize: theme.fontSizes.md,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 2,
    },

    list: { paddingHorizontal: 14, paddingBottom: 24, gap: 12 },
    emptyList: { flexGrow: 1, paddingHorizontal: 18, paddingBottom: 20 },
    center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
    footer: { alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14 },
    footerIdle: { alignItems: "center", justifyContent: "center", paddingVertical: 10 },
    muted: { textAlign: "center", color: theme.textMuted, fontSize: theme.fontSizes.md },

    item: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      backgroundColor: theme.card,
      borderColor: theme.border,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.md,
      borderWidth: 1,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 2,
    },
    image: {
      width: 68,
      height: 68,
      borderRadius: theme.borderRadius.md,
      backgroundColor: theme.imagePlaceholder,
    },
    imagePlaceholder: {
      width: "100%",
      height: "100%",
      alignItems: "center",
      justifyContent: "center",
    },

    itemContent: { flex: 1, gap: theme.spacing.xs },
    itemTitle: {
      color: theme.text,
      fontWeight: theme.fontWeights.extraBold,
      fontSize: theme.fontSizes.lg,
    },
    itemBrand: {
      color: theme.textMuted,
      fontSize: theme.fontSizes.sm,
    },

    badge: {
      width: 34,
      height: 34,
      borderRadius: theme.borderRadius.pill,
      alignItems: "center",
      justifyContent: "center",
    },
    badgeText: {
      color: theme.textInverse,
      fontSize: theme.fontSizes.xs,
      fontWeight: theme.fontWeights.heavy,
      textTransform: "uppercase",
    },
  });
}
