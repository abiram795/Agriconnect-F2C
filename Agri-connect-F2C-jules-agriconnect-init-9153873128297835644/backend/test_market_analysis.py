import pytest
import asyncio
from fastapi.testclient import TestClient
from main import app
from market_service import normalize_commodity_name, get_today_market_analysis, parse_market_date

client = TestClient(app)

def test_normalize_commodity_name():
    assert normalize_commodity_name("tomatoes") == "Tomato"
    assert normalize_commodity_name("red onion") == "Onion"
    assert normalize_commodity_name("bhindi") == "Bhindi(Ladies Finger)"
    assert normalize_commodity_name("lady finger") == "Bhindi(Ladies Finger)"
    assert normalize_commodity_name("potato") == "Potato"

def test_parse_market_date():
    parsed = parse_market_date("26/05/2025")
    assert parsed is not None
    assert parsed.day == 26
    assert parsed.month == 5
    assert parsed.year == 2025

def test_commodities_endpoint():
    res = client.get("/api/market-analysis/commodities")
    assert res.status_code == 200
    data = res.json()
    assert "commodities" in data
    assert "Tomato" in data["commodities"]
    assert "Onion" in data["commodities"]

def test_get_today_market_analysis_real_data():
    res = asyncio.run(get_today_market_analysis(commodity="Tomato"))
    assert res.commodity == "Tomato"
    assert res.fetched_at is not None
    if res.success:
        assert res.modal_price_kg is not None
        assert res.modal_price_kg > 0
        assert res.source_name.startswith("Agmarknet")
        assert res.reference_price_label == "AI-assisted reference based on available market data."
        assert len(res.nearby_markets) >= 1

def test_market_analysis_api_route():
    res = client.get("/api/market-analysis?commodity=Tomato")
    assert res.status_code == 200
    data = res.json()
    assert data["commodity"] == "Tomato"
    if data["success"]:
        assert "modal_price_kg" in data
        assert "source_name" in data
        assert "status_label" in data
