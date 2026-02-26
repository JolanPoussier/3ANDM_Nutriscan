import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type FavoriteCategory = {
  id: string;
  name: string;
  isDefault: boolean;
};

export type FavoriteItem = {
  barcode: string;
  name: string;
  brand: string;
  imageUrl?: string;
  nutriScore?: string;
  categoryId: string;
  addedAt: number;
};

type FavoritesState = {
  categories: FavoriteCategory[];
  favorites: FavoriteItem[];
};

type AddFavoriteInput = {
  barcode: string;
  name: string;
  brand: string;
  imageUrl?: string;
  nutriScore?: string;
};

type FavoritesContextValue = {
  categories: FavoriteCategory[];
  favorites: FavoriteItem[];
  addOrUpdateFavorite: (input: AddFavoriteInput, categoryId: string) => void;
  removeFavorite: (barcode: string) => void;
  moveFavorite: (barcode: string, categoryId: string) => void;
  clearFavoriteCategory: (barcode: string) => void;
  createCategory: (name: string) => void;
  deleteCategory: (id: string) => void;
  getFavorite: (barcode?: string) => FavoriteItem | undefined;
  isFavorite: (barcode?: string) => boolean;
};

const STORAGE_KEY = "nutriscan_favorites_v1";
const UNCATEGORIZED_ID = "default_uncategorized";
const DEFAULT_CATEGORIES: FavoriteCategory[] = [
  { id: UNCATEGORIZED_ID, name: "Sans catégorie", isDefault: true },
  { id: "default_breakfast", name: "Petit-déjeuner", isDefault: true },
  { id: "default_healthy_snacks", name: "Snacks sains", isDefault: true },
  { id: "default_avoid", name: "À éviter", isDefault: true },
];

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

function normalizeState(raw?: Partial<FavoritesState>): FavoritesState {
  const rawCategories = Array.isArray(raw?.categories) ? raw?.categories : [];
  const rawFavorites = Array.isArray(raw?.favorites) ? raw?.favorites : [];

  const mergedCategories = [...DEFAULT_CATEGORIES];
  rawCategories.forEach((cat) => {
    if (!cat || !cat.id || !cat.name) return;
    if (mergedCategories.some((existing) => existing.id === cat.id)) return;
    mergedCategories.push({
      id: String(cat.id),
      name: String(cat.name),
      isDefault: false,
    });
  });

  const validCategoryIds = new Set(mergedCategories.map((cat) => cat.id));
  const favorites: FavoriteItem[] = rawFavorites
    .map((item) => ({
      barcode: String(item?.barcode ?? "").trim(),
      name: String(item?.name ?? "Produit sans nom").trim() || "Produit sans nom",
      brand: String(item?.brand ?? "Marque inconnue").trim() || "Marque inconnue",
      imageUrl: item?.imageUrl ? String(item.imageUrl) : undefined,
      nutriScore: item?.nutriScore ? String(item.nutriScore) : undefined,
      categoryId: validCategoryIds.has(String(item?.categoryId)) ? String(item?.categoryId) : UNCATEGORIZED_ID,
      addedAt: Number(item?.addedAt) || Date.now(),
    }))
    .filter((item) => item.barcode.length > 0);

  return { categories: mergedCategories, favorites };
}

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<FavoritesState>(() => normalizeState());

  useEffect(() => {
    let active = true;

    AsyncStorage.getItem(STORAGE_KEY)
      .then((json) => {
        if (!active || !json) return;
        const parsed = JSON.parse(json) as Partial<FavoritesState>;
        setState(normalizeState(parsed));
      })
      .catch(() => {
        // keep default state
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {
      // ignore persist errors
    });
  }, [state]);

  const value = useMemo<FavoritesContextValue>(() => {
    function addOrUpdateFavorite(input: AddFavoriteInput, categoryId: string) {
      const barcode = String(input.barcode ?? "").trim();
      if (!barcode) return;

      setState((prev) => {
        const existsCategory = prev.categories.some((cat) => cat.id === categoryId);
        const targetCategoryId = existsCategory ? categoryId : UNCATEGORIZED_ID;
        const index = prev.favorites.findIndex((item) => item.barcode === barcode);
        const nextItem: FavoriteItem = {
          barcode,
          name: input.name?.trim() || "Produit sans nom",
          brand: input.brand?.trim() || "Marque inconnue",
          imageUrl: input.imageUrl,
          nutriScore: input.nutriScore,
          categoryId: targetCategoryId,
          addedAt: index >= 0 ? prev.favorites[index].addedAt : Date.now(),
        };

        if (index < 0) {
          return { ...prev, favorites: [nextItem, ...prev.favorites] };
        }

        const nextFavorites = [...prev.favorites];
        nextFavorites[index] = nextItem;
        return { ...prev, favorites: nextFavorites };
      });
    }

    function removeFavorite(barcode: string) {
      setState((prev) => ({
        ...prev,
        favorites: prev.favorites.filter((item) => item.barcode !== barcode),
      }));
    }

    function moveFavorite(barcode: string, categoryId: string) {
      setState((prev) => {
        if (!prev.categories.some((cat) => cat.id === categoryId)) return prev;
        return {
          ...prev,
          favorites: prev.favorites.map((item) =>
            item.barcode === barcode ? { ...item, categoryId } : item
          ),
        };
      });
    }

    function clearFavoriteCategory(barcode: string) {
      moveFavorite(barcode, UNCATEGORIZED_ID);
    }

    function createCategory(name: string) {
      const cleaned = name.trim();
      if (!cleaned) return;

      setState((prev) => {
        const exists = prev.categories.some(
          (cat) => cat.name.toLowerCase() === cleaned.toLowerCase()
        );
        if (exists) return prev;

        return {
          ...prev,
          categories: [
            ...prev.categories,
            {
              id: `custom_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
              name: cleaned,
              isDefault: false,
            },
          ],
        };
      });
    }

    function deleteCategory(id: string) {
      setState((prev) => {
        const target = prev.categories.find((cat) => cat.id === id);
        if (!target || target.id === UNCATEGORIZED_ID) return prev;

        return {
          categories: prev.categories.filter((cat) => cat.id !== id),
          favorites: prev.favorites.map((item) =>
            item.categoryId === id ? { ...item, categoryId: UNCATEGORIZED_ID } : item
          ),
        };
      });
    }

    function getFavorite(barcode?: string) {
      if (!barcode) return undefined;
      return state.favorites.find((item) => item.barcode === barcode);
    }

    function isFavorite(barcode?: string) {
      return Boolean(getFavorite(barcode));
    }

    return {
      categories: state.categories,
      favorites: state.favorites,
      addOrUpdateFavorite,
      removeFavorite,
      moveFavorite,
      clearFavoriteCategory,
      createCategory,
      deleteCategory,
      getFavorite,
      isFavorite,
    };
  }, [state]);

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used within FavoritesProvider");
  return ctx;
}
