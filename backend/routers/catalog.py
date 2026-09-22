from fastapi import APIRouter, HTTPException

from models.nutrition import (
    CalculateRequest,
    CalculateResponse,
    CalculatedIngredient,
    CookingMethod,
    CookingMethodInfo,
    IngredientCatalogItem,
    Nutrition,
    Recipe,
    Unit,
)

router = APIRouter(prefix="/catalog", tags=["catalog"])


def _ingredient(
    ingredient_id: str,
    name: str,
    category: str,
    nutrition: tuple[float, float, float, float, float, float, float, float],
    default_unit: Unit = "grams",
    piece_weight_g: float = 0,
    tablespoon_weight_g: float = 6,
    b12: float = 0,
) -> IngredientCatalogItem:
    return IngredientCatalogItem(
        id=ingredient_id,
        name=name,
        category=category,
        default_unit=default_unit,
        piece_weight_g=piece_weight_g,
        tablespoon_weight_g=tablespoon_weight_g,
        nutrition_per_100g=Nutrition(
            calories=nutrition[0],
            protein=nutrition[1],
            carbs=nutrition[2],
            fat=nutrition[3],
            fiber=nutrition[4],
            sodium=nutrition[5],
            iron=nutrition[6],
            calcium=nutrition[7],
            b12=b12,
        ),
    )


INGREDIENTS = [
    _ingredient("toor-dal", "Toor Dal", "Pulses", (343, 22, 63, 1.7, 15, 30, 5.2, 73)),
    _ingredient("moong-dal", "Moong Dal", "Pulses", (347, 24, 63, 1.2, 16, 15, 6.7, 132)),
    _ingredient("chickpeas", "Chickpeas", "Pulses", (364, 19, 61, 6, 17, 24, 6.2, 105)),
    _ingredient("rajma", "Rajma", "Pulses", (333, 24, 60, 1, 25, 24, 8.2, 143)),
    _ingredient("basmati-rice", "Basmati Rice", "Grains", (365, 7.1, 80, 0.7, 1.3, 5, 1.1, 28)),
    _ingredient("atta", "Whole Wheat Atta", "Grains", (340, 13, 72, 2.5, 10.7, 5, 3.9, 34)),
    _ingredient("poha", "Poha", "Grains", (350, 6.6, 77, 1, 2.8, 5, 20, 20)),
    _ingredient("paneer", "Paneer", "Dairy", (265, 18.3, 6.1, 20.8, 0, 22, 2.2, 208), b12=0.8),
    _ingredient("yogurt", "Yogurt / Curd", "Dairy", (61, 3.5, 4.7, 3.3, 0, 46, 0.1, 121), b12=0.4),
    _ingredient("butter", "Butter", "Oils & Fats", (717, 0.9, 0.1, 81, 0, 643, 0, 24), tablespoon_weight_g=14, b12=0.2),
    _ingredient("ghee", "Ghee", "Oils & Fats", (900, 0, 0, 100, 0, 0, 0, 0), tablespoon_weight_g=14),
    _ingredient("mustard-oil", "Mustard Oil", "Oils & Fats", (884, 0, 0, 100, 0, 0, 0, 0), tablespoon_weight_g=14),
    _ingredient("tomato", "Tomato", "Vegetables", (18, 0.9, 3.9, 0.2, 1.2, 5, 0.3, 10), "pieces_count", 90),
    _ingredient("onion", "Onion", "Vegetables", (40, 1.1, 9.3, 0.1, 1.7, 4, 0.2, 23), "pieces_count", 110),
    _ingredient("potato", "Potato", "Vegetables", (77, 2, 17.5, 0.1, 2.2, 6, 0.8, 12), "pieces_count", 150),
    _ingredient("spinach", "Spinach", "Vegetables", (23, 2.9, 3.6, 0.4, 2.2, 79, 2.7, 99)),
    _ingredient("carrot", "Carrot", "Vegetables", (41, 0.9, 9.6, 0.2, 2.8, 69, 0.3, 33), "pieces_count", 60),
    _ingredient("mixed-vegetables", "Mixed Vegetables", "Vegetables", (65, 2.8, 12, 0.5, 4, 35, 1.1, 35)),
    _ingredient("green-chili", "Green Chili", "Vegetables", (40, 2, 9, 0.4, 1.5, 7, 1, 18), "pieces_count", 5),
    _ingredient("bottle-gourd", "Bottle Gourd (Lauki / Sorakaya)", "Vegetables", (15, 0.6, 3.4, 0.1, 1.2, 2, 0.3, 26)),
    _ingredient("ridge-gourd", "Ridge Gourd (Turai / Beerakaya)", "Vegetables", (20, 0.6, 4.3, 0.2, 2, 3, 0.4, 20)),
    _ingredient("sponge-gourd", "Sponge Gourd (Nenua / Beerekai)", "Vegetables", (20, 1.2, 4.4, 0.2, 2, 3, 0.4, 18)),
    _ingredient("bitter-gourd", "Bitter Gourd (Karela / Kakara)", "Vegetables", (34, 3.6, 7, 0.2, 2.8, 5, 1, 19)),
    _ingredient("ash-gourd", "Ash Gourd (Petha / Boodida Gummadikaya)", "Vegetables", (13, 0.4, 3, 0.2, 2.9, 2, 0.3, 19)),
    _ingredient("snake-gourd", "Snake Gourd (Padwal / Potlakaya)", "Vegetables", (18, 1.2, 3.4, 0.2, 2, 3, 0.4, 28)),
    _ingredient("pumpkin", "Pumpkin (Kaddu / Gummadikaya)", "Vegetables", (26, 1, 6.5, 0.1, 0.5, 1, 0.8, 21)),
    _ingredient("okra", "Okra (Bhindi / Bendakaya)", "Vegetables", (33, 1.9, 7.5, 0.2, 3.2, 7, 0.6, 82)),
    _ingredient("eggplant", "Eggplant (Baingan / Vankaya)", "Vegetables", (25, 1, 6, 0.2, 3, 2, 0.2, 9)),
    _ingredient("cauliflower", "Cauliflower (Phool Gobhi)", "Vegetables", (25, 1.9, 5, 0.3, 2, 30, 0.4, 22)),
    _ingredient("cabbage", "Cabbage (Patta Gobhi)", "Vegetables", (25, 1.3, 6, 0.1, 2.5, 18, 0.5, 40)),
    _ingredient("broccoli", "Broccoli", "Vegetables", (34, 2.8, 7, 0.4, 2.6, 33, 0.7, 47)),
    _ingredient("french-beans", "French Beans (Sem)", "Vegetables", (31, 1.8, 7, 0.2, 2.7, 6, 1, 37)),
    _ingredient("cluster-beans", "Cluster Beans (Gawar)", "Vegetables", (16, 3.1, 3, 0.4, 3.7, 14, 1, 156)),
    _ingredient("broad-beans", "Broad Beans (Avarakkai / Sem)", "Vegetables", (88, 7.9, 18.7, 0.7, 7.5, 25, 1.5, 37)),
    _ingredient("green-peas", "Green Peas (Matar / Batani)", "Vegetables", (81, 5.4, 14.5, 0.4, 5.7, 5, 1.5, 25)),
    _ingredient("drumstick", "Drumstick (Moringa / Munagakaya)", "Vegetables", (64, 9.4, 8.3, 1.4, 2, 9, 4, 185)),
    _ingredient("raw-banana", "Raw Banana (Kaccha Kela / Aratikaya)", "Vegetables", (122, 1.3, 31, 0.4, 2.3, 4, 0.6, 15)),
    _ingredient("yam", "Yam (Suran / Kandagadda)", "Vegetables", (118, 1.5, 27, 0.2, 4, 9, 0.5, 17)),
    _ingredient("colocasia", "Colocasia (Arbi / Chamadumpa)", "Vegetables", (142, 0.5, 34.6, 0.1, 5.1, 11, 0.6, 43)),
    _ingredient("sweet-potato", "Sweet Potato (Shakarkand)", "Vegetables", (86, 1.6, 20, 0.1, 3, 55, 0.6, 30)),
    _ingredient("beetroot", "Beetroot (Chukandar)", "Vegetables", (43, 1.6, 10, 0.2, 2.8, 78, 0.8, 16)),
    _ingredient("radish", "Radish (Mooli / Mullangi)", "Vegetables", (16, 0.7, 3.4, 0.1, 1.6, 39, 0.3, 25)),
    _ingredient("turnip", "Turnip (Shalgam)", "Vegetables", (28, 0.9, 6.4, 0.1, 1.8, 67, 0.3, 30)),
    _ingredient("cucumber", "Cucumber (Kheera / Dosakaya)", "Vegetables", (15, 0.7, 3.6, 0.1, 0.5, 2, 0.3, 16)),
    _ingredient("capsicum", "Capsicum (Shimla Mirch)", "Vegetables", (20, 0.9, 4.6, 0.2, 1.7, 3, 0.4, 10)),
    _ingredient("corn", "Sweet Corn (Bhutta / Mokka Jonna)", "Vegetables", (86, 3.3, 19, 1.4, 2.7, 15, 0.5, 2)),
    _ingredient("mushroom", "Button Mushroom", "Vegetables", (22, 3.1, 3.3, 0.3, 1, 5, 0.5, 3)),
    _ingredient("fenugreek-leaves", "Fenugreek Leaves (Methi)", "Vegetables", (49, 4.4, 6, 0.9, 1.1, 76, 1.9, 395)),
    _ingredient("amaranth-leaves", "Amaranth Leaves (Chaulai / Thotakura)", "Vegetables", (23, 2.5, 4, 0.3, 2.1, 20, 2.3, 215)),
    _ingredient("mustard-greens", "Mustard Greens (Sarson / Avalu Aaku)", "Vegetables", (27, 2.9, 4.7, 0.4, 3.2, 20, 1.6, 115)),
    _ingredient("bathua", "Bathua Greens (Chenopodium)", "Vegetables", (43, 4.2, 7.3, 0.8, 4.2, 230, 2.3, 309)),
    _ingredient("spring-onion", "Spring Onion (Hara Pyaz)", "Vegetables", (32, 1.8, 7.3, 0.2, 2.6, 16, 1.5, 72)),
    _ingredient("chayote", "Chayote (Chow Chow / Bangalore Vankaya)", "Vegetables", (19, 0.8, 4.5, 0.1, 1.7, 2, 0.3, 17)),
    _ingredient("ivy-gourd", "Ivy Gourd (Tindora / Dondakaya)", "Vegetables", (19, 1, 4.2, 0.1, 1.6, 2, 0.4, 18)),
    _ingredient("raw-papaya", "Raw Papaya (Kaccha Papita / Boppayi Kaya)", "Vegetables", (43, 0.5, 10, 0.3, 1.7, 3, 0.2, 20)),
    _ingredient("jackfruit", "Raw Jackfruit (Kathal / Panasa Kaya)", "Vegetables", (95, 1.7, 23, 0.6, 1.5, 2, 0.6, 24)),
    _ingredient("lotus-root", "Lotus Root (Kamal Kakdi / Tamara Dantu)", "Vegetables", (74, 2.6, 17, 0.1, 4.9, 40, 1.2, 45)),
    _ingredient("zucchini", "Zucchini (Courgette)", "Vegetables", (17, 1.2, 3.1, 0.3, 1, 8, 0.4, 16)),
    _ingredient("baby-corn", "Baby Corn", "Vegetables", (26, 2.5, 5.1, 0.2, 2.7, 1, 0.5, 3)),
    _ingredient("colocasia-leaves", "Colocasia Leaves (Arbi Patta)", "Vegetables", (42, 4.3, 6.7, 0.7, 3.7, 14, 1.9, 227)),
    _ingredient("banana-flower", "Banana Flower (Kele ka Phool)", "Vegetables", (51, 1.6, 11, 0.6, 5.7, 11, 1.6, 56)),
    _ingredient("water-chestnut", "Water Chestnut (Singhara)", "Vegetables", (97, 1.4, 23.9, 0.1, 3, 14, 0.6, 10)),
    _ingredient("fennel-bulb", "Fennel Bulb (Saunf)", "Vegetables", (31, 1.2, 7.3, 0.2, 3.1, 52, 0.7, 49)),
    _ingredient("garlic", "Garlic", "Aromatics", (149, 6.4, 33, 0.5, 2.1, 17, 1.7, 181), "pieces_count", 3),
    _ingredient("ginger", "Ginger", "Aromatics", (80, 1.8, 18, 0.8, 2, 13, 0.6, 16)),
    _ingredient("tamarind", "Tamarind Extract", "Tangy & Fresh", (239, 2.8, 62, 0.6, 5.1, 28, 2.8, 74), "tablespoons", tablespoon_weight_g=15),
    _ingredient("lemon", "Lemon Juice", "Tangy & Fresh", (22, 0.4, 6.9, 0.2, 0.3, 1, 0.1, 6), "tablespoons", tablespoon_weight_g=15),
    _ingredient("turmeric", "Turmeric Powder", "Spices", (312, 9.7, 67, 3.2, 23, 27, 41, 168), "tablespoons", tablespoon_weight_g=6),
    _ingredient("cumin", "Cumin Seeds", "Spices", (375, 18, 44, 22, 11, 168, 66, 931), "tablespoons", tablespoon_weight_g=6),
    _ingredient("mustard-seeds", "Mustard Seeds", "Spices", (508, 26, 28, 36, 12, 13, 9.2, 266), "tablespoons", tablespoon_weight_g=6),
    _ingredient("garam-masala", "Garam Masala", "Spices", (380, 12, 55, 14, 20, 50, 15, 400), "tablespoons", tablespoon_weight_g=6),
    _ingredient("red-chili", "Red Chili Powder", "Spices", (282, 13.5, 50, 14, 35, 286, 7.7, 148), "tablespoons", tablespoon_weight_g=6),
    _ingredient("coriander-powder", "Coriander Powder", "Spices", (298, 13, 55, 17, 42, 35, 16, 709), "tablespoons", tablespoon_weight_g=6),
    _ingredient("iodized-salt", "Table Salt (Iodized)", "Spices", (0, 0, 0, 0, 0, 38758, 0, 24), "tablespoons", tablespoon_weight_g=18),
    _ingredient("cashew", "Cashew Nuts", "Nuts & Seeds", (553, 18, 30, 44, 3.3, 12, 6.7, 37)),
    _ingredient("cream", "Heavy Cream", "Dairy", (340, 2.1, 2.8, 36, 0, 27, 0, 65), "tablespoons", tablespoon_weight_g=15, b12=0.2),
    _ingredient("water", "Water", "Liquids", (0, 0, 0, 0, 0, 0, 0, 0), "milliliters"),
    _ingredient("chicken", "Chicken", "Non-veg", (239, 27.3, 0, 13.6, 0, 82, 1.3, 15), b12=0.3),
    _ingredient("mutton", "Mutton (Goat)", "Non-veg", (294, 25, 0, 21, 0, 72, 2.1, 17), b12=2.6),
    _ingredient("rohu-fish", "Rohu Fish", "Non-veg", (97, 20.5, 0, 1.5, 0, 60, 1, 60), b12=2.4),
    _ingredient("salmon", "Salmon", "Non-veg", (208, 20.4, 0, 13.4, 0, 59, 0.5, 9), b12=3.2),
    _ingredient("prawns", "Prawns / Shrimp", "Non-veg", (99, 24, 0.2, 0.3, 0, 111, 0.5, 70), b12=1.8),
    _ingredient("egg", "Egg", "Non-veg", (143, 12.6, 0.7, 9.5, 0, 142, 1.8, 56), b12=1.1),
    _ingredient("crab", "Crab", "Non-veg", (97, 19, 0, 1.5, 0, 107, 0.8, 59), b12=3.3),
    _ingredient("squid", "Squid", "Non-veg", (92, 15.6, 3.1, 1.4, 0, 44, 0.7, 32), b12=1.3),
]

INGREDIENT_BY_ID = {item.id: item for item in INGREDIENTS}

RECIPES = [
    Recipe(
        id="andhra-pappu",
        name="Andhra Tomato Pappu",
        region="Andhra Pradesh",
        description="Tangy yellow lentils with tomato, green chilli, garlic, and a fragrant tadka.",
        default_cooking_method="pressure_cooking",
        ingredients=[
            {"ingredient_id": "toor-dal", "quantity": 100, "unit": "grams"},
            {"ingredient_id": "water", "quantity": 300, "unit": "milliliters"},
            {"ingredient_id": "tomato", "quantity": 2, "unit": "pieces_count"},
            {"ingredient_id": "green-chili", "quantity": 2, "unit": "pieces_count"},
            {"ingredient_id": "tamarind", "quantity": 1, "unit": "tablespoons"},
            {"ingredient_id": "turmeric", "quantity": 0.5, "unit": "tablespoons"},
            {"ingredient_id": "mustard-seeds", "quantity": 0.5, "unit": "tablespoons"},
            {"ingredient_id": "cumin", "quantity": 0.5, "unit": "tablespoons"},
            {"ingredient_id": "garlic", "quantity": 4, "unit": "pieces_count"},
            {"ingredient_id": "ghee", "quantity": 1, "unit": "tablespoons"},
        ],
    ),
    Recipe(
        id="paneer-butter-masala",
        name="Paneer Butter Masala",
        region="North India",
        description="Soft paneer in a silky tomato-cashew gravy with butter and warming masala.",
        default_cooking_method="sauteing",
        ingredients=[
            {"ingredient_id": "paneer", "quantity": 200, "unit": "grams"},
            {"ingredient_id": "tomato", "quantity": 3, "unit": "pieces_count"},
            {"ingredient_id": "onion", "quantity": 1, "unit": "pieces_count"},
            {"ingredient_id": "butter", "quantity": 2, "unit": "tablespoons"},
            {"ingredient_id": "cream", "quantity": 2, "unit": "tablespoons"},
            {"ingredient_id": "cashew", "quantity": 15, "unit": "grams"},
            {"ingredient_id": "garam-masala", "quantity": 0.5, "unit": "tablespoons"},
            {"ingredient_id": "red-chili", "quantity": 1, "unit": "tablespoons"},
        ],
    ),
    Recipe(
        id="chana-masala",
        name="Amritsari Chana Masala",
        region="Punjab",
        description="Slow-spiced chickpeas with onion, tomato, mustard oil, and a bold masala base.",
        default_cooking_method="pressure_cooking",
        ingredients=[
            {"ingredient_id": "chickpeas", "quantity": 120, "unit": "grams"},
            {"ingredient_id": "water", "quantity": 350, "unit": "milliliters"},
            {"ingredient_id": "onion", "quantity": 2, "unit": "pieces_count"},
            {"ingredient_id": "tomato", "quantity": 2, "unit": "pieces_count"},
            {"ingredient_id": "mustard-oil", "quantity": 1.5, "unit": "tablespoons"},
            {"ingredient_id": "garam-masala", "quantity": 1, "unit": "tablespoons"},
            {"ingredient_id": "ginger", "quantity": 10, "unit": "grams"},
        ],
    ),
    Recipe(
        id="veg-dum-biryani",
        name="Hyderabadi Veg Dum Biryani",
        region="Telangana",
        description="Fragrant basmati rice layered with vegetables, curd, ghee, and whole spices.",
        default_cooking_method="steaming",
        ingredients=[
            {"ingredient_id": "basmati-rice", "quantity": 150, "unit": "grams"},
            {"ingredient_id": "mixed-vegetables", "quantity": 150, "unit": "grams"},
            {"ingredient_id": "yogurt", "quantity": 4, "unit": "tablespoons"},
            {"ingredient_id": "ghee", "quantity": 2, "unit": "tablespoons"},
            {"ingredient_id": "onion", "quantity": 1, "unit": "pieces_count"},
            {"ingredient_id": "cumin", "quantity": 1, "unit": "tablespoons"},
            {"ingredient_id": "garam-masala", "quantity": 0.5, "unit": "tablespoons"},
        ],
    ),
    Recipe(
        id="andhra-chicken-curry",
        name="Andhra Chicken Curry",
        region="Andhra Pradesh",
        description="Tender chicken simmered in a fiery onion-tomato masala with ginger, garlic, and chilli.",
        default_cooking_method="pressure_cooking",
        ingredients=[
            {"ingredient_id": "chicken", "quantity": 500, "unit": "grams"},
            {"ingredient_id": "onion", "quantity": 2, "unit": "pieces_count"},
            {"ingredient_id": "tomato", "quantity": 2, "unit": "pieces_count"},
            {"ingredient_id": "mustard-oil", "quantity": 2, "unit": "tablespoons"},
            {"ingredient_id": "ginger", "quantity": 15, "unit": "grams"},
            {"ingredient_id": "garlic", "quantity": 6, "unit": "pieces_count"},
            {"ingredient_id": "red-chili", "quantity": 1, "unit": "tablespoons"},
            {"ingredient_id": "turmeric", "quantity": 0.5, "unit": "tablespoons"},
            {"ingredient_id": "coriander-powder", "quantity": 1, "unit": "tablespoons"},
        ],
    ),
    Recipe(
        id="mutton-curry",
        name="Slow Mutton Curry",
        region="Rajasthan",
        description="Goat meat cooked low and slow with yogurt, whole spices, and a deep red masala.",
        default_cooking_method="pressure_cooking",
        ingredients=[
            {"ingredient_id": "mutton", "quantity": 500, "unit": "grams"},
            {"ingredient_id": "onion", "quantity": 2, "unit": "pieces_count"},
            {"ingredient_id": "yogurt", "quantity": 3, "unit": "tablespoons"},
            {"ingredient_id": "mustard-oil", "quantity": 2, "unit": "tablespoons"},
            {"ingredient_id": "ginger", "quantity": 15, "unit": "grams"},
            {"ingredient_id": "garlic", "quantity": 6, "unit": "pieces_count"},
            {"ingredient_id": "garam-masala", "quantity": 1, "unit": "tablespoons"},
            {"ingredient_id": "red-chili", "quantity": 1, "unit": "tablespoons"},
        ],
    ),
    Recipe(
        id="bengali-fish-curry",
        name="Bengali Rohu Fish Curry",
        region="West Bengal",
        description="Rohu fillets in a light mustard-tomato jhol with turmeric and a bright tamarind finish.",
        default_cooking_method="frying",
        ingredients=[
            {"ingredient_id": "rohu-fish", "quantity": 500, "unit": "grams"},
            {"ingredient_id": "tomato", "quantity": 2, "unit": "pieces_count"},
            {"ingredient_id": "onion", "quantity": 1, "unit": "pieces_count"},
            {"ingredient_id": "mustard-oil", "quantity": 2, "unit": "tablespoons"},
            {"ingredient_id": "turmeric", "quantity": 0.5, "unit": "tablespoons"},
            {"ingredient_id": "red-chili", "quantity": 0.5, "unit": "tablespoons"},
            {"ingredient_id": "tamarind", "quantity": 1, "unit": "tablespoons"},
        ],
    ),
    Recipe(
        id="prawn-masala",
        name="Coastal Prawn Masala",
        region="Konkan Coast",
        description="Juicy prawns tossed through a fragrant coconut-coast inspired onion, garlic, and chilli masala.",
        default_cooking_method="sauteing",
        ingredients=[
            {"ingredient_id": "prawns", "quantity": 400, "unit": "grams"},
            {"ingredient_id": "onion", "quantity": 1, "unit": "pieces_count"},
            {"ingredient_id": "tomato", "quantity": 2, "unit": "pieces_count"},
            {"ingredient_id": "mustard-oil", "quantity": 1.5, "unit": "tablespoons"},
            {"ingredient_id": "ginger", "quantity": 10, "unit": "grams"},
            {"ingredient_id": "garlic", "quantity": 4, "unit": "pieces_count"},
            {"ingredient_id": "red-chili", "quantity": 1, "unit": "tablespoons"},
            {"ingredient_id": "coriander-powder", "quantity": 1, "unit": "tablespoons"},
        ],
    ),
    Recipe(
        id="chicken-dum-biryani",
        name="Hyderabadi Chicken Dum Biryani",
        region="Telangana",
        description="Layered basmati rice and marinated chicken sealed for a fragrant, slow-steamed dum finish.",
        default_cooking_method="steaming",
        ingredients=[
            {"ingredient_id": "chicken", "quantity": 500, "unit": "grams"},
            {"ingredient_id": "basmati-rice", "quantity": 300, "unit": "grams"},
            {"ingredient_id": "yogurt", "quantity": 5, "unit": "tablespoons"},
            {"ingredient_id": "onion", "quantity": 2, "unit": "pieces_count"},
            {"ingredient_id": "ghee", "quantity": 2, "unit": "tablespoons"},
            {"ingredient_id": "ginger", "quantity": 15, "unit": "grams"},
            {"ingredient_id": "garlic", "quantity": 6, "unit": "pieces_count"},
            {"ingredient_id": "garam-masala", "quantity": 1, "unit": "tablespoons"},
        ],
    ),
    Recipe(
        id="mutton-dum-biryani",
        name="Lucknowi Mutton Dum Biryani",
        region="Uttar Pradesh",
        description="Aromatic rice layered with tender goat meat, saffron-toned yogurt, ghee, and whole spices.",
        default_cooking_method="pressure_cooking",
        ingredients=[
            {"ingredient_id": "mutton", "quantity": 500, "unit": "grams"},
            {"ingredient_id": "basmati-rice", "quantity": 300, "unit": "grams"},
            {"ingredient_id": "yogurt", "quantity": 5, "unit": "tablespoons"},
            {"ingredient_id": "onion", "quantity": 2, "unit": "pieces_count"},
            {"ingredient_id": "ghee", "quantity": 2, "unit": "tablespoons"},
            {"ingredient_id": "ginger", "quantity": 15, "unit": "grams"},
            {"ingredient_id": "garlic", "quantity": 6, "unit": "pieces_count"},
            {"ingredient_id": "cumin", "quantity": 1, "unit": "tablespoons"},
            {"ingredient_id": "garam-masala", "quantity": 1, "unit": "tablespoons"},
        ],
    ),
]

METHODS: dict[CookingMethod, CookingMethodInfo] = {
    "boiling": CookingMethodInfo(key="boiling", label="Boiling", tagline="Softens with water", yield_factor=1.45, oil_uptake_g=0, weight_change="+45% water weight"),
    "frying": CookingMethodInfo(key="frying", label="Frying", tagline="Fast pan heat", yield_factor=0.82, oil_uptake_g=12, weight_change="−18% moisture"),
    "deep_frying": CookingMethodInfo(key="deep_frying", label="Deep frying", tagline="Crisp, oil-rich finish", yield_factor=0.75, oil_uptake_g=25, weight_change="−25% moisture"),
    "sauteing": CookingMethodInfo(key="sauteing", label="Sautéing", tagline="Glossy aromatics", yield_factor=0.88, oil_uptake_g=7, weight_change="−12% moisture"),
    "roasting": CookingMethodInfo(key="roasting", label="Roasting", tagline="Dry toasted depth", yield_factor=0.78, oil_uptake_g=3, weight_change="−22% moisture"),
    "pressure_cooking": CookingMethodInfo(key="pressure_cooking", label="Pressure cooking", tagline="Tender + moisture-rich", yield_factor=1.55, oil_uptake_g=0, weight_change="+55% retained moisture"),
    "steaming": CookingMethodInfo(key="steaming", label="Steaming", tagline="Gentle moisture", yield_factor=1.05, oil_uptake_g=0, weight_change="+5% condensed moisture"),
    "baking": CookingMethodInfo(key="baking", label="Baking", tagline="Even dry heat", yield_factor=0.80, oil_uptake_g=4, weight_change="−20% moisture"),
}

RETENTION = {
    "boiling": {"calories": 1.0, "protein": 0.98, "carbs": 0.97, "fat": 0.99, "fiber": 0.90, "sodium": 0.95, "iron": 0.95, "calcium": 0.90, "b12": 0.90},
    "frying": {"calories": 1.0, "protein": 0.99, "carbs": 0.98, "fat": 1.0, "fiber": 0.95, "sodium": 0.98, "iron": 0.98, "calcium": 0.70, "b12": 0.95},
    "deep_frying": {"calories": 1.0, "protein": 0.98, "carbs": 0.95, "fat": 1.0, "fiber": 0.90, "sodium": 0.98, "iron": 0.90, "calcium": 0.45, "b12": 0.90},
    "sauteing": {"calories": 1.0, "protein": 0.99, "carbs": 0.99, "fat": 1.0, "fiber": 0.96, "sodium": 0.98, "iron": 0.98, "calcium": 0.80, "b12": 0.95},
    "roasting": {"calories": 1.0, "protein": 0.98, "carbs": 0.95, "fat": 1.0, "fiber": 0.95, "sodium": 0.98, "iron": 0.99, "calcium": 0.65, "b12": 0.90},
    "pressure_cooking": {"calories": 1.0, "protein": 0.99, "carbs": 1.0, "fat": 0.99, "fiber": 0.95, "sodium": 0.97, "iron": 0.97, "calcium": 0.75, "b12": 0.88},
    "steaming": {"calories": 1.0, "protein": 0.99, "carbs": 0.99, "fat": 1.0, "fiber": 0.98, "sodium": 0.99, "iron": 0.99, "calcium": 0.88, "b12": 0.95},
    "baking": {"calories": 1.0, "protein": 0.98, "carbs": 0.96, "fat": 1.0, "fiber": 0.94, "sodium": 0.98, "iron": 0.98, "calcium": 0.60, "b12": 0.90},
}


def _grams(item: IngredientCatalogItem, quantity: float, unit: Unit) -> float:
    if unit == "grams":
        return quantity
    if unit == "milliliters":
        return quantity * (0.92 if item.category == "Oils & Fats" else 1)
    if unit == "pieces_count":
        return quantity * item.piece_weight_g
    return quantity * item.tablespoon_weight_g


def _rounded(nutrition: Nutrition) -> Nutrition:
    return Nutrition(**{field: round(getattr(nutrition, field), 1) for field in Nutrition.model_fields})


@router.get("/ingredients", response_model=list[IngredientCatalogItem])
async def get_ingredients() -> list[IngredientCatalogItem]:
    return INGREDIENTS


@router.get("/recipes", response_model=list[Recipe])
async def get_recipes() -> list[Recipe]:
    return RECIPES


@router.get("/cooking-methods", response_model=list[CookingMethodInfo])
async def get_cooking_methods() -> list[CookingMethodInfo]:
    return list(METHODS.values())


@router.post("/calculate", response_model=CalculateResponse)
async def calculate_nutrition(payload: CalculateRequest) -> CalculateResponse:
    totals = Nutrition()
    raw_weight = 0.0
    calculated_ingredients: list[CalculatedIngredient] = []
    for ingredient in payload.ingredients:
        catalog_item = INGREDIENT_BY_ID.get(ingredient.ingredient_id)
        if catalog_item is None:
            raise HTTPException(status_code=404, detail=f"Ingredient '{ingredient.ingredient_id}' not found")
        grams = _grams(catalog_item, ingredient.quantity, ingredient.unit)
        if grams <= 0:
            raise HTTPException(status_code=400, detail=f"{catalog_item.name} needs a measurable quantity")
        raw_weight += grams
        for field in Nutrition.model_fields:
            setattr(totals, field, getattr(totals, field) + getattr(catalog_item.nutrition_per_100g, field) * grams / 100)
        calculated_ingredients.append(
            CalculatedIngredient(
                ingredient_id=catalog_item.id,
                name=catalog_item.name,
                quantity=ingredient.quantity,
                unit=ingredient.unit,
                grams=round(grams, 1),
                calories=round(catalog_item.nutrition_per_100g.calories * grams / 100, 1),
            )
        )

    raw_totals = Nutrition(**totals.model_dump())
    method = METHODS[payload.cooking_method]
    retention = RETENTION[payload.cooking_method]
    oil_absorption_g = method.oil_uptake_g if payload.oil_absorption_g is None else payload.oil_absorption_g
    for field in Nutrition.model_fields:
        adjusted_retention = min(1.1, retention[field] * payload.nutrient_retention_multiplier)
        setattr(totals, field, getattr(totals, field) * adjusted_retention)
    totals.fat += oil_absorption_g
    totals.calories += oil_absorption_g * 9
    cooked_weight = raw_weight * method.yield_factor + oil_absorption_g
    per_serving = Nutrition(**{field: getattr(totals, field) / payload.servings for field in Nutrition.model_fields})
    note = f"{method.label} changes the pot to about {round(cooked_weight)} g and adds {oil_absorption_g:g} g absorbed oil. Values are estimates based on ingredient weights and cooking retention."
    return CalculateResponse(
        cooking_method=payload.cooking_method,
        raw_weight_g=round(raw_weight, 1),
        cooked_weight_g=round(cooked_weight, 1),
        servings=payload.servings,
        oil_uptake_g=round(oil_absorption_g, 1),
        raw_totals=_rounded(raw_totals),
        totals=_rounded(totals),
        per_serving=_rounded(per_serving),
        ingredients=calculated_ingredients,
        cooking_note=note,
    )