import pytest
from geo_logistics import (
    calculate_haversine_distance,
    evaluate_logistics_route,
    resolve_location_coords,
    LOGISTICS_SETTINGS
)

def test_distance_calculation():
    # Coimbatore to Annur ~ 27-28 km
    dist = calculate_haversine_distance(11.0168, 76.9558, 11.2333, 77.1000)
    assert 24.0 <= dist <= 30.0

def test_direct_farmer_delivery_route():
    # 3 km apart, 2 kg order
    farmer_loc = {"latitude": 11.0168, "longitude": 76.9558, "locality": "Gandhipuram"}
    consumer_loc = {"latitude": 11.0300, "longitude": 76.9700, "locality": "Peelamedu"}
    
    plan = evaluate_logistics_route(
        farmer_location=farmer_loc,
        consumer_location=consumer_loc,
        quantity_kg=2.0,
        number_of_farmers=1,
        partner_available=True
    )
    
    assert plan["fulfillment_type"] == "DIRECT_FARMER"
    assert "Direct delivery recommended" in plan["reason"]
    assert plan["number_of_farmers"] == 1

def test_delivery_partner_route():
    # ~10 km apart, 5 kg order
    farmer_loc = {"latitude": 11.0168, "longitude": 76.9558, "city": "Coimbatore"}
    consumer_loc = {"latitude": 11.0801, "longitude": 76.9942, "locality": "Saravanampatti"}
    
    plan = evaluate_logistics_route(
        farmer_location=farmer_loc,
        consumer_location=consumer_loc,
        quantity_kg=5.0,
        number_of_farmers=1,
        partner_available=True
    )
    
    assert plan["fulfillment_type"] == "DELIVERY_PARTNER"
    assert "Delivery Partner recommended" in plan["reason"]

def test_collection_hub_aggregation_bulk_route():
    # 30 km apart, 50 kg order, 3 farmers
    farmer_loc = {"latitude": 10.6609, "longitude": 77.0048, "locality": "Pollachi"}
    consumer_loc = {"latitude": 11.2333, "longitude": 77.1000, "locality": "Annur"}
    
    plan = evaluate_logistics_route(
        farmer_location=farmer_loc,
        consumer_location=consumer_loc,
        quantity_kg=50.0,
        number_of_farmers=3,
        partner_available=True
    )
    
    assert plan["fulfillment_type"] == "COLLECTION_HUB"
    assert "Aggregation recommended" in plan["reason"]
    assert plan["collection_hub"] is not None

def test_location_unavailable_fallback():
    plan = evaluate_logistics_route(
        farmer_location=None,
        consumer_location=None,
        quantity_kg=5.0,
        number_of_farmers=1,
        partner_available=True
    )
    
    assert plan["distance_km"] == "Location unavailable"
    assert plan["location_status"] == "Location unavailable"
    assert "unavailable" in plan["reason"].lower()

def test_delivery_partner_unavailable_fallback():
    # 10 km apart, but partner_available = False
    farmer_loc = {"latitude": 11.0168, "longitude": 76.9558}
    consumer_loc = {"latitude": 11.0801, "longitude": 76.9942}
    
    plan = evaluate_logistics_route(
        farmer_location=farmer_loc,
        consumer_location=consumer_loc,
        quantity_kg=5.0,
        number_of_farmers=1,
        partner_available=False
    )
    
    assert plan["fulfillment_type"] == "COLLECTION_HUB"
    assert "no direct delivery partner is currently available" in plan["reason"]
