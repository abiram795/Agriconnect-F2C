import asyncio
import json
import httpx
from market_service import get_today_market_analysis

async def verify_real_agmarknet_record():
    print("==================================================")
    print("REAL AGMARKNET DATA END-TO-END VERIFICATION REPORT")
    print("==================================================")
    
    # 1. Query Agmarknet API directly
    ogd_url = "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=579b464db66ec23bdd000001cdd3946368fd4630e62c4314c46f5d71&format=json&limit=5&filters[commodity]=Tomato"
    async with httpx.AsyncClient(timeout=10.0) as client:
        res = await client.get(ogd_url)
        assert res.status_code == 200
        raw_agmarknet_data = res.json()
        raw_records = raw_agmarknet_data.get("records", [])
        assert len(raw_records) > 0, "No records returned from Agmarknet API"
        raw_rec = raw_records[0]

    print("\n1. DIRECT AGMARKNET API RESPONSE:")
    print(f"   Commodity    : {raw_rec.get('commodity')}")
    print(f"   State        : {raw_rec.get('state')}")
    print(f"   District     : {raw_rec.get('district')}")
    print(f"   Market       : {raw_rec.get('market')}")
    print(f"   Arrival Date : {raw_rec.get('arrival_date')}")
    print(f"   Min Price    : ₹{raw_rec.get('min_price')}/quintal")
    print(f"   Max Price    : ₹{raw_rec.get('max_price')}/quintal")
    print(f"   Modal Price  : ₹{raw_rec.get('modal_price')}/quintal")

    # 2. Query Market Service / Backend Endpoint
    analysis = await get_today_market_analysis(commodity="Tomato")
    assert analysis.success is True

    print("\n2. BACKEND MARKET SERVICE PROCESSED OUTPUT:")
    print(f"   Commodity        : {analysis.commodity}")
    print(f"   Primary Market   : {analysis.primary_market}")
    print(f"   Market Date      : {analysis.market_date}")
    print(f"   Freshness Label  : {analysis.status_label}")
    print(f"   Unit             : {analysis.unit}")
    print(f"   Min Price (₹/kg) : ₹{analysis.min_price_kg:.2f}")
    print(f"   Max Price (₹/kg) : ₹{analysis.max_price_kg:.2f}")
    print(f"   Modal Price(₹/kg): ₹{analysis.modal_price_kg:.2f}")
    print(f"   Reference Range  : {analysis.reference_price_range}")
    print(f"   Source Name      : {analysis.source_name}")
    print(f"   AI Explanation   : {analysis.ai_explanation}")

    # 3. Exact Value Verification Checks
    expected_modal_kg = round(float(raw_rec.get('modal_price')) / 100.0, 2)
    expected_min_kg = round(float(raw_rec.get('min_price')) / 100.0, 2)
    expected_max_kg = round(float(raw_rec.get('max_price')) / 100.0, 2)

    assert analysis.commodity == "Tomato"
    assert analysis.primary_market == raw_rec.get('market')
    assert analysis.market_date == raw_rec.get('arrival_date')
    assert analysis.modal_price_kg == expected_modal_kg
    assert analysis.min_price_kg == expected_min_kg
    assert analysis.max_price_kg == expected_max_kg
    assert "Agmarknet" in analysis.source_name

    print("\n✅ MATCH VERIFIED: Direct API values equal Backend processed values!")
    print("==================================================")

if __name__ == "__main__":
    asyncio.run(verify_real_agmarknet_record())
