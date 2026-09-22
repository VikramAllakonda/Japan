from typing import Literal

from pydantic import BaseModel, Field


Unit = Literal["grams", "milliliters", "pieces_count", "tablespoons"]
CookingMethod = Literal[
    "boiling",
    "frying",
    "deep_frying",
    "sauteing",
    "roasting",
    "pressure_cooking",
    "steaming",
    "baking",
]


class Nutrition(BaseModel):
    calories: float = 0
    protein: float = 0
    carbs: float = 0
    fat: float = 0
    fiber: float = 0
    sodium: float = 0
    iron: float = 0
    calcium: float = 0
    b12: float = 0


class IngredientCatalogItem(BaseModel):
    id: str
    name: str
    category: str
    default_unit: Unit
    piece_weight_g: float = 0
    tablespoon_weight_g: float = 6
    nutrition_per_100g: Nutrition


class RecipeIngredient(BaseModel):
    ingredient_id: str
    quantity: float = Field(gt=0)
    unit: Unit


class Recipe(BaseModel):
    id: str
    name: str
    region: str
    description: str
    meal_type: Literal["Breakfast", "Main Dish"] = "Main Dish"
    dietary_type: Literal["Vegetarian", "Non-Vegetarian"] = "Vegetarian"
    default_cooking_method: CookingMethod
    ingredients: list[RecipeIngredient]


class CookingMethodInfo(BaseModel):
    key: CookingMethod
    label: str
    tagline: str
    yield_factor: float
    oil_uptake_g: float
    weight_change: str


class CalculateIngredientInput(BaseModel):
    ingredient_id: str
    quantity: float = Field(gt=0)
    unit: Unit


class CalculateRequest(BaseModel):
    ingredients: list[CalculateIngredientInput] = Field(min_length=1)
    cooking_method: CookingMethod
    servings: int = Field(default=2, ge=1, le=24)
    oil_absorption_g: float | None = Field(default=None, ge=0, le=100)
    nutrient_retention_multiplier: float = Field(default=1, ge=0.5, le=1.1)


class CalculatedIngredient(BaseModel):
    ingredient_id: str
    name: str
    quantity: float
    unit: Unit
    grams: float
    calories: float


class CalculateResponse(BaseModel):
    cooking_method: CookingMethod
    raw_weight_g: float
    cooked_weight_g: float
    servings: int
    oil_uptake_g: float
    raw_totals: Nutrition
    totals: Nutrition
    per_serving: Nutrition
    ingredients: list[CalculatedIngredient]
    cooking_note: str