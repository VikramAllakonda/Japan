"""Backend coverage: nutrition simulation produces total-pot and per-serving values.

Criterion: Adding a roti, selecting servings, and simulating produces total-pot and
per-serving nutrient values without failed-request errors.
"""

import pytest


NUTRIENT_KEYS = [
    "calories",
    "protein",
    "carbs",
    "fat",
    "fiber",
    "sodium",
    "iron",
    "calcium",
    "b12",
]


def test_calculate_endpoint_returns_totals_and_per_serving(client):
    resp = client.post(
        "/catalog/calculate",
        json={
            "ingredients": [
                {"ingredient_id": "medium-roti", "quantity": 2, "unit": "pieces_count"}
            ],
            "cooking_method": "boiling",
            "servings": 2,
        },
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()

    assert body["raw_weight_g"] > 0
    assert body["cooked_weight_g"] > 0
    assert body["servings"] == 2

    for key in NUTRIENT_KEYS:
        assert key in body["totals"]
        assert key in body["per_serving"]

    assert body["totals"]["calories"] > 0
    assert body["per_serving"]["calories"] > 0
    # per-serving should be an equal share (totals / servings)
    assert body["per_serving"]["calories"] == pytest.approx(
        body["totals"]["calories"] / body["servings"], rel=0.01
    )
