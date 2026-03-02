import type { AllergenKey, Diet } from "../types/preferences";

export type Locale = "fr" | "en";

export type TranslationMap = {
  navigation: {
    tabs: {
      scanner: string;
      search: string;
      favorites: string;
      history: string;
      settings: string;
    };
    stack: {
      productDetails: string;
      compare: string;
      pickProduct: string;
      comparator: string;
    };
  };
  common: {
    loading: string;
    retry: string;
    unknownProduct: string;
    unknownBrand: string;
    unknownQuantity: string;
    close: string;
    remove: string;
    add: string;
    change: string;
    choose: string;
    noImage: string;
    networkError: string;
  };
  preferences: {
    title: string;
    language: {
      title: string;
      description: string;
      fr: string;
      en: string;
    };
    theme: {
      title: string;
      description: string;
      darkMode: string;
    };
    food: {
      title: string;
      description: string;
      dietTitle: string;
      currentDiet: string;
      allergensTitle: string;
      allergensDescription: string;
      none: string;
    };
    diets: Record<Diet, string>;
    allergens: Record<AllergenKey, string>;
  };
  scanner: {
    title: string;
    subtitle: string;
    cameraNeed: string;
    allowCamera: string;
    searching: string;
    hint: string;
    notFound: string;
    networkError: string;
  };
  search: {
    title: string;
    inputPlaceholder: string;
    startHint: string;
    searching: string;
    loadingMore: string;
    noResults: string;
  };
  product: {
    missingBarcode: string;
    notFound: string;
    failedLoad: string;
    loading: string;
    warning: string;
    allergensDetected: string;
    dietStatus: string;
    unknownInfo: string;
    compare: string;
    nutrition: string;
    ingredients: string;
    allergensTags: string;
    category: string;
    nutriScore: string;
  };
};

export const translations: Record<Locale, TranslationMap> = {
  fr: {
    navigation: {
      tabs: {
        scanner: "Scanner",
        search: "Recherche",
        favorites: "Favoris",
        history: "Historique",
        settings: "Paramètres",
      },
      stack: {
        productDetails: "Fiche produit",
        compare: "Comparer",
        pickProduct: "Choisir un produit",
        comparator: "Comparateur",
      },
    },
    common: {
      loading: "Chargement...",
      retry: "Réessayer",
      unknownProduct: "Produit sans nom",
      unknownBrand: "Marque inconnue",
      unknownQuantity: "Quantité inconnue",
      close: "Fermer",
      remove: "Retirer",
      add: "Ajouter",
      change: "Changer",
      choose: "Choisir",
      noImage: "Pas d'image",
      networkError: "Erreur réseau.",
    },
    preferences: {
      title: "Paramètres utilisateurs",
      language: {
        title: "Langue",
        description: "Choisis la langue de l'application",
        fr: "Français",
        en: "Anglais",
      },
      theme: {
        title: "Apparence",
        description: "Active le thème sombre de l'application",
        darkMode: "Mode sombre",
      },
      food: {
        title: "Préférences alimentaires",
        description: "Ces préférences sont utilisées pour afficher une alerte sur la fiche produit.",
        dietTitle: "Régime",
        currentDiet: "Actuel : {{diet}}",
        allergensTitle: "Allergènes à éviter",
        allergensDescription: "Sélectionne ceux que tu veux éviter.",
        none: "Aucun",
      },
      diets: {
        none: "Aucun",
        vegetarian: "Végétarien",
        vegan: "Végan",
        gluten_free: "Sans gluten",
        halal: "Halal",
        kosher: "Casher",
      },
      allergens: {
        gluten: "Gluten",
        milk: "Lait",
        eggs: "Œufs",
        peanuts: "Arachides",
        nuts: "Fruits à coque",
        soy: "Soja",
        fish: "Poisson",
        crustaceans: "Crustacés",
        sesame: "Sésame",
        sulphites: "Sulfites",
        celery: "Céleri",
        mustard: "Moutarde",
        lupin: "Lupin",
      },
    },
    scanner: {
      title: "Scanner un produit",
      subtitle: "Place le code-barres dans le cadre",
      cameraNeed: "NutriScan a besoin de la caméra pour scanner un code-barres.",
      allowCamera: "Autoriser la caméra",
      searching: "Recherche du produit...",
      hint: "Astuce : évite les reflets, rapproche-toi légèrement.",
      notFound: "Produit introuvable dans Open Food Facts.",
      networkError: "Erreur réseau. Vérifie ta connexion et réessaie.",
    },
    search: {
      title: "Rechercher un produit",
      inputPlaceholder: "Nom ou marque (ex: nutella)",
      startHint: "Tape un nom ou une marque pour lancer une recherche.",
      searching: "Recherche en cours...",
      loadingMore: "Chargement de plus de résultats...",
      noResults: "Aucun résultat trouvé.",
    },
    product: {
      missingBarcode: "Code-barres manquant.",
      notFound: "Produit introuvable.",
      failedLoad: "Impossible de charger le produit.",
      loading: "Chargement du produit...",
      warning: "Attention",
      allergensDetected: "Allergènes détectés : {{allergens}}",
      dietStatus: "Régime ({{diet}}) : {{status}}",
      unknownInfo: "info inconnue",
      compare: "Comparer avec un autre produit",
      nutrition: "Nutrition (pour 100g)",
      ingredients: "Ingrédients",
      allergensTags: "Allergènes (tags)",
      category: "Catégorie",
      nutriScore: "Nutri-Score",
    },
  },
  en: {
    navigation: {
      tabs: {
        scanner: "Scan",
        search: "Search",
        favorites: "Favorites",
        history: "History",
        settings: "Settings",
      },
      stack: {
        productDetails: "Product details",
        compare: "Compare",
        pickProduct: "Choose a product",
        comparator: "Comparator",
      },
    },
    common: {
      loading: "Loading...",
      retry: "Retry",
      unknownProduct: "Unnamed product",
      unknownBrand: "Unknown brand",
      unknownQuantity: "Unknown quantity",
      close: "Close",
      remove: "Remove",
      add: "Add",
      change: "Change",
      choose: "Choose",
      noImage: "No image",
      networkError: "Network error.",
    },
    preferences: {
      title: "User settings",
      language: {
        title: "Language",
        description: "Choose the app language",
        fr: "French",
        en: "English",
      },
      theme: {
        title: "Appearance",
        description: "Enable the app dark theme",
        darkMode: "Dark mode",
      },
      food: {
        title: "Food preferences",
        description: "These preferences are used to show an alert on product details.",
        dietTitle: "Diet",
        currentDiet: "Current: {{diet}}",
        allergensTitle: "Allergens to avoid",
        allergensDescription: "Select allergens you want to avoid.",
        none: "None",
      },
      diets: {
        none: "None",
        vegetarian: "Vegetarian",
        vegan: "Vegan",
        gluten_free: "Gluten free",
        halal: "Halal",
        kosher: "Kosher",
      },
      allergens: {
        gluten: "Gluten",
        milk: "Milk",
        eggs: "Eggs",
        peanuts: "Peanuts",
        nuts: "Tree nuts",
        soy: "Soy",
        fish: "Fish",
        crustaceans: "Crustaceans",
        sesame: "Sesame",
        sulphites: "Sulphites",
        celery: "Celery",
        mustard: "Mustard",
        lupin: "Lupin",
      },
    },
    scanner: {
      title: "Scan a product",
      subtitle: "Place the barcode inside the frame",
      cameraNeed: "NutriScan needs camera access to scan a barcode.",
      allowCamera: "Allow camera",
      searching: "Searching product...",
      hint: "Tip: avoid reflections and move slightly closer.",
      notFound: "Product not found in Open Food Facts.",
      networkError: "Network error. Check your connection and try again.",
    },
    search: {
      title: "Search a product",
      inputPlaceholder: "Name or brand (e.g. nutella)",
      startHint: "Type a name or brand to start searching.",
      searching: "Searching...",
      loadingMore: "Loading more results...",
      noResults: "No result found.",
    },
    product: {
      missingBarcode: "Missing barcode.",
      notFound: "Product not found.",
      failedLoad: "Unable to load product.",
      loading: "Loading product...",
      warning: "Warning",
      allergensDetected: "Detected allergens: {{allergens}}",
      dietStatus: "Diet ({{diet}}): {{status}}",
      unknownInfo: "unknown info",
      compare: "Compare with another product",
      nutrition: "Nutrition (per 100g)",
      ingredients: "Ingredients",
      allergensTags: "Allergens (tags)",
      category: "Category",
      nutriScore: "Nutri-Score",
    },
  },
};

export function getSystemLocale(): Locale {
  const locale = Intl.DateTimeFormat().resolvedOptions().locale.toLowerCase();
  return locale.startsWith("fr") ? "fr" : "en";
}
