import math
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

# Configurable Platform Logistics Settings
LOGISTICS_SETTINGS = {
    "DIRECT_DELIVERY_MAX_KM": 5.0,
    "DELIVERY_PARTNER_MAX_KM": 15.0,
    "BULK_AGGREGATION_QTY_KG": 50.0,
    "HUB_SERVICE_RADIUS_KM": 35.0
}

# Regional Collection Hubs (Demo Configuration for Prototype)
COLLECTION_HUBS = [
    {
        "hub_id": "HUB-CBE-01",
        "name": "Coimbatore Central Collection Hub",
        "district": "Coimbatore",
        "locality": "Gandhipuram",
        "latitude": 11.0168,
        "longitude": 76.9558,
        "capacity_kg": 5000,
        "operating_hours": "06:00 AM - 08:00 PM",
        "status": "ACTIVE",
        "is_demo": True
    },
    {
        "hub_id": "HUB-ANR-02",
        "name": "Annur Rural Aggregation Hub",
        "district": "Coimbatore",
        "locality": "Annur",
        "latitude": 11.2333,
        "longitude": 77.1000,
        "capacity_kg": 3000,
        "operating_hours": "05:00 AM - 07:00 PM",
        "status": "ACTIVE",
        "is_demo": True
    },
    {
        "hub_id": "HUB-PLC-03",
        "name": "Pollachi Agricultural Collection Hub",
        "district": "Coimbatore",
        "locality": "Pollachi",
        "latitude": 10.6609,
        "longitude": 77.0048,
        "capacity_kg": 4000,
        "operating_hours": "06:00 AM - 07:00 PM",
        "status": "ACTIVE",
        "is_demo": True
    }
]

# Geocoding Lookup Dictionary for Known Localities
KNOWN_COORDINATES = {
    "coimbatore": (11.0168, 76.9558),
    "annur": (11.2333, 77.1000),
    "pollachi": (10.6609, 77.0048),
    "saravanampatti": (11.0801, 76.9942),
    "thondamuthur": (10.9904, 76.8286),
    "mettupalayam": (11.3000, 76.9500),
    "kinathukadavu": (10.8200, 77.0200),
    "sulur": (11.0264, 77.1264),
    "tiruppur": (11.1085, 77.3411),
    "erode": (11.3410, 77.7172),
    "salem": (11.6643, 78.1460),
    "gandhipuram": (11.0168, 76.9558),
    "peelamedu": (11.0287, 77.0040),
    "singanallur": (10.9983, 77.0256)
}

def calculate_haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates geodesic distance in kilometers between two lat/lon coordinates using the Haversine formula."""
    R = 6371.0  # Earth radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 2)

def resolve_location_coords(location_data: Optional[Dict[str, Any]]) -> tuple[Optional[float], Optional[float]]:
    """Resolves latitude and longitude from location dictionary or falls back to known locality lookup."""
    if not location_data or not isinstance(location_data, dict):
        return None, None
        
    lat = location_data.get("latitude")
    lon = location_data.get("longitude")
    if lat is not None and lon is not None:
        try:
            return float(lat), float(lon)
        except (ValueError, TypeError):
            pass
            
    # Try fuzzy geocoding lookup by locality / city / district
    for key_field in ["village", "locality", "city", "district", "address_line", "state"]:
        val = str(location_data.get(key_field) or "").lower().strip()
        if not val:
            continue
        for loc_name, coords in KNOWN_COORDINATES.items():
            if loc_name in val or val in loc_name:
                return coords
                
    return None, None

def evaluate_logistics_route(
    farmer_location: Optional[Dict[str, Any]],
    consumer_location: Optional[Dict[str, Any]],
    quantity_kg: float,
    number_of_farmers: int = 1,
    partner_available: bool = True
) -> Dict[str, Any]:
    """Smart Geo-Logistics Route Matching Engine."""
    f_lat, f_lon = resolve_location_coords(farmer_location)
    c_lat, c_lon = resolve_location_coords(consumer_location)

    distance_km: Optional[float] = None
    if f_lat is not None and f_lon is not None and c_lat is not None and c_lon is not None:
        distance_km = calculate_haversine_distance(f_lat, f_lon, c_lat, c_lon)

    direct_max = LOGISTICS_SETTINGS["DIRECT_DELIVERY_MAX_KM"]
    partner_max = LOGISTICS_SETTINGS["DELIVERY_PARTNER_MAX_KM"]
    bulk_qty = LOGISTICS_SETTINGS["BULK_AGGREGATION_QTY_KG"]

    # Find nearest Collection Hub
    nearest_hub = None
    if f_lat is not None and f_lon is not None:
        hub_distances = []
        for hub in COLLECTION_HUBS:
            d = calculate_haversine_distance(f_lat, f_lon, hub["latitude"], hub["longitude"])
            hub_distances.append((d, hub))
        if hub_distances:
            hub_distances.sort(key=lambda x: x[0])
            nearest_hub = {
                "hub_id": hub_distances[0][1]["hub_id"],
                "name": hub_distances[0][1]["name"],
                "distance_to_farmer_km": hub_distances[0][0],
                "locality": hub_distances[0][1]["locality"]
            }
    else:
        nearest_hub = COLLECTION_HUBS[0]

    # Evaluate decision logic
    if number_of_farmers > 1 or quantity_kg >= bulk_qty:
        return {
            "fulfillment_type": "COLLECTION_HUB",
            "fulfillment_title": "Aggregated Collection Hub Delivery",
            "reason": f"Aggregation recommended because this order requires supply from {number_of_farmers} farmer(s) for {quantity_kg} kg.",
            "distance_km": distance_km if distance_km is not None else "Location unavailable",
            "location_status": "OK" if distance_km is not None else "Location unavailable",
            "collection_hub": nearest_hub,
            "number_of_farmers": number_of_farmers,
            "estimated_delivery_hours": 24 if quantity_kg >= bulk_qty else 12,
            "recommended_action": "Consolidate produce at AgriConnect Collection Hub before city distribution."
        }

    if distance_km is None:
        return {
            "fulfillment_type": "DELIVERY_PARTNER",
            "fulfillment_title": "Standard Delivery Partner Route",
            "reason": "Location coordinates unavailable for exact distance calculation. Defaulting to standard delivery partner route.",
            "distance_km": "Location unavailable",
            "location_status": "Location unavailable",
            "collection_hub": None,
            "number_of_farmers": 1,
            "estimated_delivery_hours": 4,
            "recommended_action": "Standard partner pickup from farmer."
        }

    if distance_km <= direct_max:
        return {
            "fulfillment_type": "DIRECT_FARMER",
            "fulfillment_title": "Direct Local Farmer Delivery",
            "reason": f"Direct delivery recommended because the farmer is {distance_km} km away (within local {direct_max} km direct range).",
            "distance_km": distance_km,
            "location_status": "OK",
            "collection_hub": None,
            "number_of_farmers": 1,
            "estimated_delivery_hours": 2,
            "recommended_action": "Direct local delivery or consumer pickup."
        }
    elif distance_km <= partner_max:
        if partner_available:
            return {
                "fulfillment_type": "DELIVERY_PARTNER",
                "fulfillment_title": "Delivery Partner Network Route",
                "reason": f"Delivery Partner recommended because the farmer is {distance_km} km away and a nearby delivery partner is available.",
                "distance_km": distance_km,
                "location_status": "OK",
                "collection_hub": None,
                "number_of_farmers": 1,
                "estimated_delivery_hours": 4,
                "recommended_action": "Assign to active nearby delivery partner."
            }
        else:
            return {
                "fulfillment_type": "COLLECTION_HUB",
                "fulfillment_title": "Collection Hub Route (Partner Unavailable)",
                "reason": f"Collection Hub recommended because distance is {distance_km} km and no direct delivery partner is currently available.",
                "distance_km": distance_km,
                "location_status": "OK",
                "collection_hub": nearest_hub,
                "number_of_farmers": 1,
                "estimated_delivery_hours": 12,
                "recommended_action": "Route produce via local collection hub."
            }
    else: # distance_km > partner_max
        return {
            "fulfillment_type": "COLLECTION_HUB",
            "fulfillment_title": "Inter-District Collection Hub Route",
            "reason": f"Collection Hub aggregation recommended because the farmer is {distance_km} km away (exceeds direct partner range of {partner_max} km).",
            "distance_km": distance_km,
            "location_status": "OK",
            "collection_hub": nearest_hub,
            "number_of_farmers": 1,
            "estimated_delivery_hours": 24,
            "recommended_action": "Route produce from village hub to city hub for final distribution."
        }

# Pydantic models for FastAPI API endpoints
class RouteEvaluationRequest(BaseModel):
    farmer_location: Optional[Dict[str, Any]] = None
    consumer_location: Optional[Dict[str, Any]] = None
    quantity_kg: float
    number_of_farmers: Optional[int] = 1
    partner_available: Optional[bool] = True

class LogisticsSettingsUpdate(BaseModel):
    DIRECT_DELIVERY_MAX_KM: Optional[float] = None
    DELIVERY_PARTNER_MAX_KM: Optional[float] = None
    BULK_AGGREGATION_QTY_KG: Optional[float] = None
    HUB_SERVICE_RADIUS_KM: Optional[float] = None
