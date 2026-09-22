"""Backend coverage: Medium Roti / Medium Jonna Roti piece-based unit conversions.

Criterion: Medium Roti defaults to pieces and converts each piece to approximately
40 g; Medium Jonna Roti defaults to pieces and converts each piece to approximately
60 g.
"""

import pytest


def test_medium_roti_defaults_to_pieces_and_is_40g_each(client):
    catalog = client.get("/catalog/ingredients")
    assert catalog.status_code == 200, catalog.text
    items = {item["id"]: item for item in catalog.json()}

    assert "medium-roti" in items
    roti = items["medium-roti"]
    assert roti["default_unit"] == "pieces_count"
    assert roti["piece_weight_g"] == pytest.approx(40, abs=1)

    calc = client.post(
        "/catalog/calculate",
        json={
            "ingredients": [
                {"ingredient_id": "medium-roti", "quantity": 3, "unit": "pieces_count"}
            ],
            "cooking_method": "boiling",
            "servings": 1,
        },
    )
    assert calc.status_code == 200, calc.text
    body = calc.json()
    # 3 pieces * ~40g each
    assert body["raw_weight_g"] == pytest.approx(120, abs=3)


def test_medium_jonna_roti_defaults_to_pieces_and_is_60g_each(client):
    catalog = client.get("/catalog/ingredients")
    assert catalog.status_code == 200, catalog.text
    items = {item["id"]: item for item in catalog.json()}

    assert "medium-jonna-roti" in items
    jonna = items["medium-jonna-roti"]
    assert jonna["default_unit"] == "pieces_count"
    assert jonna["piece_weight_g"] == pytest.approx(60, abs=1)

    calc = client.post(
        "/catalog/calculate",
        json={
            "ingredients": [
                {
                    "ingredient_id": "medium-jonna-roti",
                    "quantity": 2,
                    "unit": "pieces_count",
                }
            ],
            "cooking_method": "boiling",
            "servings": 1,
        },
    )
    assert calc.status_code == 200, calc.text
    body = calc.json()
    # 2 pieces * ~60g each
    assert body["raw_weight_g"] == pytest.approx(120, abs=3)
