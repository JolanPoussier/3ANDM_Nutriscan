import React, { useMemo } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import type { FavoriteCategory } from "../context/FavoritesContext";
import { useAppTheme } from "../context/ThemeContext";

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
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
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

function createStyles(theme: ReturnType<typeof useAppTheme>["theme"]) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.overlaySoft,
      padding: theme.spacing.lg,
    },
    card: {
      width: "100%",
      maxWidth: 420,
      maxHeight: "80%",
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: theme.borderRadius.lg,
      backgroundColor: theme.cardContrast,
      padding: theme.spacing.md,
      gap: theme.spacing.sm,
    },
    title: {
      color: theme.textInverse,
      fontSize: theme.fontSizes.mdPlus,
      fontWeight: theme.fontWeights.extraBold,
    },
    list: { maxHeight: 320 },
    listContent: { gap: theme.spacing.sm },
    option: {
      borderWidth: 1,
      borderColor: theme.borderSoft,
      backgroundColor: theme.neutralSoft,
      borderRadius: theme.borderRadius.md,
      paddingVertical: theme.spacing.sm + 2,
      paddingHorizontal: theme.spacing.sm + 2,
    },
    optionSelected: {
      borderColor: theme.primary,
      backgroundColor: theme.primarySoft,
    },
    optionText: {
      color: theme.textInverse,
      fontWeight: theme.fontWeights.bold,
    },
    closeButton: {
      alignSelf: "flex-end",
      paddingHorizontal: theme.spacing.sm + 2,
      paddingVertical: theme.spacing.sm,
    },
    closeText: {
      color: theme.primary,
      fontWeight: theme.fontWeights.bold,
    },
  });
}
