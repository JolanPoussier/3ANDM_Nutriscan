import React from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import type { FavoriteCategory } from "../context/FavoritesContext";

type Props = {
  visible: boolean;
  title: string;
  categories: FavoriteCategory[];
  currentCategoryId?: string;
  onSelect: (categoryId: string) => void;
  onClose: () => void;
};

export default function CategoryPickerModal({
  visible,
  title,
  categories,
  currentCategoryId,
  onSelect,
  onClose,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>

          <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
            {categories.map((category) => (
              <Pressable
                key={category.id}
                onPress={() => {
                  onSelect(category.id);
                  onClose();
                }}
                style={[
                  styles.option,
                  category.id === currentCategoryId ? styles.optionSelected : null,
                ]}
              >
                <Text style={styles.optionText}>{category.name}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <Pressable style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeText}>Fermer</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    maxHeight: "80%",
    borderRadius: 14,
    backgroundColor: "#101114",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    padding: 12,
    gap: 10,
  },
  title: { color: "#fff", fontSize: 16, fontWeight: "800" },
  list: { maxHeight: 320 },
  listContent: { gap: 8 },
  option: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  optionSelected: {
    borderColor: "rgba(59,130,246,0.7)",
    backgroundColor: "rgba(37,99,235,0.20)",
  },
  optionText: { color: "#fff", fontWeight: "700" },
  closeButton: {
    alignSelf: "flex-end",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  closeText: { color: "#93c5fd", fontWeight: "700" },
});
