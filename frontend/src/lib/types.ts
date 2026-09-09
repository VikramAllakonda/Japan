export type Unit = "grams" | "milliliters" | "pieces_count" | "tablespoons";

export type CookingMethodKey =
  | "boiling"
  | "frying"
  | "deep_frying"
  | "sauteing"
  | "roasting"
  | "pressure_cooking"
  | "steaming"
  | "baking";

export interface Nutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sodium: number;
  iron: number;
  calcium: number;
}

export interface IngredientCatalogItem {
  id: string;
  name: string;
  category: string;
  default_unit: Unit;
  piece_weight_g: number;
  tablespoon_weight_g: number;
  nutrition_per_100g: Nutrition;
}

export interface RecipeIngredient {
  ingredient_id: string;
  quantity: number;
  unit: Unit;
}

export interface Recipe {
  id: string;
  name: string;
  region: string;
  description: string;
  default_cooking_method: CookingMethodKey;
  ingredients: RecipeIngredient[];
}

export interface CookingMethodInfo {
  key: CookingMethodKey;
  label: string;
  tagline: string;
  yield_factor: number;
  oil_uptake_g: number;
  weight_change: string;
}

export interface CalculateIngredientInput {
  ingredient_id: string;
  quantity: number;
  unit: Unit;
}

export interface CalculateRequest {
  ingredients: CalculateIngredientInput[];
  cooking_method: CookingMethodKey;
  servings: number;
}

export interface CalculatedIngredient {
  ingredient_id: string;
  name: string;
  quantity: number;
  unit: Unit;
  grams: number;
  calories: number;
}

export interface CalculateResponse {
  cooking_method: CookingMethodKey;
  raw_weight_g: number;
  cooked_weight_g: number;
  servings: number;
  oil_uptake_g: number;
  totals: Nutrition;
  per_serving: Nutrition;
  ingredients: CalculatedIngredient[];
  cooking_note: string;
}