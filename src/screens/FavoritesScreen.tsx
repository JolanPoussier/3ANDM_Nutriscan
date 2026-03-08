import React, { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";

import CategoryPickerModal from "../components/CategoryPickerModal";
import NutriScoreBadge from "../components/ui/NutriScoreBadge";
import ProductThumbnail from "../components/ui/ProductThumbnail";
import { useFavorites } from "../context/FavoritesContext";
import { useAppTheme } from "../context/ThemeContext";
import type { FavoritesStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<FavoritesStackParamList, "Favoris">;

export default function FavoritesScreen({ navigation }: Props) {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { categories, favorites, createCategory, deleteCategory, moveFavorite, removeFavorite } = useFavorites();

  const [newCategory, setNewCategory] = useState("");
  const [moveTargetBarcode, setMoveTargetBarcode] = useState<string | null>(null);
  const [collapsedCategoryIds, setCollapsedCategoryIds] = useState<string[]>([]);

  const grouped = useMemo(() => {
    const map = new Map(categories.map((cat) => [cat.id, [] as typeof favorites]));
    favorites.forEach((item) => {
      const list = map.get(item.categoryId);
      if (list) list.push(item);
    });
    return categories.map((cat) => ({ category: cat, items: map.get(cat.id) ?? [] }));
  }, [categories, favorites]);

  function onAddCategory() {
    const name = newCategory.trim();
    if (!name) return;
    createCategory(name);
    setNewCategory("");
  }

  function onDeleteCategory(id: string, name: string) {
    Alert.alert("Supprimer la catégorie", `Supprimer "${name}" ? Les produits seront déplacés vers "Sans catégorie".`, [
      { text: "Annuler", style: "cancel" },
      { text: "Supprimer", style: "destructive", onPress: () => deleteCategory(id) },
    ]);
  }

  function toggleCategory(categoryId: string) {
    setCollapsedCategoryIds((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId],
    );
  }

  return (
    <>
      <ScrollView style={styles.page} contentContainerStyle={styles.content}>
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
          <Pressable style={styles.addButton} onPress={onAddCategory}>
            <Text style={styles.addButtonText}>Ajouter</Text>
          </Pressable>
        </View>

        {favorites.length === 0 ? <Text style={styles.empty}>Aucun favori pour le moment.</Text> : null}

        {grouped.map(({ category, items }) => (
          <View key={category.id} style={[styles.section, theme.shadows.sm]}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{category.name}</Text>
              <View style={styles.sectionRight}>
                {category.id !== "default_uncategorized" ? (
                  <Pressable onPress={() => onDeleteCategory(category.id, category.name)} style={styles.iconAction}>
                    <Ionicons name="trash-outline" size={16} color={theme.error} />
                  </Pressable>
                ) : null}
                <Text style={styles.countText}>{items.length}</Text>
                <Pressable onPress={() => toggleCategory(category.id)} style={styles.iconAction}>
                  <Ionicons
                    name={collapsedCategoryIds.includes(category.id) ? "chevron-down" : "chevron-up"}
                    size={16}
                    color={theme.textMuted}
                  />
                </Pressable>
              </View>
            </View>

            {collapsedCategoryIds.includes(category.id) ? null : items.length === 0 ? (
              <Text style={styles.muted}>Aucun produit dans cette catégorie.</Text>
            ) : (
              items.map((item) => (
                <Pressable
                  key={item.barcode}
                  onPress={() => navigation.navigate("ProductDetails", { barcode: item.barcode })}
                  style={styles.item}
                >
                  <ProductThumbnail imageUrl={item.imageUrl} size={58} radius={theme.borderRadius.sm + 2} />

                  <View style={styles.itemBody}>
                    <Text style={styles.itemName} numberOfLines={2}>
                      {item.name}
                    </Text>
                    <Text style={styles.itemBrand} numberOfLines={1}>
                      {item.brand}
                    </Text>
                    <View style={styles.itemActions}>
                      <Pressable style={styles.smallButton} onPress={() => setMoveTargetBarcode(item.barcode)}>
                        <Text style={styles.smallButtonText}>Catégorie</Text>
                      </Pressable>
                      <Pressable style={styles.trashButton} onPress={() => removeFavorite(item.barcode)}>
                        <Ionicons name="trash-outline" size={16} color={theme.error} />
                      </Pressable>
                    </View>
                  </View>

                  <NutriScoreBadge grade={item.nutriScore} shape="circle" size={32} textSize={14} />
                </Pressable>
              ))
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
    content: { padding: theme.layout.screenPadding, paddingBottom: theme.spacing.xxl - 4, gap: theme.spacing.md },
    title: { fontSize: theme.fontSizes.xl, fontWeight: theme.fontWeights.extraBold, color: theme.text },

    addRow: { flexDirection: "row", alignItems: "center", gap: theme.spacing.sm },
    input: {
      flex: 1,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      paddingHorizontal: theme.spacing.sm + 4,
      paddingVertical: theme.spacing.sm + 2,
      fontSize: theme.fontSizes.base,
      backgroundColor: theme.card,
      borderColor: theme.border,
      color: theme.text,
    },
    addButton: {
      backgroundColor: theme.primary,
      borderRadius: theme.borderRadius.sm + 2,
      paddingHorizontal: theme.spacing.sm + 4,
      paddingVertical: theme.spacing.sm + 2,
    },
    addButtonText: { color: theme.textInverse, fontWeight: theme.fontWeights.bold },

    empty: { textAlign: "center", marginTop: theme.spacing.sm, color: theme.textMuted },

    section: {
      borderWidth: 1,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.sm + 2,
      gap: theme.spacing.sm,
      backgroundColor: theme.card,
      borderColor: theme.borderSoft,
    },
    sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    sectionRight: { flexDirection: "row", alignItems: "center", gap: theme.spacing.xs + 2 },
    countText: { fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.bold, minWidth: 20, textAlign: "right", color: theme.textMuted },
    iconAction: { paddingHorizontal: theme.spacing.xs, paddingVertical: 2 },
    sectionTitle: { fontSize: theme.fontSizes.mdPlus, fontWeight: theme.fontWeights.extraBold, color: theme.text },
    muted: { fontSize: theme.fontSizes.sm, color: theme.textMuted },

    item: {
      borderWidth: 1,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.sm,
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.sm + 2,
      backgroundColor: theme.cardSoft,
      borderColor: theme.borderSoft,
    },
    itemBody: { flex: 1, gap: 3 },
    itemName: { fontWeight: theme.fontWeights.bold, fontSize: theme.fontSizes.base, color: theme.text },
    itemBrand: { fontSize: theme.fontSizes.sm, color: theme.textMuted },
    itemActions: { flexDirection: "row", gap: theme.spacing.sm, marginTop: theme.spacing.xs },

    smallButton: {
      backgroundColor: theme.primarySoft,
      borderRadius: theme.borderRadius.sm,
      paddingVertical: 5,
      paddingHorizontal: theme.spacing.sm,
    },
    smallButtonText: { color: theme.primary, fontSize: theme.fontSizes.xs, fontWeight: theme.fontWeights.bold },
    trashButton: {
      backgroundColor: theme.errorSoft,
      borderRadius: theme.borderRadius.sm,
      paddingVertical: 5,
      paddingHorizontal: theme.spacing.sm + 2,
      alignItems: "center",
      justifyContent: "center",
    },
  });
}
