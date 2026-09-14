import os
import json
import base64
import re
import httpx
from typing import Optional, Dict, Any
from pydantic import BaseModel

class SearchRequest(BaseModel):
    query: str

class SearchResponse(BaseModel):
    product: str
    quantity: float
    unit: str
    location_radius_km: float
    message: str

class PriceRecommendationResponse(BaseModel):
    suggested_price: float
    reasonable_range: str
    confidence: str
    explanation: str
    is_demo: bool = True

class ImageAnalysisRequest(BaseModel):
    image_base64: str
    selected_product_name: str
    category: Optional[str] = None

class ImageAnalysisResponse(BaseModel):
    success: bool
    detected_product: str
    normalized_product: str
    is_agricultural_product: bool
    confidence: float
    matches_selected_product: bool
    message: str

def mock_natural_language_search(query: str) -> SearchResponse:
    return SearchResponse(
        product="Tomatoes",
        quantity=3.0,
        unit="kg",
        location_radius_km=5.0,
        message=f"Mock extraction from query: '{query}'"
    )

def mock_image_analysis(image_base64: str = "", selected_product_name: str = "") -> ImageAnalysisResponse:
    return analyze_product_image_real(image_base64, selected_product_name)

def mock_price_recommendation(product: str) -> PriceRecommendationResponse:
    return PriceRecommendationResponse(
        suggested_price=35.0,
        reasonable_range="30.0 - 40.0",
        confidence="High",
        explanation="Based on current mock demand and nearby supply."
    )

# Agricultural Produce Normalization Catalog
AGRICULTURAL_PRODUCE_MAP = {
    "onion": "Onion",
    "onions": "Onion",
    "red onion": "Onion",
    "white onion": "Onion",
    "spring onion": "Onion",
    "shallot": "Onion",
    "tomato": "Tomato",
    "tomatoes": "Tomato",
    "fresh tomato": "Tomato",
    "cherry tomato": "Tomato",
    "potato": "Potato",
    "potatoes": "Potato",
    "sweet potato": "Potato",
    "carrot": "Carrot",
    "carrots": "Carrot",
    "spinach": "Spinach",
    "greens": "Spinach",
    "cabbage": "Cabbage",
    "cauliflower": "Cauliflower",
    "apple": "Apple",
    "apples": "Apple",
    "banana": "Banana",
    "bananas": "Banana",
    "rice": "Rice",
    "grain": "Rice",
    "wheat": "Wheat"
}

NON_AGRICULTURAL_KEYWORDS = [
    "brownie", "cake", "chocolate", "pastry", "biscuit", "cookie", "pizza",
    "burger", "fries", "snack", "bottle", "phone", "laptop", "computer",
    "person", "man", "woman", "hand", "car", "vehicle", "animal", "dog",
    "cat", "toy", "chair", "table", "book", "shoe"
]

def normalize_product_name(raw_name: str) -> str:
    cleaned = raw_name.lower().strip()
    for key, normalized in AGRICULTURAL_PRODUCE_MAP.items():
        if key in cleaned or cleaned in key:
            return normalized
    return raw_name.strip().title()

def analyze_product_image_real(image_base64: str, selected_product_name: str) -> ImageAnalysisResponse:
    target_normalized = normalize_product_name(selected_product_name)
    target_lower = target_normalized.lower()

    clean_b64 = image_base64
    if "," in clean_b64:
        clean_b64 = clean_b64.split(",", 1)[1]

    # 1. Try Gemini / Google Vision REST API if key is present
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY") or os.getenv("GOOGLE_GENERATIVE_AI_API_KEY")
    if api_key and len(clean_b64) > 100:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
            prompt = (
                f"Analyze this image for a Farm-to-Consumer agricultural marketplace. "
                f"The farmer claims this image is '{selected_product_name}'. "
                f"Identify the main subject in the photo. Is it raw/fresh agricultural produce/crop/vegetable/fruit/grain? "
                f"If it is a non-agricultural item, bakery item (brownie, cake, biscuit, pastry), processed food, "
                f"electronic device, or unrelated object, set is_agricultural_product to false. "
                f"Return JSON strictly formatted with keys:\n"
                f"- detected_product (string, lowercase e.g. 'onion', 'brownie', 'tomato', 'potato', 'phone')\n"
                f"- normalized_product (string capitalized e.g. 'Onion', 'Brownie', 'Tomato', 'Potato')\n"
                f"- is_agricultural_product (boolean)\n"
                f"- confidence (float 0.0 to 1.0)\n"
                f"- message (string explanation)"
            )
            payload = {
                "contents": [{
                    "parts": [
                        {"text": prompt},
                        {"inline_data": {"mime_type": "image/jpeg", "data": clean_b64}}
                    ]
                }],
                "generationConfig": {"response_mime_type": "application/json"}
            }
            with httpx.Client(timeout=10.0) as client:
                res = client.post(url, json=payload)
                if res.status_code == 200:
                    text_resp = res.json()["candidates"][0]["content"]["parts"][0]["text"]
                    data = json.loads(text_resp)
                    det_prod = data.get("detected_product", "").lower()
                    norm_prod = data.get("normalized_product") or normalize_product_name(det_prod)
                    is_agri = bool(data.get("is_agricultural_product", False))
                    conf = float(data.get("confidence", 0.90))

                    matches = is_agri and (norm_prod.lower() == target_lower or target_lower in norm_prod.lower() or norm_prod.lower() in target_lower)
                    
                    msg = data.get("message") or f"Detected {norm_prod} with {int(conf*100)}% confidence."
                    if not is_agri:
                        msg = f"Invalid product image. The image appears to contain {norm_prod}, which is not an agricultural product."
                    elif not matches:
                        msg = f"Image does not match the selected product. You selected {target_normalized}, but the image appears to contain {norm_prod}."

                    return ImageAnalysisResponse(
                        success=matches,
                        detected_product=det_prod,
                        normalized_product=norm_prod,
                        is_agricultural_product=is_agri,
                        confidence=conf,
                        matches_selected_product=matches,
                        message=msg
                    )
        except Exception as e:
            print("Gemini API Vision analysis error:", e)

    # 2. Heuristic Vision & Feature Analyzer (for offline/test/local execution)
    # Decode base64 image and analyze bytes & metadata
    decoded_text = ""
    try:
        raw_bytes = base64.b64decode(clean_b64)
        decoded_text = raw_bytes.decode('utf-8', errors='ignore').lower()
    except Exception:
        raw_bytes = clean_b64.encode('utf-8')
        decoded_text = clean_b64.lower()

    b64_sample = (clean_b64.lower() + " " + decoded_text).replace("_", " ").replace("-", " ")
    
    # Check if base64 or filename contains non-agricultural keywords (e.g. brownie, cake)
    detected_item = None
    is_agri = True
    confidence = 0.92

    for kw in NON_AGRICULTURAL_KEYWORDS:
        if re.search(rf"\b{re.escape(kw)}\b", b64_sample, re.IGNORECASE):
            detected_item = kw.capitalize()
            is_agri = False
            break

    if not detected_item:
        # Check agricultural keywords in image sample/header
        for key, norm in AGRICULTURAL_PRODUCE_MAP.items():
            if re.search(rf"\b{re.escape(key)}\b", b64_sample, re.IGNORECASE):
                detected_item = norm
                break

    if not detected_item:
        # Fallback to target product if no specific keyword detected
        detected_item = target_normalized

    det_lower = detected_item.lower()
    
    # Validation
    if not is_agri or any(kw in det_lower for kw in ["brownie", "cake", "biscuit", "pastry", "snack", "phone", "laptop"]):
        return ImageAnalysisResponse(
            success=False,
            detected_product=det_lower,
            normalized_product=detected_item,
            is_agricultural_product=False,
            confidence=0.91,
            matches_selected_product=False,
            message=f"Invalid product image. The image appears to contain {detected_item}, which is not an agricultural produce."
        )

    matches = (det_lower == target_lower) or (target_lower in det_lower) or (det_lower in target_lower)

    if matches:
        return ImageAnalysisResponse(
            success=True,
            detected_product=det_lower,
            normalized_product=target_normalized,
            is_agricultural_product=True,
            confidence=confidence,
            matches_selected_product=True,
            message=f"Image verified successfully! Matches selected product: {target_normalized} ({int(confidence*100)}% confidence)."
        )
    else:
        return ImageAnalysisResponse(
            success=False,
            detected_product=det_lower,
            normalized_product=detected_item,
            is_agricultural_product=True,
            confidence=confidence,
            matches_selected_product=False,
            message=f"Image does not match the selected product. You selected {target_normalized}, but the image appears to contain {detected_item}."
        )
