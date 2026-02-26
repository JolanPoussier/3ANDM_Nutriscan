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
        style={[styles.page, { backgroundColor: isDark ? "#0b0b0c" : "#f7f7f8" }]}
        contentContainerStyle={styles.content}
      >
        <Text style={[styles.title, { color: isDark ? "#fff" : "#101114" }]}>Favoris</Text>

        <View style={styles.addRow}>
          <TextInput
            value={newCategory}
            onChangeText={setNewCategory}
            onSubmitEditing={onAddCategory}
            returnKeyType="done"
            blurOnSubmit
            placeholder="Nouvelle catégorie"
            placeholderTextColor={isDark ? "rgba(255,255,255,0.45)" : "rgba(16,17,20,0.45)"}
            style={[
              styles.input,
              {
                backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "#fff",
                borderColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(16,17,20,0.12)",
                color: isDark ? "#fff" : "#101114",
              },
            ]}
          />
          <Pressable style={styles.addButton} onPress={onAddCategory}>
            <Text style={styles.addButtonText}>Ajouter</Text>
          </Pressable>
        </View>

        {favorites.length === 0 ? (
          <Text style={[styles.empty, { color: isDark ? "rgba(255,255,255,0.7)" : "rgba(16,17,20,0.6)" }]}>
            Aucun favori pour le moment.
          </Text>
        ) : null}

        {grouped.map(({ category, items }) => (
          <View
            key={category.id}
            style={[
              styles.section,
              {
                backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "#fff",
                borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(16,17,20,0.10)",
              },
            ]}
          >
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: isDark ? "#fff" : "#101114" }]}>{category.name}</Text>
              <View style={styles.sectionRight}>
                <Text style={[styles.countText, { color: isDark ? "rgba(255,255,255,0.75)" : "rgba(16,17,20,0.7)" }]}>
                  {items.length}
                </Text>
                <Pressable onPress={() => toggleCategory(category.id)} style={styles.iconAction}>
                  <Ionicons
                    name={collapsedCategoryIds.includes(category.id) ? "chevron-down" : "chevron-up"}
                    size={16}
                    color={isDark ? "rgba(255,255,255,0.8)" : "rgba(16,17,20,0.8)"}
                  />
                </Pressable>
                {category.id !== "default_uncategorized" ? (
                  <Pressable onPress={() => onDeleteCategory(category.id, category.name)} style={styles.iconAction}>
                    <Text style={styles.deleteText}>Supprimer</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>

            {collapsedCategoryIds.includes(category.id) ? null : items.length === 0 ? (
              <Text style={[styles.muted, { color: isDark ? "rgba(255,255,255,0.65)" : "rgba(16,17,20,0.5)" }]}>
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
                      backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#f4f5f7",
                      borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(16,17,20,0.08)",
                    },
                  ]}
                >
                  {item.imageUrl ? (
                    <Image source={{ uri: item.imageUrl }} style={styles.image} />
                  ) : (
                    <View style={[styles.image, styles.imagePlaceholder]} />
                  )}

                  <View style={styles.itemBody}>
                    <Text style={[styles.itemName, { color: isDark ? "#fff" : "#101114" }]} numberOfLines={2}>
                      {item.name}
                    </Text>
                    <Text
                      style={[styles.itemBrand, { color: isDark ? "rgba(255,255,255,0.7)" : "rgba(16,17,20,0.65)" }]}
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
  content: { padding: 14, paddingBottom: 28, gap: 12 },
  title: { fontSize: 24, fontWeight: "800" },
  addRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  input: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  addButton: {
    backgroundColor: "#2563eb",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  addButtonText: { color: "#fff", fontWeight: "700" },
  empty: { textAlign: "center", marginTop: 8 },
  section: { borderWidth: 1, borderRadius: 14, padding: 10, gap: 8 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  countText: { fontSize: 13, fontWeight: "700", minWidth: 20, textAlign: "right" },
  iconAction: { paddingHorizontal: 4, paddingVertical: 2 },
  sectionTitle: { fontSize: 16, fontWeight: "800" },
  deleteText: { color: "#ef4444", fontWeight: "700", fontSize: 13 },
  muted: { fontSize: 13 },
  item: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  image: { width: 58, height: 58, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.08)" },
  imagePlaceholder: { backgroundColor: "rgba(255,255,255,0.08)" },
  itemBody: { flex: 1, gap: 3 },
  itemName: { fontWeight: "700", fontSize: 14 },
  itemBrand: { fontSize: 13 },
  itemActions: { flexDirection: "row", gap: 8, marginTop: 4 },
  smallButton: {
    backgroundColor: "rgba(37,99,235,0.18)",
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  smallButtonText: { color: "#93c5fd", fontSize: 12, fontWeight: "700" },
  trashButton: {
    backgroundColor: "rgba(239,68,68,0.2)",
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  nutri: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  nutriText: { color: "#fff", fontWeight: "900", fontSize: 14 },
});
