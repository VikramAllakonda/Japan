# Virtual Rasoi living spec

## Purpose
Virtual Rasoi is a dark, warm Indian kitchen nutrition simulator. Users can load a preloaded Indian recipe or search a catalog of ingredients, choose a measurement unit and quantity, choose a cooking method, and simulate the resulting nutrition and cooked weight.

## Data model
- `IngredientCatalogItem`: ingredient identity, category, unit conversion hints, and nutrition per 100 g for calories, protein, carbs, fat, fiber, sodium, iron, calcium, and vitamin B12 in micrograms.
- `Recipe`: region, description, breakfast/main-dish meal type, vegetarian/non-vegetarian dietary type, default cooking method, and ingredient quantity/unit entries.
- `CalculateRequest`: ingredient entries, cooking method, servings, optional oil-absorption override, and optional nutrient-retention multiplier.
- `CalculateResponse`: raw and cooked weight, absorbed oil, raw totals, cooking-adjusted totals, per-serving nutrition, ingredient conversions, and cooking note.

## Key flows
1. Open the calculator and browse the ten preloaded recipe cards, including chicken, mutton, fish, prawn, and non-vegetarian biryani recipes.
2. Load a recipe into the virtual pot; adjust ingredient quantities/units or add catalog ingredients.
3. Select boiling, frying, deep frying, sautéing, roasting, pressure cooking, steaming, or baking.
4. Set servings and run the simulation to see raw versus cooking-adjusted macro/micronutrient totals, weight changes, absorbed oil, and per-serving nutrition.
5. Filter the ingredient browser to Non-veg; chicken, mutton, fish, prawns, eggs, crab, squid, and salmon are measured in grams.
6. Filter the ingredient browser to Spices to add iodized table salt; it contributes sodium while adding zero calories and macros.
7. Filter the ingredient browser to Vegetables to browse a broad Indian catalog of regional gourds, greens, roots, beans, brassicas, fruits used as vegetables, and seasonal produce with English/regional names.
8. Tune the selected method's oil absorption and nutrient retention for the current simulation, then compare the current pot across boiling, frying, and pressure cooking.
9. Simulate any pot to see cooking-adjusted vitamin B12 alongside sodium, iron, and calcium; animal and dairy foods contribute curated B12 values.
10. Choose the number of servings before simulation; the app keeps total-pot values and shows a dedicated card where all nine nutrients are divided evenly per serving.
11. Filter the recipe shelf by All, Breakfast, Main Dish, Vegetarian, or Non-Vegetarian; load one of 24 regional breakfast templates or add the matching prepared breakfast food directly from the ingredient browser.
12. Add soya chunks from Pulses or cold-pressed groundnut/coconut oil from Oils & Fats to any custom pot.
13. One plain dosa is treated as approximately 100 g when selected by piece/count.

## Backend
Catalog and calculation endpoints are stateless under `/api/catalog`. Nutrient values are curated estimates, not a medical or regulatory database. No authentication or user roles are implemented in this MVP.