# Virtual Rasoi living spec

## Purpose
Virtual Rasoi is a dark, warm Indian kitchen nutrition simulator. Users can load a preloaded Indian recipe or search a catalog of ingredients, choose a measurement unit and quantity, choose a cooking method, and simulate the resulting nutrition and cooked weight.

## Data model
- `IngredientCatalogItem`: ingredient identity, category, unit conversion hints, and nutrition per 100 g for calories, protein, carbs, fat, fiber, sodium, iron, and calcium.
- `Recipe`: region, description, default cooking method, and ingredient quantity/unit entries.
- `CalculateRequest`: ingredient entries, cooking method, and servings.
- `CalculateResponse`: raw and cooked weight, absorbed oil, totals, per-serving nutrition, ingredient conversions, and cooking note.

## Key flows
1. Open the calculator and browse the ten preloaded recipe cards, including chicken, mutton, fish, prawn, and non-vegetarian biryani recipes.
2. Load a recipe into the virtual pot; adjust ingredient quantities/units or add catalog ingredients.
3. Select boiling, frying, deep frying, sautéing, roasting, pressure cooking, steaming, or baking.
4. Set servings and run the simulation to see macro totals, micronutrients, weight changes, and absorbed oil.
5. Filter the ingredient browser to Non-veg; chicken, mutton, fish, prawns, eggs, crab, squid, and salmon are measured in grams.
6. Filter the ingredient browser to Spices to add iodized table salt; it contributes sodium while adding zero calories and macros.
7. Filter the ingredient browser to Vegetables to browse a broad Indian catalog of regional gourds, greens, roots, beans, brassicas, fruits used as vegetables, and seasonal produce with English/regional names.

## Backend
Catalog and calculation endpoints are stateless under `/api/catalog`. Nutrient values are curated estimates, not a medical or regulatory database. No authentication or user roles are implemented in this MVP.