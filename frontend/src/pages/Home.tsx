import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  CakeSlice,
  ChefHat,
  ChevronRight,
  Cloud,
  Flame,
  Gauge,
  Info,
  Leaf,
  Minus,
  Plus,
  Search,
  Sparkles,
  SunMedium,
  Trash2,
  Utensils,
  Waves,
  Wind,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Toaster } from "@/components/ui/sonner";
import { apiGet, apiPost } from "@/lib/api";
import type {
  CalculateRequest,
  CalculateResponse,
  CookingMethodInfo,
  CookingMethodKey,
  IngredientCatalogItem,
  Nutrition,
  Recipe,
  Unit,
} from "@/lib/types";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1540100716001-4b432820e37f?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1MDZ8MHwxfHNlYXJjaHwyfHxJbmRpYW4lMjBjb29raW5nJTIwc3BpY2VzJTIwYm93bHxlbnwwfHx8b3JhbmdlfDE3ODg5MzA5MjN8MA&ixlib=rb-4.1.0&q=85";

const METHOD_ICONS: Record<CookingMethodKey, LucideIcon> = {
  boiling: Waves,
  frying: Flame,
  deep_frying: Flame,
  sauteing: Wind,
  roasting: SunMedium,
  pressure_cooking: Gauge,
  steaming: Cloud,
  baking: CakeSlice,
};

const METHOD_COLORS: Record<CookingMethodKey, string> = {
  boiling: "#5B8A62",
  frying: "#F28A2E",
  deep_frying: "#C83E2B",
  sauteing: "#E5A93C",
  roasting: "#D95D39",
  pressure_cooking: "#A18B67",
  steaming: "#8EAFA0",
  baking: "#D98A58",
};

const UNIT_OPTIONS: Unit[] = ["grams", "milliliters", "pieces_count", "tablespoons"];
const CATEGORIES = ["All", "Pulses", "Grains", "Vegetables", "Spices", "Dairy", "Oils & Fats", "Non-veg"];
const NUTRITION_COMPARISON: Array<{ key: keyof Nutrition; label: string; suffix: string }> = [
  { key: "calories", label: "Calories", suffix: "kcal" },
  { key: "protein", label: "Protein", suffix: "g" },
  { key: "carbs", label: "Carbs", suffix: "g" },
  { key: "fat", label: "Fat", suffix: "g" },
];

const EMPTY_NUTRITION: Nutrition = {
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  fiber: 0,
  sodium: 0,
  iron: 0,
  calcium: 0,
  b12: 0,
};

interface PotItem {
  instanceId: string;
  ingredientId: string;
  quantity: number;
  unit: Unit;
}

function unitLabel(unit: Unit) {
  return {
    grams: "grams",
    milliliters: "milliliters",
    pieces_count: "pieces",
    tablespoons: "tbsp",
  }[unit];
}

function prettyNumber(value: number) {
  return value >= 100 ? Math.round(value).toLocaleString() : value.toFixed(1);
}

function NutritionMetric({
  label,
  value,
  suffix,
  accent,
  testId,
}: {
  label: string;
  value: number | string;
  suffix?: string;
  accent: string;
  testId: string;
}) {
  return (
    <div data-testid={testId} className="rounded-2xl border border-[#3d3028] bg-[#1d1612]/75 p-4">
      <div className="mb-3 h-1 w-8 rounded-full" style={{ backgroundColor: accent }} />
      <p data-testid={`${testId}-label`} className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9e8b7b]">
        {label}
      </p>
      <p data-testid={`${testId}-value`} className="mt-1 font-heading text-2xl font-semibold text-[#f7efe9]">
        {value}
        {suffix && <span className="ml-1 text-xs font-medium text-[#aa9788]">{suffix}</span>}
      </p>
    </div>
  );
}

function MicroBar({ label, value, max, suffix, testId }: { label: string; value: number; max: number; suffix: string; testId: string }) {
  const percentage = Math.min(100, Math.round((value / max) * 100));
  return (
    <div data-testid={testId} className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span data-testid={`${testId}-label`} className="font-medium text-[#d4c3b6]">{label}</span>
        <span data-testid={`${testId}-value`} className="font-mono text-[#e5a93c]">{prettyNumber(value)} {suffix}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-[#3b2b22]" aria-label={`${label} progress`}>
        <div className="h-full rounded-full bg-gradient-to-r from-[#d95d39] to-[#e5a93c] transition-[width] duration-500" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

function RecipeCard({ recipe, onLoad }: { recipe: Recipe; onLoad: (recipe: Recipe) => void }) {
  return (
    <Card data-testid={`recipe-card-${recipe.id}`} className="group overflow-hidden border-[#3d3028] bg-[#211813] transition-[border-color,transform] duration-200 hover:-translate-y-1 hover:border-[#d95d39]/70">
      <CardContent className="p-4">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <Badge data-testid={`recipe-region-${recipe.id}`} variant="outline" className="border-[#6e4e34] text-[#e5a93c]">{recipe.region}</Badge>
            <h3 data-testid={`recipe-name-${recipe.id}`} className="mt-3 font-heading text-lg font-semibold leading-tight text-[#f7efe9]">{recipe.name}</h3>
          </div>
          <div className="rounded-xl bg-[#d95d39]/10 p-2 text-[#f28a2e] transition-transform duration-200 group-hover:rotate-6"><Utensils size={17} /></div>
        </div>
        <p data-testid={`recipe-description-${recipe.id}`} className="min-h-12 text-xs leading-5 text-[#a99485]">{recipe.description}</p>
        <Button data-testid={`recipe-load-${recipe.id}-button`} onClick={() => onLoad(recipe)} variant="outline" className="mt-4 h-9 w-full justify-between border-[#59412e] bg-transparent text-[#f7efe9] hover:bg-[#d95d39]/10 hover:text-[#f7efe9]">
          Load into pot <ChevronRight size={15} />
        </Button>
      </CardContent>
    </Card>
  );
}

export default function Home() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [potItems, setPotItems] = useState<PotItem[]>([]);
  const [cookingMethod, setCookingMethod] = useState<CookingMethodKey>("pressure_cooking");
  const [servings, setServings] = useState(2);
  const [oilAbsorptionOverride, setOilAbsorptionOverride] = useState<number | null>(null);
  const [retentionMultiplier, setRetentionMultiplier] = useState(1);

  const ingredientsQuery = useQuery({
    queryKey: ["catalog", "ingredients"],
    queryFn: () => apiGet<IngredientCatalogItem[]>("/catalog/ingredients"),
    retry: false,
  });
  const recipesQuery = useQuery({
    queryKey: ["catalog", "recipes"],
    queryFn: () => apiGet<Recipe[]>("/catalog/recipes"),
    retry: false,
  });
  const methodsQuery = useQuery({
    queryKey: ["catalog", "cooking-methods"],
    queryFn: () => apiGet<CookingMethodInfo[]>("/catalog/cooking-methods"),
    retry: false,
  });

  const ingredients = ingredientsQuery.data ?? [];
  const recipes = recipesQuery.data ?? [];
  const methods = methodsQuery.data ?? [];
  const ingredientMap = useMemo(() => new Map(ingredients.map((ingredient) => [ingredient.id, ingredient])), [ingredients]);
  const visibleIngredients = ingredients.filter((ingredient) => {
    const matchesSearch = ingredient.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === "All" || ingredient.category === category;
    return matchesSearch && matchesCategory;
  });

  const calculateMutation = useMutation({
    mutationFn: (payload: CalculateRequest) => apiPost<CalculateResponse>("/catalog/calculate", payload),
    onSuccess: () => toast.success("The pot has been simulated", { description: "Nutrition and cooking yield are up to date." }),
    onError: () => toast.error("Simulation unavailable", { description: "The catalog service could not calculate this pot." }),
  });
  const compareMutation = useMutation({
    mutationFn: async (): Promise<CalculateResponse[]> => {
      const methodsToCompare: CookingMethodKey[] = ["boiling", "frying", "pressure_cooking"];
      return Promise.all(methodsToCompare.map((method) => apiPost<CalculateResponse>("/catalog/calculate", {
        ingredients: potItems.map(({ ingredientId, quantity, unit }) => ({ ingredient_id: ingredientId, quantity: Number(quantity), unit })),
        cooking_method: method,
        servings,
      })));
    },
    onSuccess: () => toast.success("Method comparison ready", { description: "Your current pot is shown across three cooking modes." }),
    onError: () => toast.error("Comparison unavailable", { description: "Add ingredients and try comparing the methods again." }),
  });
  const result = calculateMutation.data;
  const comparison = compareMutation.data ?? [];
  const selectedMethod = methods.find((method) => method.key === cookingMethod);

  function addIngredient(ingredient: IngredientCatalogItem) {
    const unit = ingredient.default_unit;
    const quantity = unit === "pieces_count" ? 1 : unit === "tablespoons" ? 1 : unit === "milliliters" ? 100 : 50;
    setPotItems((current) => [...current, { instanceId: `${ingredient.id}-${Date.now()}`, ingredientId: ingredient.id, quantity, unit }]);
    toast(`${ingredient.name} added`, { description: "Adjust the quantity in your virtual pot." });
  }

  function loadRecipe(recipe: Recipe) {
    setPotItems(recipe.ingredients.map((item, index) => ({ ...item, instanceId: `${recipe.id}-${index}` , ingredientId: item.ingredient_id })));
    setCookingMethod(recipe.default_cooking_method);
    setServings(2);
    setOilAbsorptionOverride(null);
    setRetentionMultiplier(1);
    calculateMutation.reset();
    compareMutation.reset();
    toast.success(`${recipe.name} loaded`, { description: "Choose a method, then simulate the pot." });
  }

  function updatePotItem(instanceId: string, patch: Partial<PotItem>) {
    setPotItems((current) => current.map((item) => item.instanceId === instanceId ? { ...item, ...patch } : item));
  }

  function unitsForIngredient(ingredient: IngredientCatalogItem): Unit[] {
    return ingredient.category === "Non-veg" ? ["grams"] : UNIT_OPTIONS;
  }

  function runSimulation() {
    if (potItems.length === 0) {
      toast.error("Add an ingredient first", { description: "Load a recipe or add ingredients to the virtual pot." });
      return;
    }
    calculateMutation.mutate({ ingredients: potItems.map(({ ingredientId, quantity, unit }) => ({ ingredient_id: ingredientId, quantity: Number(quantity), unit })), cooking_method: cookingMethod, servings, oil_absorption_g: oilAbsorptionOverride ?? undefined, nutrient_retention_multiplier: retentionMultiplier });
  }

  function runComparison() {
    if (potItems.length === 0) {
      toast.error("Add an ingredient first", { description: "Load a recipe or add ingredients before comparing methods." });
      return;
    }
    compareMutation.mutate();
  }

  const total = result?.totals ?? EMPTY_NUTRITION;
  const rawTotal = result?.raw_totals ?? EMPTY_NUTRITION;
  const perServing = result?.per_serving ?? EMPTY_NUTRITION;
  const hasCatalogError = ingredientsQuery.isError || recipesQuery.isError || methodsQuery.isError;

  return (
    <div data-testid="app-shell" className="min-h-svh overflow-hidden bg-[#120e0c] text-[#f7efe9]">
      <Toaster position="bottom-right" richColors />
      <div className="pointer-events-none fixed inset-0 opacity-40 [background-image:radial-gradient(circle_at_15%_10%,rgba(217,93,57,0.17),transparent_25%),radial-gradient(circle_at_90%_25%,rgba(229,169,60,0.12),transparent_20%)]" />
      <header data-testid="app-header" className="relative z-10 border-b border-[#3d3028]/70 bg-[#120e0c]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div data-testid="brand-mark" className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#d95d39] text-[#fff5e8] shadow-[0_0_26px_rgba(217,93,57,0.28)]"><ChefHat size={21} /></div>
            <div>
              <p data-testid="brand-title" className="font-heading text-lg font-bold tracking-tight">Virtual Rasoi</p>
              <p data-testid="brand-subtitle" className="text-[9px] font-semibold uppercase tracking-[0.24em] text-[#a99485]">Indian nutrition lab</p>
            </div>
          </div>
          <div className="hidden items-center gap-3 sm:flex">
            <Badge data-testid="catalog-status-badge" className="border border-[#5b8a62]/40 bg-[#5b8a62]/10 text-[#9dcc9f]"><span className="mr-2 h-1.5 w-1.5 rounded-full bg-[#79bb7d]" />{ingredients.length || 32} ingredients mapped</Badge>
            <p data-testid="estimate-disclaimer" className="text-[10px] uppercase tracking-[0.15em] text-[#806f63]">Nutrition estimates</p>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <section data-testid="hero-section" className="mb-10 grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
          <div className="flex flex-col justify-center py-2 lg:py-8">
            <div data-testid="hero-eyebrow" className="mb-5 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-[#e5a93c]"><Sparkles size={15} /> Cook with clarity</div>
            <h1 data-testid="hero-title" className="max-w-2xl font-heading text-5xl font-bold leading-[0.95] tracking-[-0.045em] text-[#f7efe9] sm:text-6xl lg:text-7xl">Know what your <span className="text-[#d95d39]">kadai</span> is becoming.</h1>
            <p data-testid="hero-description" className="mt-6 max-w-xl text-base leading-7 text-[#bba79a]">Build Indian dishes ingredient by ingredient, then see how heat, water, and oil reshape the nutrition in every serving.</p>
            <div className="mt-8 flex flex-wrap items-center gap-5">
              <div data-testid="hero-recipe-count" className="border-l-2 border-[#d95d39] pl-3"><p className="font-heading text-2xl font-semibold text-[#f7efe9]">{recipes.length || 4}</p><p className="text-[10px] uppercase tracking-[0.15em] text-[#8c7a6d]">regional recipes</p></div>
              <div data-testid="hero-method-count" className="border-l-2 border-[#e5a93c] pl-3"><p className="font-heading text-2xl font-semibold text-[#f7efe9]">{methods.length || 8}</p><p className="text-[10px] uppercase tracking-[0.15em] text-[#8c7a6d]">cooking methods</p></div>
              <div data-testid="hero-nutrient-count" className="border-l-2 border-[#5b8a62] pl-3"><p className="font-heading text-2xl font-semibold text-[#f7efe9]">09</p><p className="text-[10px] uppercase tracking-[0.15em] text-[#8c7a6d]">nutrients tracked</p></div>
            </div>
          </div>
          <div data-testid="hero-image-panel" className="relative min-h-[300px] overflow-hidden rounded-[2rem] border border-[#6c4930] bg-[#2b1e17] shadow-[0_25px_80px_rgba(0,0,0,0.32)] lg:min-h-[390px]">
            <img data-testid="hero-spice-image" src={HERO_IMAGE} alt="Indian spices and a colorful dish" className="absolute inset-0 h-full w-full object-cover opacity-75 mix-blend-screen" />
            <div className="absolute inset-0 bg-gradient-to-tr from-[#120e0c] via-[#120e0c]/25 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between gap-4">
              <div><p data-testid="hero-image-kicker" className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#f2c875]">The virtual kitchen</p><p data-testid="hero-image-caption" className="mt-1 max-w-xs font-heading text-2xl font-semibold leading-tight text-[#fff5e8]">From spice shelf to nutrition story.</p></div>
              <div data-testid="hero-image-icon" className="animate-float-spice rounded-full border border-[#f2c875]/40 bg-[#120e0c]/60 p-3 text-[#f2c875] backdrop-blur"><Leaf size={22} /></div>
            </div>
          </div>
        </section>

        {hasCatalogError && <div data-testid="catalog-error-banner" className="mb-6 flex items-center gap-3 rounded-2xl border border-[#8f5e32] bg-[#3a2518] px-4 py-3 text-sm text-[#f4cb86]"><Info size={17} /> The catalog is taking a moment. The kitchen shell is still ready for your next recipe.</div>}

        <section data-testid="recipe-shelf" className="mb-10">
          <div className="mb-4 flex items-end justify-between gap-4"><div><p data-testid="recipe-shelf-eyebrow" className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#d95d39]">Start with a classic</p><h2 data-testid="recipe-shelf-title" className="mt-1 font-heading text-3xl font-semibold tracking-tight text-[#f7efe9]">Recipe shelf</h2></div><p data-testid="recipe-shelf-hint" className="hidden text-xs text-[#8c7a6d] sm:block">Load a base, then make it yours <ChevronRight className="ml-1 inline" size={14} /></p></div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{recipes.map((recipe) => <RecipeCard key={recipe.id} recipe={recipe} onLoad={loadRecipe} />)}</div>
        </section>

        <section data-testid="calculator-workspace" className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(360px,.7fr)]">
          <div className="space-y-6">
            <Card data-testid="ingredient-browser-card" className="glass-panel overflow-hidden border-[#3d3028]">
              <CardHeader className="border-b border-[#3d3028]/80 px-5 pb-4 pt-5 sm:px-6"><div className="flex items-start justify-between gap-4"><div><p data-testid="ingredient-browser-eyebrow" className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#e5a93c]">Ingredient browser</p><CardTitle data-testid="ingredient-browser-title" className="mt-1 font-heading text-2xl text-[#f7efe9]">Build your pot</CardTitle><p data-testid="ingredient-browser-description" className="mt-1 text-xs leading-5 text-[#9e8b7b]">Search, choose a unit, and layer in your own proportions.</p></div><div data-testid="ingredient-browser-icon" className="rounded-xl bg-[#e5a93c]/10 p-3 text-[#e5a93c]"><Search size={19} /></div></div></CardHeader>
              <CardContent className="p-5 sm:p-6">
                <div className="relative"><Search data-testid="ingredient-search-icon" className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8c7a6d]" size={16} /><Input data-testid="ingredient-search-input" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search dal, tomato, spice..." className="h-11 border-[#4d392b] bg-[#18120f] pl-10 text-[#f7efe9] placeholder:text-[#806f63] focus-visible:ring-[#d95d39]" /></div>
                <div data-testid="ingredient-category-filters" className="mt-4 flex gap-2 overflow-x-auto pb-1">{CATEGORIES.map((item) => <Button key={item} data-testid={`category-${item.toLowerCase().replaceAll(" ", "-")}-filter-button`} onClick={() => setCategory(item)} variant={category === item ? "default" : "outline"} size="sm" className={category === item ? "h-8 rounded-full bg-[#d95d39] px-3 text-xs text-white hover:bg-[#bf4d2d]" : "h-8 rounded-full border-[#4d392b] bg-transparent px-3 text-xs text-[#bba79a] hover:bg-[#2a1d16] hover:text-white"}>{item}</Button>)}</div>
                <div data-testid="ingredient-results" className="mt-5 grid max-h-[310px] grid-cols-2 gap-3 overflow-y-auto pr-1 sm:grid-cols-3">{visibleIngredients.map((ingredient) => <button data-testid={`ingredient-add-${ingredient.id}-button`} key={ingredient.id} type="button" onClick={() => addIngredient(ingredient)} className="group rounded-2xl border border-[#3d3028] bg-[#211813]/75 p-3 text-left transition-[border-color,background-color,transform] duration-200 hover:-translate-y-0.5 hover:border-[#d95d39]/70 hover:bg-[#2a1b14]"><div className="mb-4 flex items-start justify-between"><span className="rounded-xl bg-[#3d2b20] p-2 text-[#e5a93c]"><Leaf size={15} /></span><Plus className="text-[#806f63] transition-colors duration-200 group-hover:text-[#f28a2e]" size={17} /></div><p data-testid={`ingredient-name-${ingredient.id}`} className="line-clamp-1 text-sm font-semibold text-[#f7efe9]">{ingredient.name}</p><p data-testid={`ingredient-category-${ingredient.id}`} className="mt-1 text-[10px] uppercase tracking-[0.12em] text-[#8c7a6d]">{ingredient.category}</p></button>)}</div>
                {visibleIngredients.length === 0 && <p data-testid="ingredient-empty-state" className="py-10 text-center text-sm text-[#9e8b7b]">No ingredients match that search.</p>}
              </CardContent>
            </Card>

            <Card data-testid="virtual-pot-card" className="glass-panel border-[#3d3028]">
              <CardHeader className="flex flex-row items-center justify-between gap-4 px-5 pb-4 pt-5 sm:px-6"><div><p data-testid="virtual-pot-eyebrow" className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#d95d39]">Active build</p><CardTitle data-testid="virtual-pot-title" className="mt-1 font-heading text-2xl text-[#f7efe9]">Virtual cooking pot <span className="ml-2 align-middle text-sm font-normal text-[#8c7a6d]">{potItems.length} items</span></CardTitle></div><Button data-testid="clear-pot-button" onClick={() => { setPotItems([]); calculateMutation.reset(); }} variant="ghost" size="sm" className="text-[#a99485] hover:bg-[#3a211a] hover:text-[#f28a2e]"><Trash2 size={15} className="mr-2" /> Clear</Button></CardHeader>
              <CardContent className="px-5 pb-5 sm:px-6">{potItems.length === 0 ? <div data-testid="empty-pot-state" className="rounded-2xl border border-dashed border-[#59412e] bg-[#18120f]/50 px-5 py-12 text-center"><div className="mx-auto mb-3 w-fit rounded-full bg-[#d95d39]/10 p-3 text-[#d95d39]"><Utensils size={22} /></div><p data-testid="empty-pot-title" className="font-heading text-lg font-semibold text-[#f7efe9]">Your pot is waiting</p><p data-testid="empty-pot-description" className="mx-auto mt-1 max-w-sm text-xs leading-5 text-[#9e8b7b]">Load a recipe above or tap any ingredient to begin your measured cooking simulation.</p></div> : <div data-testid="pot-ingredient-list" className="space-y-2">{potItems.map((item) => { const ingredient = ingredientMap.get(item.ingredientId); if (!ingredient) return null; const availableUnits = unitsForIngredient(ingredient); return <div data-testid={`pot-ingredient-row-${item.instanceId}`} key={item.instanceId} className="grid grid-cols-[minmax(0,1fr)_82px_116px_32px] items-center gap-2 rounded-2xl border border-[#3d3028] bg-[#1c1410]/75 p-3 sm:grid-cols-[minmax(0,1fr)_105px_130px_32px]"><div className="min-w-0"><p data-testid={`pot-ingredient-name-${item.instanceId}`} className="truncate text-sm font-semibold text-[#f7efe9]">{ingredient.name}</p><p data-testid={`pot-ingredient-category-${item.instanceId}`} className="mt-0.5 text-[10px] uppercase tracking-[0.12em] text-[#8c7a6d]">{ingredient.category}</p></div><Input data-testid={`ingredient-quantity-${item.instanceId}-input`} type="number" min="0.1" step="0.1" value={item.quantity} onChange={(event) => updatePotItem(item.instanceId, { quantity: Number(event.target.value) })} className="h-9 border-[#4d392b] bg-[#18120f] px-2 text-right text-sm text-[#f7efe9]" /><select data-testid={`ingredient-unit-${item.instanceId}-select`} aria-label={`Unit for ${ingredient.name}`} value={availableUnits.includes(item.unit) ? item.unit : "grams"} onChange={(event) => updatePotItem(item.instanceId, { unit: event.target.value as Unit })} className="h-9 rounded-md border border-[#4d392b] bg-[#18120f] px-2 text-xs text-[#d4c3b6] outline-none transition-[border-color] duration-200 focus:border-[#e5a93c]">{availableUnits.map((unit) => <option key={unit} value={unit}>{unitLabel(unit)}</option>)}</select><button data-testid={`ingredient-remove-${item.instanceId}-button`} type="button" onClick={() => setPotItems((current) => current.filter((potItem) => potItem.instanceId !== item.instanceId))} className="flex h-8 w-8 items-center justify-center rounded-lg text-[#806f63] transition-[background-color,color] duration-200 hover:bg-[#3a211a] hover:text-[#f28a2e]"><Trash2 size={15} /></button></div>})}</div>}</CardContent>
            </Card>

            <Card data-testid="cooking-method-card" className="glass-panel border-[#3d3028]">
              <CardHeader className="px-5 pb-4 pt-5 sm:px-6"><p data-testid="cooking-method-eyebrow" className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#e5a93c]">Heat profile</p><CardTitle data-testid="cooking-method-title" className="mt-1 font-heading text-2xl text-[#f7efe9]">How are you cooking it?</CardTitle><p data-testid="cooking-method-description" className="mt-1 text-xs leading-5 text-[#9e8b7b]">Each method changes moisture, yield, and oil absorption.</p></CardHeader>
              <CardContent className="grid grid-cols-2 gap-2 px-5 pb-5 sm:grid-cols-4 sm:px-6">{methods.map((method) => { const Icon = METHOD_ICONS[method.key]; const isActive = cookingMethod === method.key; return <button data-testid={`method-${method.key}-button`} key={method.key} type="button" onClick={() => { setCookingMethod(method.key); setOilAbsorptionOverride(null); setRetentionMultiplier(1); calculateMutation.reset(); }} className={`rounded-2xl border p-3 text-left transition-[border-color,background-color,transform] duration-200 hover:-translate-y-0.5 ${isActive ? "border-[#e5a93c] bg-[#e5a93c]/10" : "border-[#3d3028] bg-[#1c1410]/55 hover:border-[#6e4e34]"}`}><div className="mb-3 flex items-center justify-between"><Icon size={18} style={{ color: METHOD_COLORS[method.key] }} /><span data-testid={`method-weight-${method.key}`} className="font-mono text-[9px] text-[#8c7a6d]">{method.weight_change}</span></div><p data-testid={`method-label-${method.key}`} className="text-xs font-semibold text-[#f7efe9]">{method.label}</p><p data-testid={`method-tagline-${method.key}`} className="mt-1 text-[10px] text-[#8c7a6d]">{method.tagline}</p></button>})}</CardContent>
            </Card>

            <Card data-testid="method-presets-card" className="border-[#4f3828] bg-[#211813]/90"><CardHeader className="px-5 pb-3 pt-5"><div className="flex items-start justify-between gap-3"><div><p data-testid="method-presets-eyebrow" className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#e5a93c]">Advanced controls</p><CardTitle data-testid="method-presets-title" className="mt-1 font-heading text-xl text-[#f7efe9]">Tune this {selectedMethod?.label?.toLowerCase() ?? "method"}</CardTitle><p data-testid="method-presets-description" className="mt-1 text-xs leading-5 text-[#9e8b7b]">Overrides apply to the current simulation only.</p></div><Button data-testid="method-presets-reset-button" onClick={() => { setOilAbsorptionOverride(null); setRetentionMultiplier(1); }} variant="ghost" size="sm" className="text-[#a99485] hover:bg-[#3a211a] hover:text-[#f2b15e]">Reset</Button></div></CardHeader><CardContent className="space-y-5 px-5 pb-5"><div data-testid="oil-absorption-control" className="space-y-2"><div className="flex items-center justify-between"><label data-testid="oil-absorption-label" htmlFor="oil-absorption-slider" className="text-xs font-medium text-[#d4c3b6]">Oil absorbed</label><span data-testid="oil-absorption-value" className="font-mono text-xs text-[#e5a93c]">{(oilAbsorptionOverride ?? selectedMethod?.oil_uptake_g ?? 0).toFixed(1)} g</span></div><input data-testid="oil-absorption-slider" id="oil-absorption-slider" type="range" min="0" max="35" step="0.5" value={oilAbsorptionOverride ?? selectedMethod?.oil_uptake_g ?? 0} onChange={(event) => setOilAbsorptionOverride(Number(event.target.value))} className="h-1.5 w-full accent-[#d95d39]" /><div className="flex justify-between text-[9px] uppercase tracking-[0.12em] text-[#725f52]"><span data-testid="oil-absorption-min">0 g</span><span data-testid="oil-absorption-max">35 g</span></div></div><div data-testid="nutrient-retention-control" className="space-y-2"><div className="flex items-center justify-between"><label data-testid="nutrient-retention-label" htmlFor="nutrient-retention-slider" className="text-xs font-medium text-[#d4c3b6]">Retention multiplier</label><span data-testid="nutrient-retention-value" className="font-mono text-xs text-[#e5a93c]">{Math.round(retentionMultiplier * 100)}%</span></div><input data-testid="nutrient-retention-slider" id="nutrient-retention-slider" type="range" min="0.5" max="1.1" step="0.01" value={retentionMultiplier} onChange={(event) => setRetentionMultiplier(Number(event.target.value))} className="h-1.5 w-full accent-[#e5a93c]" /><div className="flex justify-between text-[9px] uppercase tracking-[0.12em] text-[#725f52]"><span data-testid="nutrient-retention-min">50%</span><span data-testid="nutrient-retention-max">110%</span></div></div></CardContent></Card>

            <div data-testid="simulation-controls" className="flex flex-col gap-4 rounded-2xl border border-[#6a492d] bg-gradient-to-r from-[#322017] to-[#211610] p-4 sm:flex-row sm:items-center sm:justify-between"><div><p data-testid="servings-label" className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#b99556]">Servings</p><div className="mt-2 flex items-center gap-3"><button data-testid="servings-decrease-button" type="button" onClick={() => setServings((value) => Math.max(1, value - 1))} className="flex h-8 w-8 items-center justify-center rounded-full border border-[#63452e] text-[#d4c3b6] transition-[background-color,color] duration-200 hover:bg-[#d95d39]/15 hover:text-white"><Minus size={14} /></button><span data-testid="servings-value" className="min-w-16 text-center font-heading text-lg font-semibold text-[#f7efe9]">{servings} <span className="text-xs font-normal text-[#9e8b7b]">servings</span></span><button data-testid="servings-increase-button" type="button" onClick={() => setServings((value) => Math.min(24, value + 1))} className="flex h-8 w-8 items-center justify-center rounded-full border border-[#63452e] text-[#d4c3b6] transition-[background-color,color] duration-200 hover:bg-[#d95d39]/15 hover:text-white"><Plus size={14} /></button></div></div><div className="flex flex-col gap-2 sm:flex-row"><Button data-testid="compare-methods-button" onClick={runComparison} disabled={compareMutation.isPending} variant="outline" className="h-12 border-[#6a492d] bg-transparent px-5 text-[#f7efe9] hover:bg-[#d95d39]/10 hover:text-white">{compareMutation.isPending ? "Comparing..." : "Compare methods"}</Button><Button data-testid="simulate-nutrition-button" onClick={runSimulation} disabled={calculateMutation.isPending} className="h-12 bg-[#d95d39] px-6 font-semibold text-white shadow-[0_8px_24px_rgba(217,93,57,0.2)] transition-[background-color,transform] duration-200 hover:-translate-y-0.5 hover:bg-[#bf4d2d]">{calculateMutation.isPending ? "Simulating..." : "Simulate my pot"}<Sparkles className="ml-2" size={17} /></Button></div></div>
          </div>

          <aside data-testid="nutrition-dashboard" className="space-y-6 lg:sticky lg:top-6">
            <Card data-testid="nutrition-cockpit-card" className="glass-panel overflow-hidden border-[#6a492d]">
              <CardHeader className="border-b border-[#3d3028]/80 px-5 pb-4 pt-5"><div className="flex items-center justify-between"><div><p data-testid="dashboard-eyebrow" className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#e5a93c]">Nutrition cockpit</p><CardTitle data-testid="dashboard-title" className="mt-1 font-heading text-2xl text-[#f7efe9]">Your pot, decoded</CardTitle></div><div data-testid="dashboard-status-icon" className="rounded-xl bg-[#d95d39]/10 p-2.5 text-[#d95d39]"><Gauge size={18} /></div></div></CardHeader>
              <CardContent className="p-5">
                <div data-testid="calorie-hero-metric" className="mb-5 rounded-2xl border border-[#d95d39]/25 bg-gradient-to-br from-[#3d2117] to-[#241711] p-5"><div className="flex items-center justify-between"><p data-testid="calorie-hero-label" className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#e5a93c]">Total calories</p><span data-testid="calorie-hero-badge" className="rounded-full bg-[#d95d39]/15 px-2 py-1 text-[10px] text-[#f2b197]">{result ? "simulated" : "awaiting pot"}</span></div><p data-testid="nutrition-total-calories" className="mt-3 font-heading text-5xl font-bold tracking-tight text-[#fff5e8]">{result ? prettyNumber(total.calories) : "—"}<span className="ml-2 text-sm font-medium text-[#a99485]">kcal</span></p><p data-testid="calorie-per-serving" className="mt-2 text-xs text-[#bba79a]">{result ? `${prettyNumber(perServing.calories)} kcal per serving` : "Run a simulation to see your serving size"}</p></div>
                <div data-testid="macro-grid" className="grid grid-cols-2 gap-3"><NutritionMetric testId="nutrition-total-protein" label="Protein" value={result ? prettyNumber(total.protein) : "—"} suffix="g" accent="#e5a93c" /><NutritionMetric testId="nutrition-total-carbs" label="Carbs" value={result ? prettyNumber(total.carbs) : "—"} suffix="g" accent="#d95d39" /><NutritionMetric testId="nutrition-total-fat" label="Fat" value={result ? prettyNumber(total.fat) : "—"} suffix="g" accent="#f28a2e" /><NutritionMetric testId="nutrition-total-fiber" label="Fiber" value={result ? prettyNumber(total.fiber) : "—"} suffix="g" accent="#5b8a62" /></div>
                <div data-testid="micronutrient-section" className="mt-6 border-t border-[#3d3028] pt-5"><div className="mb-4 flex items-center justify-between"><p data-testid="micronutrient-title" className="font-heading text-base font-semibold text-[#f7efe9]">Essential micros</p><p data-testid="micronutrient-serving-note" className="text-[10px] uppercase tracking-[0.12em] text-[#8c7a6d]">total pot</p></div><div className="space-y-4"><MicroBar testId="micronutrient-sodium" label="Sodium" value={total.sodium} max={2300} suffix="mg" /><MicroBar testId="micronutrient-iron" label="Iron" value={total.iron} max={18} suffix="mg" /><MicroBar testId="micronutrient-calcium" label="Calcium" value={total.calcium} max={1000} suffix="mg" /><MicroBar testId="micronutrient-b12" label="Vitamin B12" value={total.b12} max={2.4} suffix="mcg" /></div></div>
              </CardContent>
            </Card>

            <Card data-testid="cooking-impact-card" className="border-[#3d3028] bg-[#211813]/90"><CardHeader className="px-5 pb-3 pt-5"><p data-testid="cooking-impact-eyebrow" className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#d95d39]">Cooking impact</p><CardTitle data-testid="cooking-impact-title" className="mt-1 font-heading text-xl text-[#f7efe9]">{selectedMethod?.label ?? "Choose a method"}</CardTitle></CardHeader><CardContent className="px-5 pb-5"><div className="grid grid-cols-2 gap-3"><div data-testid="raw-weight-metric" className="rounded-xl bg-[#18120f] p-3"><p data-testid="raw-weight-label" className="text-[10px] uppercase tracking-[0.12em] text-[#8c7a6d]">Raw weight</p><p data-testid="raw-weight-value" className="mt-1 font-mono text-lg text-[#f7efe9]">{result ? `${prettyNumber(result.raw_weight_g)} g` : "—"}</p></div><div data-testid="cooked-weight-metric" className="rounded-xl bg-[#18120f] p-3"><p data-testid="cooked-weight-label" className="text-[10px] uppercase tracking-[0.12em] text-[#8c7a6d]">Cooked yield</p><p data-testid="cooked-weight-value" className="mt-1 font-mono text-lg text-[#f2b15e]">{result ? `${prettyNumber(result.cooked_weight_g)} g` : "—"}</p></div></div><div data-testid="oil-uptake-metric" className="mt-3 flex items-center justify-between rounded-xl border border-[#4b3525] px-3 py-3"><span data-testid="oil-uptake-label" className="text-xs text-[#bba79a]">Estimated oil absorbed</span><span data-testid="oil-uptake-value" className="font-mono text-sm text-[#e5a93c]">{result ? `${prettyNumber(result.oil_uptake_g)} g` : "—"}</span></div><div data-testid="raw-cooked-nutrition-comparison" className="mt-4 rounded-2xl border border-[#4b3525] bg-[#18120f]/70 p-3"><div className="mb-3 flex items-center justify-between"><p data-testid="raw-cooked-comparison-title" className="text-xs font-semibold text-[#f7efe9]">Raw → cooked nutrition</p><p data-testid="raw-cooked-comparison-note" className="text-[9px] uppercase tracking-[0.12em] text-[#8c7a6d]">total pot</p></div><div className="space-y-2">{NUTRITION_COMPARISON.map((item) => <div data-testid={`raw-cooked-row-${item.key}`} key={item.key} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 text-xs"><span data-testid={`raw-cooked-label-${item.key}`} className="text-[#a99485]">{item.label}</span><span data-testid={`raw-nutrition-${item.key}`} className="font-mono text-[#8c7a6d]">{result ? `${prettyNumber(rawTotal[item.key])}${item.suffix}` : "—"}</span><span data-testid={`cooked-nutrition-${item.key}`} className="font-mono text-[#f2b15e]">{result ? `${prettyNumber(total[item.key])}${item.suffix}` : "—"}</span></div>)}</div><div className="mt-2 flex justify-end gap-4 text-[9px] uppercase tracking-[0.12em] text-[#725f52]"><span data-testid="raw-legend">raw</span><span data-testid="cooked-legend" className="text-[#b99556]">cooked</span></div></div><p data-testid="cooking-note" className="mt-4 text-xs leading-5 text-[#9e8b7b]">{result?.cooking_note ?? "Select a cooking method and run the simulation to see how water loss, absorption, and retention affect your dish."}</p></CardContent></Card>
            {comparison.length > 0 && <Card data-testid="method-comparison-card" className="glass-panel border-[#6a492d]"><CardHeader className="px-5 pb-3 pt-5"><p data-testid="method-comparison-eyebrow" className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#e5a93c]">Same pot, three paths</p><CardTitle data-testid="method-comparison-title" className="mt-1 font-heading text-xl text-[#f7efe9]">Method comparison</CardTitle><p data-testid="method-comparison-description" className="mt-1 text-xs leading-5 text-[#9e8b7b]">Base presets across the current ingredients and servings.</p></CardHeader><CardContent className="grid gap-2 px-5 pb-5 sm:grid-cols-3">{comparison.map((item) => { const methodInfo = methods.find((method) => method.key === item.cooking_method); return <div data-testid={`method-compare-${item.cooking_method}-card`} key={item.cooking_method} className="rounded-2xl border border-[#4b3525] bg-[#18120f]/80 p-3"><div className="flex items-center justify-between gap-2"><p data-testid={`method-compare-${item.cooking_method}-label`} className="text-xs font-semibold text-[#f7efe9]">{methodInfo?.label ?? item.cooking_method}</p><span data-testid={`method-compare-${item.cooking_method}-oil`} className="font-mono text-[9px] text-[#e5a93c]">+{prettyNumber(item.oil_uptake_g)}g oil</span></div><p data-testid={`method-compare-${item.cooking_method}-calories`} className="mt-4 font-heading text-2xl font-semibold text-[#f2b15e]">{prettyNumber(item.per_serving.calories)} <span className="text-[10px] font-normal text-[#9e8b7b]">kcal / serving</span></p><div className="mt-3 space-y-2 text-[10px]"><div className="flex justify-between"><span data-testid={`method-compare-${item.cooking_method}-protein-label`} className="text-[#8c7a6d]">Protein</span><span data-testid={`method-compare-${item.cooking_method}-protein`} className="font-mono text-[#d4c3b6]">{prettyNumber(item.per_serving.protein)}g</span></div><div className="flex justify-between"><span data-testid={`method-compare-${item.cooking_method}-fat-label`} className="text-[#8c7a6d]">Fat</span><span data-testid={`method-compare-${item.cooking_method}-fat`} className="font-mono text-[#d4c3b6]">{prettyNumber(item.per_serving.fat)}g</span></div><div className="flex justify-between"><span data-testid={`method-compare-${item.cooking_method}-yield-label`} className="text-[#8c7a6d]">Cooked yield</span><span data-testid={`method-compare-${item.cooking_method}-yield`} className="font-mono text-[#d4c3b6]">{prettyNumber(item.cooked_weight_g)}g</span></div></div></div>})}</CardContent></Card>}
          </aside>
        </section>
      </main>
      <footer data-testid="app-footer" className="relative z-10 mx-auto flex max-w-7xl items-center justify-between border-t border-[#3d3028]/70 px-4 py-6 text-[10px] uppercase tracking-[0.15em] text-[#725f52] sm:px-6 lg:px-8"><span data-testid="footer-brand">Virtual Rasoi / 2026</span><span data-testid="footer-note">Made for curious cooks</span></footer>
    </div>
  );
}