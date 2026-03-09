import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import AppButton from "../components/ui/AppButton";
import IconButton from "../components/ui/IconButton";
import NutriBadge from "../components/ui/NutriBadge";
import ProductThumbnail from "../components/ui/ProductThumbnail";
import type { FavoritesStackParamList } from "../navigation/types";
import { useFavorites } from "../context/FavoritesContext";
import { useAppTheme } from "../context/ThemeContext";
import CategoryPickerModal from "../components/CategoryPickerModal";
import { OFFFetch } from "../utils/api";
import type { OFFProductResponse } from "../types/off";
import { resolveProductImageUrl } from "../utils/productImage";

type Props = NativeStackScreenProps<FavoritesStackParamList, "Favoris">;

export default function FavoritesScreen({ navigation }: Props) {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const {
    categories,
    favorites,
    createCategory,
    deleteCategory,
    moveFavorite,
    removeFavorite,
  } = useFavorites();

  const [newCategory, setNewCategory] = useState("");
  const [moveTargetBarcode, setMoveTargetBarcode] = useState<string | null>(null);
  const [collapsedCategoryIds, setCollapsedCategoryIds] = useState<string[]>([]);
  const [resolvedImages, setResolvedImages] = useState<Record<string, string>>({});

  const grouped = useMemo(() => {
    const map = new Map(categories.map((cat) => [cat.id, [] as typeof favorites]));
    favorites.forEach((item) => {
      const list = map.get(item.categoryId);
      if (list) list.push(item);
    });
    return categories.map((cat) => ({ category: cat, items: map.get(cat.id) ?? [] }));
  }, [categories, favorites]);

  useEffect(() => {
    const missing = favorites
      .filter((item) => !item.imageUrl && !resolvedImages[item.barcode])
      .map((item) => item.barcode);
    if (missing.length === 0) return;

    let cancelled = false;

    async function hydrateImages() {
      const entries = await Promise.all(
        missing.map(async (barcode) => {
          try {
            const data = await OFFFetch<OFFProductResponse>(`product/${barcode}`);
            const url = resolveProductImageUrl(data?.product);
            return url ? ([barcode, url] as const) : null;
          } catch {
            return null;
          }
        }),
      );

      if (cancelled) return;
      const next = entries.filter((e): e is readonly [string, string] => Boolean(e));
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
  }, [favorites, resolvedImages]);

  function onAddCategory() {
    const name = newCategory.trim();
    if (!name) return;
    createCategory(name);
    setNewCategory("");
  }

  function onMove(barcode: string) {
    setMoveTargetBarcode(barcode);
  }

  function onDeleteCategory(id: string, name: string) {
    Alert.alert(
      "Supprimer la catégorie",
      `Supprimer "${name}" ? Les produits seront déplacés vers "Sans catégorie".`,
      [
        { text: "Annuler", style: "cancel" },
        { text: "Supprimer", style: "destructive", onPress: () => deleteCategory(id) },
      ],
    );
  }

  function toggleCategory(categoryId: string) {
    setCollapsedCategoryIds((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId],
    );
  }

  return (
    <>
      <ScrollView style={styles.page} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.title}>Favoris</Text>

        <View style={styles.addRow}>
          <TextInput
            value={newCategory}
            onChangeText={setNewCategory}
            onSubmitEditing={onAddCategory}
            returnKeyType="done"
            blurOnSubmit
            placeholder="Nouvelle catégorie"
            placeholderTextColor={theme.textMuted}
            style={styles.input}
          />
          <AppButton label="Ajouter" onPress={onAddCategory} style={styles.addButton} textStyle={styles.addButtonText} />
        </View>

        {favorites.length === 0 ? <Text style={styles.empty}>Aucun favori pour le moment.</Text> : null}

        {grouped.map(({ category, items }) => (
          <View key={category.id} style={[styles.section, theme.shadows.sm]}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{category.name}</Text>
              <View style={styles.sectionRight}>
                {category.id !== "default_uncategorized" ? (
                  <IconButton
                    iconName="trash-outline"
                    size={18}
                    color={theme.error}
                    onPress={() => onDeleteCategory(category.id, category.name)}
                    style={styles.iconAction}
                    accessibilityLabel="Supprimer la catégorie"
                  />
                ) : null}
                <Text style={styles.countText}>{items.length}</Text>
                <IconButton
                  iconName={collapsedCategoryIds.includes(category.id) ? "chevron-down" : "chevron-up"}
                  size={20}
                  color={theme.textMuted}
                  onPress={() => toggleCategory(category.id)}
                  style={styles.iconAction}
                  accessibilityLabel="Afficher ou masquer la catégorie"
                />
              </View>
            </View>

            {collapsedCategoryIds.includes(category.id) ? null : items.length === 0 ? (
              <Text style={styles.muted}>Aucun produit dans cette catégorie.</Text>
            ) : (
              items.map((item) => {
                const imageUrl = item.imageUrl || resolvedImages[item.barcode];
                return (
                  <Pressable
                    key={item.barcode}
                    onPress={() => navigation.navigate("ProductDetails", { barcode: item.barcode })}
                    style={styles.item}
                  >
                    <ProductThumbnail imageUrl={imageUrl} size={64} borderRadius={theme.borderRadius.md} />

                    <View style={styles.itemBody}>
                      <Text style={styles.itemName} numberOfLines={2}>
                        {item.name}
                      </Text>
                      <Text style={styles.itemBrand} numberOfLines={1}>
                        {item.brand}
                      </Text>
                      <View style={styles.itemActions}>
                        <IconButton
                          iconName="folder-open-outline"
                          size={14}
                          color={theme.primary}
                          onPress={() => onMove(item.barcode)}
                          style={styles.smallButton}
                          accessibilityLabel="Déplacer le favori"
                        />
                        <IconButton
                          iconName="trash-outline"
                          size={16}
                          color={theme.error}
                          onPress={() => removeFavorite(item.barcode)}
                          style={styles.trashButton}
                          accessibilityLabel="Supprimer le favori"
                        />
                      </View>
                    </View>

                  <NutriBadge grade={item.nutriScore} size={36} textSize={13} />
                  </Pressable>
                );
              })
            )}
          </View>
        ))}
      </ScrollView>
      <CategoryPickerModal
        visible={Boolean(moveTargetBarcode)}
        title="Déplacer vers une catégorie"
        categories={categories}
        currentCategoryId={favorites.find((item) => item.barcode === moveTargetBarcode)?.categoryId}
        onClose={() => setMoveTargetBarcode(null)}
        onSelect={(categoryId) => {
          if (!moveTargetBarcode) return;
          moveFavorite(moveTargetBarcode, categoryId);
        }}
      />
    </>
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
    title: {
      color: theme.text,
      fontSize: theme.fontSizes.xxxl,
      fontWeight: theme.fontWeights.heavy,
      letterSpacing: -0.5,
    },
    addRow: { flexDirection: "row", alignItems: "center", gap: theme.spacing.md },
    input: {
      flex: 1,
      backgroundColor: theme.card,
      borderColor: theme.border,
      color: theme.text,
      borderRadius: theme.borderRadius.lg,
      borderWidth: 1,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: theme.fontSizes.md,
      fontWeight: theme.fontWeights.semiBold,
    },
    addButton: {
      backgroundColor: theme.primary,
      borderRadius: theme.borderRadius.lg,
      paddingHorizontal: 20,
      paddingVertical: 14,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
      elevation: 4,
    },
    addButtonText: {
      color: theme.textInverse,
      fontWeight: theme.fontWeights.extraBold,
      fontSize: theme.fontSizes.lg,
    },
    empty: { color: theme.textMuted, textAlign: "center", marginTop: 8, fontSize: theme.fontSizes.md },

    section: {
      backgroundColor: theme.card,
      borderColor: theme.border,
      borderWidth: 1,
      borderRadius: theme.borderRadius.xl,
      padding: theme.spacing.lg,
      gap: theme.spacing.md,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05,
      shadowRadius: 10,
      elevation: 2,
    },
    sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    sectionRight: { flexDirection: "row", alignItems: "center", gap: theme.spacing.sm },
    countText: {
      color: theme.textMuted,
      fontSize: theme.fontSizes.md,
      fontWeight: theme.fontWeights.extraBold,
      minWidth: 20,
      textAlign: "right",
    },
    iconAction: { paddingHorizontal: 6, paddingVertical: 4 },
    sectionTitle: {
      color: theme.text,
      fontSize: theme.fontSizes.lg,
      fontWeight: theme.fontWeights.heavy,
      letterSpacing: -0.2,
    },
    muted: { color: theme.textMuted, fontSize: theme.fontSizes.base, fontWeight: theme.fontWeights.medium },

    item: {
      backgroundColor: theme.background,
      borderColor: theme.border,
      borderRadius: theme.borderRadius.lg,
      borderWidth: 1,
      padding: theme.spacing.md,
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.md,
    },
    itemBody: { flex: 1, gap: theme.spacing.xs },
    itemName: {
      color: theme.text,
      fontWeight: theme.fontWeights.extraBold,
      fontSize: theme.fontSizes.md,
    },
    itemBrand: {
      color: theme.textMuted,
      fontSize: theme.fontSizes.sm,
      fontWeight: theme.fontWeights.medium,
    },
    itemActions: {
      flexDirection: "row",
      gap: theme.spacing.sm,
      marginTop: theme.spacing.xs,
    },
    smallButton: {
      backgroundColor: theme.primarySoft,
      borderRadius: theme.borderRadius.sm,
      paddingVertical: 6,
      paddingHorizontal: 12,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    trashButton: {
      backgroundColor: theme.errorSoft,
      borderRadius: theme.borderRadius.sm,
      paddingVertical: 6,
      paddingHorizontal: 10,
      alignItems: "center",
      justifyContent: "center",
    },
  });
}
