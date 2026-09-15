import os
import json
import logging
from datetime import datetime, timezone, date
from typing import List, Dict, Optional, Any
import httpx
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("agriconnect.market")

AGMARKNET_RESOURCE_ID = "9ef84268-d588-465a-a308-a864a43d0070"
DEFAULT_OGD_KEY = "579b464db66ec23bdd000001cdd3946368fd4630e62c4314c46f5d71"

# In-memory cache for high availability and offline fallback
MARKET_CACHE: Dict[str, Dict[str, Any]] = {}
CACHE_TTL_SECONDS = 3600  # 1 hour

COMMODITY_NAME_MAP = {
    "tomato": "Tomato",
    "tomatoes": "Tomato",
    "onion": "Onion",
    "onions": "Onion",
    "potato": "Potato",
    "potatoes": "Potato",
    "carrot": "Carrot",
    "carrots": "Carrot",
    "cabbage": "Cabbage",
    "cauliflower": "Cauliflower",
    "bhindi": "Bhindi(Ladies Finger)",
    "ladies finger": "Bhindi(Ladies Finger)",
    "lady finger": "Bhindi(Ladies Finger)",
    "okra": "Bhindi(Ladies Finger)",
    "brinjal": "Brinjal",
    "eggplant": "Brinjal",
    "apple": "Apple",
    "apples": "Apple",
    "banana": "Banana",
    "bananas": "Banana",
    "rice": "Rice",
    "wheat": "Wheat",
    "spinach": "Spinach"
}

def normalize_commodity_name(raw_name: str) -> str:
    cleaned = raw_name.strip().lower()
    for key, norm in COMMODITY_NAME_MAP.items():
        if key in cleaned or cleaned in key:
            return norm
    return raw_name.strip().title()

class MarketRecord(BaseModel):
    state: str
    district: str
    market: str
    commodity: str
    variety: Optional[str] = "Standard"
    grade: Optional[str] = "FAQ"
    arrival_date: str  # DD/MM/YYYY
    min_price_kg: float
    max_price_kg: float
    modal_price_kg: float
    min_price_quintal: float
    max_price_quintal: float
    modal_price_quintal: float
    unit: str = "kg"
    source_name: str = "Agmarknet (Ministry of Agriculture & Farmers Welfare, Govt of India)"
    source_reference: str = "https://data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070"
    fetched_at: str

class NearbyMarketPrice(BaseModel):
    market: str
    district: str
    state: str
    modal_price_kg: float
    min_price_kg: float
    max_price_kg: float
    arrival_date: str

class MarketAnalysisResponse(BaseModel):
    success: bool
    commodity: str
    primary_market: Optional[str] = None
    farmer_district: Optional[str] = None
    farmer_state: Optional[str] = None
    status_label: str  # "Today", "Latest available: DD/MM/YYYY", or "Live market data is currently unavailable"
    data_freshness: str  # "Current", "Stale/Cached", or "Unavailable"
    market_date: Optional[str] = None
    fetched_at: str
    unit: str = "₹/kg"
    modal_price_kg: Optional[float] = None
    min_price_kg: Optional[float] = None
    max_price_kg: Optional[float] = None
    modal_explanation: str = "Modal price represents the most commonly reported wholesale price in the source data."
    nearby_markets: List[NearbyMarketPrice] = []
    price_trend: str = "Insufficient Data"  # "Rising", "Falling", "Stable", "Insufficient Data"
    ai_explanation: str = ""
    reference_price_range: Optional[str] = None
    reference_price_label: str = "AI-assisted reference based on available market data."
    source_name: str = "Agmarknet (Ministry of Agriculture & Farmers Welfare, Govt of India)"
    source_url: str = "https://data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070"
    message: str = ""

class MarketDataProvider:
    async def fetch_agmarknet_data(self, commodity: str, state: Optional[str] = None, district: Optional[str] = None) -> List[Dict[str, Any]]:
        raise NotImplementedError

class AgmarknetProvider(MarketDataProvider):
    def __init__(self):
        self.api_key = os.getenv("DATA_GOV_IN_API_KEY") or os.getenv("AGMARKNET_API_KEY") or DEFAULT_OGD_KEY
        self.base_url = f"https://api.data.gov.in/resource/{AGMARKNET_RESOURCE_ID}"

    async def fetch_agmarknet_data(self, commodity: str, state: Optional[str] = None, district: Optional[str] = None) -> List[Dict[str, Any]]:
        normalized = normalize_commodity_name(commodity)
        params = {
            "api-key": self.api_key,
            "format": "json",
            "limit": "50",
            "filters[commodity]": normalized
        }
        if state:
            params["filters[state]"] = state
        if district and not state:
            params["filters[district]"] = district

        fetched_records = []
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.get(self.base_url, params=params)
                if res.status_code == 200:
                    data = res.json()
                    fetched_records = data.get("records", [])
        except Exception as e:
            logger.warning(f"Primary Agmarknet query failed: {e}")

        # If filtered query returned no records, fall back to general query for commodity
        if not fetched_records and (state or district):
            fallback_params = {
                "api-key": self.api_key,
                "format": "json",
                "limit": "50",
                "filters[commodity]": normalized
            }
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    res = await client.get(self.base_url, params=fallback_params)
                    if res.status_code == 200:
                        fetched_records = res.json().get("records", [])
            except Exception as e:
                logger.warning(f"Fallback Agmarknet query failed: {e}")

        return fetched_records

def parse_market_date(date_str: str) -> Optional[date]:
    if not date_str:
        return None
    try:
        # Expected format DD/MM/YYYY
        parts = date_str.split("/")
        if len(parts) == 3:
            return date(int(parts[2]), int(parts[1]), int(parts[0]))
    except Exception:
        pass
    try:
        return datetime.strptime(date_str, "%Y-%m-%d").date()
    except Exception:
        return None

async def get_farmer_location(farmer_id: Optional[str], client: httpx.AsyncClient, supabase_url: str, supabase_headers: Dict[str, str]) -> Dict[str, str]:
    location = {"state": "Tamil Nadu", "district": "Coimbatore"}
    if not farmer_id or not supabase_url:
        return location
    try:
        res = await client.get(f"{supabase_url}/rest/v1/farmers?user_id=eq.{farmer_id}", headers=supabase_headers)
        if res.status_code == 200 and res.json():
            f_data = res.json()[0]
            if f_data.get("state"):
                location["state"] = f_data["state"]
            if f_data.get("district"):
                location["district"] = f_data["district"]
    except Exception as e:
        logger.error(f"Error fetching farmer location: {e}")
    return location

async def generate_ai_market_explanation(
    commodity: str,
    primary_market: str,
    modal_price: float,
    min_price: float,
    max_price: float,
    market_date: str,
    nearby_markets: List[NearbyMarketPrice]
) -> str:
    """Generate AI market insight using Gemini REST API based strictly on validated data."""
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY") or os.getenv("GOOGLE_GENERATIVE_AI_API_KEY")
    nearby_summary = ", ".join([f"{m.market} ({m.district}): ₹{m.modal_price_kg:.2f}/kg" for m in nearby_markets[:4]])
    
    prompt = (
        f"You are an agricultural market expert for AgriConnect F2C.\n"
        f"Provide a brief 2-sentence farmer-friendly explanation based STRICTLY on the following validated Agmarknet market data:\n"
        f"- Commodity: {commodity}\n"
        f"- Selected Market: {primary_market}\n"
        f"- Market Date: {market_date}\n"
        f"- Modal Price: ₹{modal_price:.2f}/kg (Min: ₹{min_price:.2f}/kg, Max: ₹{max_price:.2f}/kg)\n"
        f"- Nearby Markets: {nearby_summary or 'No other nearby markets reported for this date'}\n\n"
        f"Rules:\n"
        f"1. Rely ONLY on the numbers above.\n"
        f"2. Compare prices between the main market and nearby markets if available.\n"
        f"3. Do NOT mention weather, festivals, or unverified external events.\n"
        f"4. Keep it concise, practical, and clear for a local farmer."
    )
    
    if api_key:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
            payload = {
                "contents": [{"parts": [{"text": prompt}]}]
            }
            async with httpx.AsyncClient(timeout=8.0) as client:
                res = await client.post(url, json=payload)
                if res.status_code == 200:
                    text = res.json()["candidates"][0]["content"]["parts"][0]["text"].strip()
                    if text:
                        return text
        except Exception as e:
            logger.warning(f"Gemini API call failed: {e}")

    # Rule-based fallback synthesis when Gemini API key is not configured or times out
    if nearby_markets:
        avg_nearby = sum(m.modal_price_kg for m in nearby_markets) / len(nearby_markets)
        if modal_price > avg_nearby + 1.5:
            comp_str = f"The price in {primary_market} (₹{modal_price:.1f}/kg) is currently higher than the surrounding regional average of ₹{avg_nearby:.1f}/kg."
        elif modal_price < avg_nearby - 1.5:
            comp_str = f"The price in {primary_market} (₹{modal_price:.1f}/kg) is slightly below surrounding regional markets (avg ₹{avg_nearby:.1f}/kg)."
        else:
            comp_str = f"Prices in {primary_market} (₹{modal_price:.1f}/kg) remain closely aligned with regional market averages."
    else:
        comp_str = f"The modal wholesale price for {commodity} in {primary_market} is reported at ₹{modal_price:.1f}/kg."

    return f"{comp_str} Farmers listing directly to consumers can use this range as a baseline reference for direct pricing."

async def get_today_market_analysis(
    commodity: str,
    farmer_id: Optional[str] = None,
    supabase_url: Optional[str] = None,
    supabase_headers: Optional[Dict[str, str]] = None
) -> MarketAnalysisResponse:
    now_iso = datetime.now(timezone.utc).isoformat()
    today_date = datetime.now(timezone.utc).date()
    normalized_commodity = normalize_commodity_name(commodity)

    # Determine farmer location
    farmer_loc = {"state": "Tamil Nadu", "district": "Coimbatore"}
    if farmer_id and supabase_url and supabase_headers:
        async with httpx.AsyncClient(timeout=5.0) as client:
            farmer_loc = await get_farmer_location(farmer_id, client, supabase_url, supabase_headers)

    farmer_state = farmer_loc.get("state") or "Tamil Nadu"
    farmer_district = farmer_loc.get("district") or "Coimbatore"

    # Check in-memory cache first
    cache_key = f"{normalized_commodity}_{farmer_state}_{farmer_district}".lower()
    cached_entry = MARKET_CACHE.get(cache_key)
    if cached_entry:
        cache_time = cached_entry.get("cached_timestamp", 0)
        if (datetime.now().timestamp() - cache_time) < CACHE_TTL_SECONDS:
            logger.info(f"Serving market analysis for '{normalized_commodity}' from cache")
            return cached_entry["data"]

    provider = AgmarknetProvider()
    raw_records = await provider.fetch_agmarknet_data(
        commodity=normalized_commodity,
        state=farmer_state,
        district=farmer_district
    )

    if not raw_records:
        # Try without state/district filters to get general commodity data
        raw_records = await provider.fetch_agmarknet_data(commodity=normalized_commodity)

    if not raw_records:
        return MarketAnalysisResponse(
            success=False,
            commodity=normalized_commodity,
            farmer_district=farmer_district,
            farmer_state=farmer_state,
            status_label="Live market data is currently unavailable.",
            data_freshness="Unavailable",
            fetched_at=now_iso,
            message=f"No recent official market price records found for {normalized_commodity}."
        )

    # Convert and structure Agmarknet records
    processed_records: List[MarketRecord] = []
    for r in raw_records:
        try:
            min_q = float(r.get("min_price") or 0.0)
            max_q = float(r.get("max_price") or 0.0)
            modal_q = float(r.get("modal_price") or 0.0)

            # Agmarknet quotes in ₹/quintal -> convert to ₹/kg (1 quintal = 100 kg)
            min_kg = round(min_q / 100.0, 2)
            max_kg = round(max_q / 100.0, 2)
            modal_kg = round(modal_q / 100.0, 2)

            processed_records.append(MarketRecord(
                state=r.get("state", "India"),
                district=r.get("district", "General"),
                market=r.get("market", "Local Mandi"),
                commodity=normalized_commodity,
                variety=r.get("variety", "Standard"),
                grade=r.get("grade", "FAQ"),
                arrival_date=r.get("arrival_date", ""),
                min_price_kg=min_kg,
                max_price_kg=max_kg,
                modal_price_kg=modal_kg,
                min_price_quintal=min_q,
                max_price_quintal=max_q,
                modal_price_quintal=modal_q,
                fetched_at=now_iso
            ))
        except Exception as e:
            logger.error(f"Error parsing Agmarknet record: {e}")

    if not processed_records:
        return MarketAnalysisResponse(
            success=False,
            commodity=normalized_commodity,
            farmer_district=farmer_district,
            farmer_state=farmer_state,
            status_label="Live market data is currently unavailable.",
            data_freshness="Unavailable",
            fetched_at=now_iso,
            message="Failed to parse market record prices."
        )

    # Pick primary market matching farmer's district or first available
    primary_rec = None
    for rec in processed_records:
        if rec.district.lower() == farmer_district.lower():
            primary_rec = rec
            break
    if not primary_rec:
        primary_rec = processed_records[0]

    # Calculate Market Date & Freshness Status strictly per rules
    rec_date_obj = parse_market_date(primary_rec.arrival_date)
    
    if rec_date_obj and rec_date_obj == today_date:
        status_label = "Today"
        freshness = "Current"
    elif primary_rec.arrival_date:
        status_label = f"Latest available: {primary_rec.arrival_date}"
        freshness = "Stale/Cached"
    else:
        status_label = "Live market data is currently unavailable."
        freshness = "Unavailable"

    # Build Nearby Markets comparison list
    nearby_list: List[NearbyMarketPrice] = []
    seen_markets = set()
    for rec in processed_records:
        if rec.market not in seen_markets:
            seen_markets.add(rec.market)
            nearby_list.append(NearbyMarketPrice(
                market=rec.market,
                district=rec.district,
                state=rec.state,
                modal_price_kg=rec.modal_price_kg,
                min_price_kg=rec.min_price_kg,
                max_price_kg=rec.max_price_kg,
                arrival_date=rec.arrival_date
            ))

    # Trend calculation if multiple dates exist
    price_trend = "Stable"
    dates_with_prices = {}
    for rec in processed_records:
        if rec.market == primary_rec.market and rec.arrival_date:
            dates_with_prices[rec.arrival_date] = rec.modal_price_kg

    if len(dates_with_prices) >= 2:
        sorted_dates = sorted(dates_with_prices.keys(), key=lambda d: parse_market_date(d) or date.min)
        first_p = dates_with_prices[sorted_dates[0]]
        last_p = dates_with_prices[sorted_dates[-1]]
        if last_p > first_p * 1.05:
            price_trend = "Rising"
        elif last_p < first_p * 0.95:
            price_trend = "Falling"
        else:
            price_trend = "Stable"

    # Reference Selling Range based strictly on min/modal/max
    ref_min = round(max(1.0, primary_rec.min_price_kg * 0.95), 1)
    ref_max = round(primary_rec.max_price_kg * 1.05, 1)
    reference_range_str = f"₹{ref_min:.0f} – ₹{ref_max:.0f}/kg"

    # AI Analysis via Gemini
    ai_explanation = await generate_ai_market_explanation(
        commodity=normalized_commodity,
        primary_market=primary_rec.market,
        modal_price=primary_rec.modal_price_kg,
        min_price=primary_rec.min_price_kg,
        max_price=primary_rec.max_price_kg,
        market_date=primary_rec.arrival_date,
        nearby_markets=nearby_list
    )

    response = MarketAnalysisResponse(
        success=True,
        commodity=normalized_commodity,
        primary_market=primary_rec.market,
        farmer_district=farmer_district,
        farmer_state=farmer_state,
        status_label=status_label,
        data_freshness=freshness,
        market_date=primary_rec.arrival_date,
        fetched_at=now_iso,
        modal_price_kg=primary_rec.modal_price_kg,
        min_price_kg=primary_rec.min_price_kg,
        max_price_kg=primary_rec.max_price_kg,
        nearby_markets=nearby_list[:6],
        price_trend=price_trend,
        ai_explanation=ai_explanation,
        reference_price_range=reference_range_str,
        reference_price_label="AI-assisted reference based on available market data.",
        source_name="Agmarknet (Ministry of Agriculture & Farmers Welfare, Govt of India)",
        source_url="https://data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070"
    )

    # Store in memory cache
    MARKET_CACHE[cache_key] = {
        "cached_timestamp": datetime.now().timestamp(),
        "data": response
    }

    # Asynchronously attempt cache persistence to Supabase if table exists
    if supabase_url and supabase_headers:
        try:
            db_payload = {
                "commodity": normalized_commodity,
                "variety": primary_rec.variety,
                "grade": primary_rec.grade,
                "market_name": primary_rec.market,
                "district": primary_rec.district,
                "state": primary_rec.state,
                "min_price": primary_rec.min_price_kg,
                "max_price": primary_rec.max_price_kg,
                "modal_price": primary_rec.modal_price_kg,
                "min_price_quintal": primary_rec.min_price_quintal,
                "max_price_quintal": primary_rec.max_price_quintal,
                "modal_price_quintal": primary_rec.modal_price_quintal,
                "unit": "kg",
                "market_date": parse_market_date(primary_rec.arrival_date).isoformat() if parse_market_date(primary_rec.arrival_date) else str(today_date),
                "source_name": primary_rec.source_name,
                "source_reference": primary_rec.source_reference,
                "fetched_at": now_iso
            }
            async with httpx.AsyncClient(timeout=3.0) as client:
                await client.post(
                    f"{supabase_url}/rest/v1/market_prices",
                    json=db_payload,
                    headers={**supabase_headers, "Prefer": "resolution=merge-duplicates"}
                )
        except Exception:
            # Ignore Supabase persistence errors if table is not yet created
            pass

    return response
