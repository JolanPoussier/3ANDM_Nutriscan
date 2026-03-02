export type Diet =
  | "none"
  | "vegetarian"
  | "vegan"
  | "gluten_free"
  | "halal"
  | "kosher";

export type Language = "fr" | "en";

export type AllergenKey =
  | "gluten"
  | "milk"
  | "eggs"
  | "peanuts"
  | "nuts"
  | "soy"
  | "fish"
  | "crustaceans"
  | "sesame"
  | "sulphites"
  | "celery"
  | "mustard"
  | "lupin";

export type Preferences = {
  avoidAllergens: AllergenKey[];
  diet: Diet;
  language: Language;
};

export const DEFAULT_PREFERENCES: Preferences = {
  avoidAllergens: [],
  diet: "none",
  language: "fr",
};

export const ALLERGENS: Array<{ key: AllergenKey; label: string }> = [
  { key: "gluten", label: "Gluten" },
  { key: "milk", label: "Lait" },
  { key: "eggs", label: "Œufs" },
  { key: "peanuts", label: "Arachides" },
  { key: "nuts", label: "Fruits à coque" },
  { key: "soy", label: "Soja" },
  { key: "fish", label: "Poisson" },
  { key: "crustaceans", label: "Crustacés" },
  { key: "sesame", label: "Sésame" },
  { key: "sulphites", label: "Sulfites" },
  { key: "celery", label: "Céleri" },
  { key: "mustard", label: "Moutarde" },
  { key: "lupin", label: "Lupin" },
];

export const DIETS: Array<{ key: Diet; label: string }> = [
  { key: "none", label: "Aucun" },
  { key: "vegetarian", label: "Végétarien" },
  { key: "vegan", label: "Végan" },
  { key: "gluten_free", label: "Sans gluten" },
  { key: "halal", label: "Halal" },
  { key: "kosher", label: "Casher" },
];
