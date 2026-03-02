export type OFFProduct = {
    code?: string;
    product_name?: string;
    brands?: string;
    quantity?: string;
    image_url?: string;
    nutriscore_grade?: string; // a-e
    nova_group?: number; // 1-4
    ecoscore_grade?: string; // a-e
    ingredients_text?: string;
    allergens_tags?: string[];
    labels_tags?: string[];
    misc_tags?: string[];
    nutriments?: {
      "energy-kcal_100g"?: number;
      fat_100g?: number;
      "saturated-fat_100g"?: number;
      carbohydrates_100g?: number;
      sugars_100g?: number;
      fiber_100g?: number;
      proteins_100g?: number;
      salt_100g?: number;
    };
  };
  
  export type OFFProductResponse = {
    status: 0 | 1;
    code?: string;
    product?: OFFProduct;
    status_verbose?: string;
  };
