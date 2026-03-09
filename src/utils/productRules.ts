import type { OFFProduct } from "../types/off";
import type { Preferences, AllergenKey, Diet } from "../types/preferences";

const ALLERGEN_TAGS: Record<AllergenKey, string[]> = {
  gluten: ["en:gluten"],
  milk: ["en:milk"],
  eggs: ["en:eggs"],
  peanuts: ["en:peanuts"],
  nuts: ["en:nuts"],
  soy: ["en:soybeans", "en:soy"],
  fish: ["en:fish"],
  crustaceans: ["en:crustaceans"],
  sesame: ["en:sesame-seeds", "en:sesame"],
  sulphites: ["en:sulphur-dioxide-and-sulphites", "en:sulphites"],
  celery: ["en:celery"],
  mustard: ["en:mustard"],
  lupin: ["en:lupin"],
};

function setFrom(arr?: string[]) {
  return new Set((arr ?? []).map((x) => x.toLowerCase()));
}

export function detectAllergens(product: OFFProduct, prefs: Preferences): AllergenKey[] {
  const tags = setFrom(product.allergens_tags);
  return prefs.avoidAllergens.filter((a) => {
    const candidates = ALLERGEN_TAGS[a] ?? [];
    return candidates.some((t) => tags.has(t));
  });
}

export type DietCheck =
  | { ok: true }
  | { ok: false; reason: string }
  | { ok: "unknown"; reason: string };

export function checkDiet(product: OFFProduct, diet: Diet): DietCheck {
  if (diet === "none") return { ok: true };

  const labels = setFrom(product.labels_tags);
  const misc = setFrom(product.misc_tags);
  const ingredients = (product.ingredients_text ?? "").toLowerCase();

  const has = (tag: string) => labels.has(tag) || misc.has(tag);

  if (diet === "vegan") {
    if (has("en:vegan")) return { ok: true };
    if (has("en:non-vegan")) return { ok: false, reason: "Produit non végan (tag OFF)." };
    return { ok: "unknown", reason: "Statut végan non renseigné." };
  }

  if (diet === "vegetarian") {
    if (has("en:vegetarian")) return { ok: true };
    if (has("en:non-vegetarian")) return { ok: false, reason: "Produit non végétarien (tag OFF)." };
    return { ok: "unknown", reason: "Statut végétarien non renseigné." };
  }

  if (diet === "gluten_free") {
    
    if (has("en:gluten-free") || has("en:no-gluten")) return { ok: true };
    
    const allergens = setFrom(product.allergens_tags);
    if (allergens.has("en:gluten")) return { ok: false, reason: "Contient du gluten (allergènes OFF)." };
    
    if (ingredients.includes("gluten") || ingredients.includes("blé") || ingredients.includes("wheat")) {
      return { ok: "unknown", reason: "Possible gluten (ingrédients), info incomplète." };
    }
    return { ok: "unknown", reason: "Statut sans gluten non renseigné." };
  }

  if (diet === "halal") {
    if (has("en:halal")) return { ok: true };
    if (has("en:not-halal")) return { ok: false, reason: "Non halal (tag OFF)." };
    return { ok: "unknown", reason: "Statut halal non renseigné." };
  }

  if (diet === "kosher") {
    if (has("en:kosher")) return { ok: true };
    if (has("en:not-kosher")) return { ok: false, reason: "Non casher (tag OFF)." };
    return { ok: "unknown", reason: "Statut casher non renseigné." };
  }

  return { ok: "unknown", reason: "Régime non reconnu." };
}