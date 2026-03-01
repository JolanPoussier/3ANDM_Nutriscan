import React, { useMemo, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";

import type { FavoritesStackParamList } from "../navigation/types";
import { useFavorites } from "../context/FavoritesContext";
import { useAppTheme } from "../context/ThemeContext";
import CategoryPickerModal from "../components/CategoryPickerModal";

type Props = NativeStackScreenProps<FavoritesStackParamList, "Favoris">;

function nutriColor(grade?: string) {
  const g = (grade ?? "").toLowerCase();
  if (g === "a") return "#1b9e3e";
  if (g === "b") return "#7cc043";
  if (g === "c") return "#f6c244";
  if (g === "d") return "#f08a2b";
  if (g === "e") return "#d64541";
  return "rgba(255,255,255,0.18)";
}

export default function FavoritesScreen({ navigation }: Props) {
  const { mode } = useAppTheme();
  const isDark = mode === "dark";
  const {
    categories,
    favorites,
    createCategory,
    deleteCategory,
    moveFavorite,
    removeFavorite,
  } =
    useFavorites();
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
      ]
    );
  }

  function toggleCategory(categoryId: string) {
    setCollapsedCategoryIds((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId]
    );
  }

  return (
    <>
      <ScrollView
        style={[styles.page, { backgroundColor: isDark ? "#0f172a" : "#f8fafc" }]}
        contentContainerStyle={styles.content}
      >
        <Text style={[styles.title, { color: isDark ? "#f8fafc" : "#0f172a" }]}>Favoris</Text>

        <View style={styles.addRow}>
          <TextInput
            value={newCategory}
            onChangeText={setNewCategory}
            onSubmitEditing={onAddCategory}
            returnKeyType="done"
            blurOnSubmit
            placeholder="Nouvelle catégorie"
            placeholderTextColor={isDark ? "#64748b" : "#94a3b8"}
            style={[
              styles.input,
              {
                backgroundColor: isDark ? "#1e293b" : "#ffffff",
                borderColor: isDark ? "#334155" : "#e2e8f0",
                color: isDark ? "#f8fafc" : "#0f172a",
              },
            ]}
          />
          <Pressable style={styles.addButton} onPress={onAddCategory}>
            <Text style={styles.addButtonText}>Ajouter</Text>
          </Pressable>
        </View>

        {favorites.length === 0 ? (
          <Text style={[styles.empty, { color: isDark ? "#94a3b8" : "#64748b" }]}>
            Aucun favori pour le moment.
          </Text>
        ) : null}

        {grouped.map(({ category, items }) => (
          <View
            key={category.id}
            style={[
              styles.section,
              {
                backgroundColor: isDark ? "#1e293b" : "#ffffff",
                borderColor: isDark ? "#334155" : "#e2e8f0",
              },
            ]}
          >
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: isDark ? "#f8fafc" : "#0f172a" }]}>{category.name}</Text>
              <View style={styles.sectionRight}>
                {category.id !== "default_uncategorized" ? (
                  <Pressable onPress={() => onDeleteCategory(category.id, category.name)} style={styles.iconAction}>
                    <Ionicons name="trash-outline" size={18} color="#ef4444" />
                  </Pressable>
                ) : null}
                <Text style={[styles.countText, { color: isDark ? "#cbd5e1" : "#475569" }]}>
                  {items.length}
                </Text>
                <Pressable onPress={() => toggleCategory(category.id)} style={styles.iconAction}>
                  <Ionicons
                    name={collapsedCategoryIds.includes(category.id) ? "chevron-down" : "chevron-up"}
                    size={20}
                    color={isDark ? "#cbd5e1" : "#475569"}
                  />
                </Pressable>
              </View>
            </View>

            {collapsedCategoryIds.includes(category.id) ? null : items.length === 0 ? (
              <Text style={[styles.muted, { color: isDark ? "#94a3b8" : "#64748b" }]}>
                Aucun produit dans cette catégorie.
              </Text>
            ) : (
              items.map((item) => (
                <Pressable
                  key={item.barcode}
                  onPress={() => navigation.navigate("ProductDetails", { barcode: item.barcode })}
                  style={[
                    styles.item,
                    {
                      backgroundColor: isDark ? "#0f172a" : "#f8fafc",
                      borderColor: isDark ? "#334155" : "#e2e8f0",
                    },
                  ]}
                >
                  {item.imageUrl ? (
                    <Image source={{ uri: item.imageUrl }} style={styles.image} />
                  ) : (
                    <View style={[styles.image, styles.imagePlaceholder]} />
                  )}

                  <View style={styles.itemBody}>
                    <Text style={[styles.itemName, { color: isDark ? "#f8fafc" : "#0f172a" }]} numberOfLines={2}>
                      {item.name}
                    </Text>
                    <Text
                      style={[styles.itemBrand, { color: isDark ? "#94a3b8" : "#64748b" }]}
                      numberOfLines={1}
                    >
                      {item.brand}
                    </Text>
                    <View style={styles.itemActions}>
                      <Pressable style={styles.smallButton} onPress={() => onMove(item.barcode)}>
                        <Text style={styles.smallButtonText}>Catégorie</Text>
                      </Pressable>
                      <Pressable style={styles.trashButton} onPress={() => removeFavorite(item.barcode)}>
                        <Ionicons name="trash-outline" size={16} color="#f87171" />
                      </Pressable>
                    </View>
                  </View>

                  <View style={[styles.nutri, { backgroundColor: nutriColor(item.nutriScore) }]}>
                    <Text style={styles.nutriText}>{item.nutriScore ?? "—"}</Text>
                  </View>
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

const styles = StyleSheet.create({
  page: { flex: 1 },
  content: { padding: 16, paddingBottom: 32, gap: 16 },
  title: { fontSize: 28, fontWeight: "900", letterSpacing: -0.5 },
  addRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  input: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    fontWeight: "600",
  },
  addButton: {
    backgroundColor: "#10b981",
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 14,
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  addButtonText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  empty: { textAlign: "center", marginTop: 8, fontSize: 15 },
  section: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  countText: { fontSize: 15, fontWeight: "800", minWidth: 20, textAlign: "right" },
  iconAction: { paddingHorizontal: 6, paddingVertical: 4 },
  sectionTitle: { fontSize: 18, fontWeight: "900", letterSpacing: -0.2 },
  muted: { fontSize: 14, fontWeight: "500" },
  item: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  image: { width: 64, height: 64, borderRadius: 12, backgroundColor: "rgba(0,0,0,0.05)" },
  imagePlaceholder: { backgroundColor: "rgba(0,0,0,0.05)" },
  itemBody: { flex: 1, gap: 4 },
  itemName: { fontWeight: "800", fontSize: 15 },
  itemBrand: { fontSize: 13, fontWeight: "500" },
  itemActions: { flexDirection: "row", gap: 10, marginTop: 6 },
  smallButton: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  smallButtonText: { color: "#10b981", fontSize: 12, fontWeight: "800" },
  trashButton: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  nutri: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  nutriText: { color: "#fff", fontWeight: "900", fontSize: 14 },
});
