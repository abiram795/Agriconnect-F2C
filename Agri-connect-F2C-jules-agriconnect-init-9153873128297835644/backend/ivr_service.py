import os
import json
import logging
import uuid
from datetime import datetime
from abc import ABC, abstractmethod
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field
import httpx

logger = logging.getLogger("ivr_service")

# -----------------------------------------------------------------------------
# PYDANTIC MODELS FOR IVR ARCHITECTURE
# -----------------------------------------------------------------------------

class IVRWebhookRequest(BaseModel):
    CallSid: str = Field(default_factory=lambda: f"CALL-{uuid.uuid4().hex[:8]}")
    From: str = ""
    To: str = ""
    Digits: str = ""
    Language: Optional[str] = None
    State: Optional[str] = None
    Step: Optional[str] = None
    SelectedCategory: Optional[str] = None
    SelectedProduct: Optional[str] = None
    QuantityKg: Optional[float] = None
    FarmerId: Optional[str] = None

class IVRResponse(BaseModel):
    twiml: Optional[str] = None
    text: Optional[str] = None
    language: str = "Tamil"
    state: str = "COMPLETED"
    prompt_key: Optional[str] = None
    action: Optional[str] = None
    farmer_id: Optional[str] = None
    farmer_name: Optional[str] = None
    data: Dict[str, Any] = Field(default_factory=dict)
    success: bool = True
    message: str = ""

# -----------------------------------------------------------------------------
# MAIN MENU CONFIGURATION & PROMPTS
# -----------------------------------------------------------------------------

MAIN_MENU_CONFIG = {
    "1": {"id": "VEGETABLES", "name_en": "Vegetables", "name_ta": "காய்கறிகள்"},
    "2": {"id": "FRUITS", "name_en": "Fruits", "name_ta": "பழங்கள்"},
    "3": {"id": "GRAINS", "name_en": "Grains & Millets", "name_ta": "தானியங்கள் மற்றும் சிறுதானியங்கள்"},
    "4": {"id": "CHECK_ORDERS", "name_en": "Check Today's Orders", "name_ta": "இன்றைய ஆர்டர்களை பார்க்க"},
    "5": {"id": "HELP", "name_en": "Help & Support", "name_ta": "உதவி"}
}

PRODUCT_ITEMS_CONFIG = {
    "VEGETABLES": {
        "1": {"name": "Tomato", "name_ta": "தக்காளி", "default_price": 30.0},
        "2": {"name": "Onion", "name_ta": "வெங்காயம்", "default_price": 35.0},
        "3": {"name": "Potato", "name_ta": "உருளைக்கிழங்கு", "default_price": 25.0},
        "4": {"name": "Carrot", "name_ta": "கேரட்", "default_price": 40.0}
    },
    "FRUITS": {
        "1": {"name": "Banana", "name_ta": "வாழைப்பழம்", "default_price": 40.0},
        "2": {"name": "Mango", "name_ta": "மாம்பழம்", "default_price": 60.0},
        "3": {"name": "Apple", "name_ta": "ஆப்பிள்", "default_price": 100.0},
        "4": {"name": "Coconut", "name_ta": "தேங்காய்", "default_price": 30.0}
    },
    "GRAINS": {
        "1": {"name": "Rice", "name_ta": "அரிசி", "default_price": 50.0},
        "2": {"name": "Ragi", "name_ta": "கேழ்வரகு", "default_price": 45.0},
        "3": {"name": "Thinai", "name_ta": "தினை", "default_price": 55.0},
        "4": {"name": "Cholam", "name_ta": "சோளம்", "default_price": 40.0}
    }
}

PROMPTS = {
    "LANGUAGE_SELECT": {
        "ta": "தமிழுக்கு 1 அழுத்தவும். Press 2 for English.",
        "en": "Press 1 for Tamil. Press 2 for English."
    },
    "WELCOME_FARMER": {
        "ta": "வணக்கம் {name}! அக்ரிகனெக்ட் விவசாய சேவைக்கு வரவேற்கிறோம்.",
        "en": "Welcome {name}! Welcome to AgriConnect Farmer Service."
    },
    "UNREGISTERED_FARMER": {
        "ta": "மன்னிக்கவும், உங்கள் தொலைபேசி எண் பதிவு செய்யப்படவில்லை. தயவுசெய்து முதலில் பதிவு செய்யவும்.",
        "en": "Sorry, your mobile number is not registered. Please register your account first."
    },
    "MAIN_MENU": {
        "ta": "காய்கறிகளை சேர்க்க 1 அழுத்தவும். பழங்களை சேர்க்க 2 அழுத்தவும். தானியங்களை சேர்க்க 3 அழுத்தவும். இன்றைய ஆர்டர்களை பார்க்க 4 அழுத்தவும். உதவிக்கு 5 அழுத்தவும்.",
        "en": "Press 1 to add vegetables. Press 2 to add fruits. Press 3 to add grains or millets. Press 4 to check today's orders. Press 5 for help."
    },
    "PRODUCT_SELECT_VEGETABLES": {
        "ta": "தக்காளிக்கு 1, வெங்காயத்திற்கு 2, உருளைக்கிழங்கிற்கு 3, கேரட்டிற்கு 4 அழுத்தவும்.",
        "en": "Press 1 for Tomato, 2 for Onion, 3 for Potato, 4 for Carrot."
    },
    "PRODUCT_SELECT_FRUITS": {
        "ta": "வாழைப்பழத்திற்கு 1, மாம்பழத்திற்கு 2, ஆப்பிளுக்கு 3, தேங்காய்க்கு 4 அழுத்தவும்.",
        "en": "Press 1 for Banana, 2 for Mango, 3 for Apple, 4 for Coconut."
    },
    "PRODUCT_SELECT_GRAINS": {
        "ta": "அரிசிக்கு 1, கேழ்வரகிற்கு 2, தினைகளுக்கு 3, சோளத்திற்கு 4 அழுத்தவும்.",
        "en": "Press 1 for Rice, 2 for Ragi, 3 for Thinai, 4 for Cholam."
    },
    "ENTER_QUANTITY": {
        "ta": "தயவுசெய்து அளவை கிலோகிராமில் உள்ளிடவும் (எடுத்துக்காட்டாக 5, 10, அல்லது 25).",
        "en": "Please enter the quantity in kilograms."
    },
    "CONFIRM_PRODUCT": {
        "ta": "{product_name}, {quantity} கிலோ கிராம். உறுதிப்படுத்த 1 அழுத்தவும். ரத்து செய்ய 2 அழுத்தவும்.",
        "en": "{product_name}, {quantity} kilograms. Press 1 to confirm. Press 2 to cancel."
    },
    "PRODUCT_SUCCESS": {
        "ta": "உங்கள் பொருள் சந்தையில் வெற்றிகரமாக சேர்க்கப்பட்டது.",
        "en": "Your product has been added successfully to the marketplace."
    },
    "PRODUCT_CANCELLED": {
        "ta": "பொருள் சேர்ப்பது ரத்து செய்யப்பட்டது.",
        "en": "Product entry has been cancelled."
    },
    "NO_ORDERS_TODAY": {
        "ta": "உங்களுக்கு இன்று புதிய ஆர்டர்கள் எதுவும் இல்லை.",
        "en": "You have no new orders today."
    },
    "ORDERS_SUMMARY": {
        "ta": "உங்களுக்கு இன்று {count} புதிய ஆர்டர்கள் உள்ளன. விவரங்கள்: {details}.",
        "en": "You have {count} new orders today. Details: {details}."
    },
    "HELP_PROMPT": {
        "ta": "எங்கள் வாடிக்கையாளர் சேவை மையம் 1800-AGRI-CONNECT. எங்கள் பிரதிநிதி விரைவில் தொடர்பு கொள்வார்.",
        "en": "Our helpline is 1800-AGRI-CONNECT. An agent will contact you shortly."
    },
    "INVALID_INPUT": {
        "ta": "தவறான பதிவு. தயவுசெய்து மீண்டும் முயற்சிக்கவும்.",
        "en": "Invalid selection. Please try again."
    }
}

# -----------------------------------------------------------------------------
# IVR PROVIDER INTERFACE & ABSTRACTIONS
# -----------------------------------------------------------------------------

class IVRProvider(ABC):
    """Abstract Base Class for IVR Providers (Mock, Twilio, Exotel)"""

    @abstractmethod
    def get_provider_name(self) -> str:
        pass

    @abstractmethod
    async def process_call(self, request: IVRWebhookRequest, supabase_url: str, supabase_key: str) -> IVRResponse:
        pass

# -----------------------------------------------------------------------------
# MOCK IVR PROVIDER IMPLEMENTATION
# -----------------------------------------------------------------------------

class MockIVRProvider(IVRProvider):
    """Deterministic Mock IVR Provider operating with Supabase DB"""

    def get_provider_name(self) -> str:
        return "mock"

    def get_supabase_headers(self, supabase_key: str) -> Dict[str, str]:
        return {
            "apikey": supabase_key,
            "Authorization": f"Bearer {supabase_key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }

    async def log_call(self, client: httpx.AsyncClient, supabase_url: str, supabase_key: str, call_sid: str, caller_phone: str, farmer_id: Optional[str], status: str) -> Optional[str]:
        """Log call to ivr_calls table in Supabase"""
        if not supabase_url or not supabase_key:
            return None
        try:
            payload = {
                "call_sid": call_sid,
                "caller_phone": caller_phone,
                "farmer_id": farmer_id if farmer_id else None,
                "status": status,
                "duration_seconds": 12
            }
            res = await client.post(
                f"{supabase_url}/rest/v1/ivr_calls",
                json=payload,
                headers=self.get_supabase_headers(supabase_key)
            )
            if res.status_code in (200, 201):
                data = res.json()
                if isinstance(data, list) and len(data) > 0:
                    return data[0].get("id")
        except Exception as e:
            logger.error(f"Failed to log ivr_call: {e}")
        return None

    async def log_interaction(self, client: httpx.AsyncClient, supabase_url: str, supabase_key: str, call_id: Optional[str], interaction_type: str, data: dict):
        """Log interaction to ivr_interactions table in Supabase"""
        if not supabase_url or not supabase_key or not call_id:
            return
        try:
            payload = {
                "call_id": call_id,
                "interaction_type": interaction_type,
                "extracted_data": data
            }
            await client.post(
                f"{supabase_url}/rest/v1/ivr_interactions",
                json=payload,
                headers=self.get_supabase_headers(supabase_key)
            )
        except Exception as e:
            logger.error(f"Failed to log ivr_interaction: {e}")

    async def identify_farmer(self, client: httpx.AsyncClient, supabase_url: str, supabase_key: str, caller_phone: str) -> Optional[Dict[str, Any]]:
        """Look up real farmer by caller mobile number in Supabase users table"""
        if not supabase_url or not supabase_key:
            return None
        clean_phone = caller_phone.replace("+91", "").replace(" ", "").strip()
        try:
            # Query users table for phone match
            res = await client.get(
                f"{supabase_url}/rest/v1/users?phone=eq.{clean_phone}&role=eq.farmer",
                headers=self.get_supabase_headers(supabase_key)
            )
            if res.status_code == 200 and res.json():
                user = res.json()[0]
                return {"id": user["id"], "name": user.get("name", "Farmer"), "phone": user.get("phone")}
            
            # Fallback: query farmer_ivr mapping table
            ivr_res = await client.get(
                f"{supabase_url}/rest/v1/farmer_ivr?registered_mobile=eq.{clean_phone}",
                headers=self.get_supabase_headers(supabase_key)
            )
            if ivr_res.status_code == 200 and ivr_res.json():
                mapping = ivr_res.json()[0]
                farmer_id = mapping.get("farmer_id")
                if farmer_id:
                    u_res = await client.get(
                        f"{supabase_url}/rest/v1/users?id=eq.{farmer_id}",
                        headers=self.get_supabase_headers(supabase_key)
                    )
                    if u_res.status_code == 200 and u_res.json():
                        user = u_res.json()[0]
                        return {"id": user["id"], "name": user.get("name", "Farmer"), "phone": user.get("phone")}
        except Exception as e:
            logger.error(f"Error identifying farmer by phone: {e}")
        return None

    async def get_todays_orders(self, client: httpx.AsyncClient, supabase_url: str, supabase_key: str, farmer_id: str) -> List[Dict[str, Any]]:
        """Fetch real current orders for identified farmer from Supabase"""
        if not supabase_url or not supabase_key:
            return []
        try:
            res = await client.get(
                f"{supabase_url}/rest/v1/orders?farmer_id=eq.{farmer_id}&select=*,products(name)&order=created_at.desc",
                headers=self.get_supabase_headers(supabase_key)
            )
            if res.status_code == 200:
                return res.json()
        except Exception as e:
            logger.error(f"Error fetching farmer orders: {e}")
        return []

    async def create_product_listing(self, client: httpx.AsyncClient, supabase_url: str, supabase_key: str, farmer_id: str, product_name: str, quantity_kg: float, default_price: float) -> Optional[Dict[str, Any]]:
        """Insert product listing into Supabase products table against real farmer"""
        if not supabase_url or not supabase_key:
            return None
        try:
            farmer_str_id = str(farmer_id)
            headers = self.get_supabase_headers(supabase_key)

            # 1. Ensure user record exists
            u_res = await client.get(
                f"{supabase_url}/rest/v1/users?id=eq.{farmer_str_id}",
                headers=headers
            )
            if u_res.status_code == 200 and not u_res.json():
                random_phone = f"9{str(uuid.uuid4().int)[:9]}"
                await client.post(
                    f"{supabase_url}/rest/v1/users",
                    json={"id": farmer_str_id, "name": "Farmer", "phone": random_phone, "role": "farmer"},
                    headers=headers
                )

            # 2. Ensure farmer record exists in farmers table to satisfy foreign key constraint
            f_res = await client.get(
                f"{supabase_url}/rest/v1/farmers?user_id=eq.{farmer_str_id}",
                headers=headers
            )
            if f_res.status_code == 200 and not f_res.json():
                await client.post(
                    f"{supabase_url}/rest/v1/farmers",
                    json={"user_id": farmer_str_id, "verification_status": "Verified", "state": "Tamil Nadu", "district": "Coimbatore", "village": "Coimbatore"},
                    headers=headers
                )

            payload = {
                "farmer_id": farmer_str_id,
                "name": product_name,
                "description": f"IVR Voice Listing ({quantity_kg} kg available)",
                "price": default_price,
                "quantity_available": float(quantity_kg),
                "unit": "kg",
                "image_url": "IVR Listing - Image Not Available",
                "status": "Available",
                "delivery_preference": "Self Pickup"
            }
            res = await client.post(
                f"{supabase_url}/rest/v1/products",
                json=payload,
                headers=headers
            )
            if res.status_code in (200, 201) and res.json():
                return res.json()[0] if isinstance(res.json(), list) else res.json()
        except Exception as e:
            logger.error(f"Error creating IVR product listing: {e}")
        return None

    async def process_call(self, request: IVRWebhookRequest, supabase_url: str, supabase_key: str) -> IVRResponse:
        """State machine processor for Mock IVR Flow"""
        current_state = request.State or "INIT"
        digits = request.Digits.strip()
        lang_code = "ta" if request.Language == "Tamil" else "en" if request.Language == "English" else ""

        async with httpx.AsyncClient() as client:
            # 1. State: INIT (Call Inbound)
            if current_state == "INIT":
                call_db_id = await self.log_call(client, supabase_url, supabase_key, request.CallSid, request.From, None, "IN_PROGRESS")
                prompt = PROMPTS["LANGUAGE_SELECT"]["ta"]
                return IVRResponse(
                    text=prompt,
                    language="Tamil",
                    state="LANGUAGE_SELECT",
                    prompt_key="LANGUAGE_SELECT",
                    data={"call_db_id": call_db_id}
                )

            # 2. State: LANGUAGE_SELECT
            if current_state == "LANGUAGE_SELECT":
                if digits == "1":
                    selected_lang = "Tamil"
                    lang_code = "ta"
                elif digits == "2":
                    selected_lang = "English"
                    lang_code = "en"
                else:
                    return IVRResponse(
                        text=PROMPTS["INVALID_INPUT"]["ta"] + " " + PROMPTS["LANGUAGE_SELECT"]["ta"],
                        language="Tamil",
                        state="LANGUAGE_SELECT",
                        prompt_key="LANGUAGE_SELECT"
                    )

                # Identify Farmer
                farmer = await self.identify_farmer(client, supabase_url, supabase_key, request.From)
                call_db_id = await self.log_call(client, supabase_url, supabase_key, request.CallSid, request.From, farmer["id"] if farmer else None, "IDENTIFIED" if farmer else "UNAUTHORIZED")

                if not farmer:
                    prompt = PROMPTS["UNREGISTERED_FARMER"][lang_code]
                    await self.log_interaction(client, supabase_url, supabase_key, call_db_id, "FARMER_IDENTIFICATION_FAILED", {"phone": request.From, "reason": "Unregistered mobile number"})
                    return IVRResponse(
                        text=prompt,
                        language=selected_lang,
                        state="UNAUTHORIZED",
                        prompt_key="UNREGISTERED_FARMER",
                        success=False,
                        message="Farmer mobile number not found in Supabase"
                    )

                farmer_name = farmer["name"]
                welcome = PROMPTS["WELCOME_FARMER"][lang_code].format(name=farmer_name)
                menu = PROMPTS["MAIN_MENU"][lang_code]
                full_text = f"{welcome} {menu}"

                await self.log_interaction(client, supabase_url, supabase_key, call_db_id, "FARMER_IDENTIFIED", {"farmer_id": farmer["id"], "farmer_name": farmer_name, "language": selected_lang})

                return IVRResponse(
                    text=full_text,
                    language=selected_lang,
                    state="MAIN_MENU",
                    prompt_key="MAIN_MENU",
                    farmer_id=farmer["id"],
                    farmer_name=farmer_name,
                    data={"call_db_id": call_db_id}
                )

            # 3. State: MAIN_MENU
            if current_state == "MAIN_MENU":
                farmer_id = request.FarmerId
                farmer_name = request.To or "Farmer"
                
                # Option 1, 2, 3: Add Vegetables, Fruits, Grains
                if digits in ("1", "2", "3"):
                    cat_map = {"1": "VEGETABLES", "2": "FRUITS", "3": "GRAINS"}
                    cat_key = cat_map[digits]
                    prompt_key = f"PRODUCT_SELECT_{cat_key}"
                    prompt_text = PROMPTS[prompt_key][lang_code]
                    return IVRResponse(
                        text=prompt_text,
                        language=request.Language or "Tamil",
                        state="PRODUCT_SELECT",
                        prompt_key=prompt_key,
                        farmer_id=farmer_id,
                        farmer_name=farmer_name,
                        data={"category": cat_key}
                    )

                # Option 4: Check Today's Orders
                elif digits == "4":
                    if not farmer_id:
                        farmer = await self.identify_farmer(client, supabase_url, supabase_key, request.From)
                        farmer_id = farmer["id"] if farmer else None

                    if not farmer_id:
                        return IVRResponse(
                            text=PROMPTS["UNREGISTERED_FARMER"][lang_code],
                            language=request.Language or "Tamil",
                            state="UNAUTHORIZED",
                            success=False
                        )

                    orders = await self.get_todays_orders(client, supabase_url, supabase_key, farmer_id)
                    count = len(orders)
                    if count == 0:
                        prompt_text = PROMPTS["NO_ORDERS_TODAY"][lang_code]
                    else:
                        details_list = []
                        for idx, o in enumerate(orders[:3], 1):
                            p_name = o.get("products", {}).get("name", "Produce") if isinstance(o.get("products"), dict) else "Produce"
                            details_list.append(f"Order #{str(o.get('id'))[:4]}: {o.get('quantity', 0)} kg {p_name} ({o.get('status', 'Pending')})")
                        details_str = ", ".join(details_list)
                        prompt_text = PROMPTS["ORDERS_SUMMARY"][lang_code].format(count=count, details=details_str)

                    call_db_id = await self.log_call(client, supabase_url, supabase_key, request.CallSid, request.From, farmer_id, "COMPLETED")
                    await self.log_interaction(client, supabase_url, supabase_key, call_db_id, "CHECK_ORDERS", {"order_count": count, "farmer_id": farmer_id})

                    return IVRResponse(
                        text=prompt_text,
                        language=request.Language or "Tamil",
                        state="COMPLETED",
                        prompt_key="ORDERS_SUMMARY" if count > 0 else "NO_ORDERS_TODAY",
                        farmer_id=farmer_id,
                        data={"orders_count": count, "orders": orders}
                    )

                # Option 5: Help
                elif digits == "5":
                    prompt_text = PROMPTS["HELP_PROMPT"][lang_code]
                    call_db_id = await self.log_call(client, supabase_url, supabase_key, request.CallSid, request.From, farmer_id, "COMPLETED")
                    await self.log_interaction(client, supabase_url, supabase_key, call_db_id, "HELP", {"farmer_id": farmer_id})

                    return IVRResponse(
                        text=prompt_text,
                        language=request.Language or "Tamil",
                        state="COMPLETED",
                        prompt_key="HELP_PROMPT",
                        farmer_id=farmer_id
                    )

                else:
                    return IVRResponse(
                        text=PROMPTS["INVALID_INPUT"][lang_code] + " " + PROMPTS["MAIN_MENU"][lang_code],
                        language=request.Language or "Tamil",
                        state="MAIN_MENU",
                        prompt_key="MAIN_MENU",
                        farmer_id=farmer_id
                    )

            # 4. State: PRODUCT_SELECT
            if current_state == "PRODUCT_SELECT":
                cat_key = request.SelectedCategory or "VEGETABLES"
                item_dict = PRODUCT_ITEMS_CONFIG.get(cat_key, {})
                selected_item = item_dict.get(digits)

                if not selected_item:
                    fallback_prompt = PROMPTS["INVALID_INPUT"][lang_code] + " " + PROMPTS[f"PRODUCT_SELECT_{cat_key}"][lang_code]
                    return IVRResponse(
                        text=fallback_prompt,
                        language=request.Language or "Tamil",
                        state="PRODUCT_SELECT",
                        prompt_key=f"PRODUCT_SELECT_{cat_key}",
                        farmer_id=request.FarmerId,
                        data={"category": cat_key}
                    )

                product_name = selected_item["name"]
                prompt_text = PROMPTS["ENTER_QUANTITY"][lang_code]

                return IVRResponse(
                    text=prompt_text,
                    language=request.Language or "Tamil",
                    state="ENTER_QUANTITY",
                    prompt_key="ENTER_QUANTITY",
                    farmer_id=request.FarmerId,
                    data={
                        "category": cat_key,
                        "product_name": product_name,
                        "default_price": selected_item["default_price"]
                    }
                )

            # 5. State: ENTER_QUANTITY
            if current_state == "ENTER_QUANTITY":
                product_name = request.SelectedProduct or "Produce"
                try:
                    qty = float(digits) if digits and digits.replace('.', '', 1).isdigit() else (request.QuantityKg or 5.0)
                except Exception:
                    qty = request.QuantityKg or 5.0

                if qty <= 0:
                    qty = 5.0

                confirm_prompt = PROMPTS["CONFIRM_PRODUCT"][lang_code].format(product_name=product_name, quantity=qty)

                return IVRResponse(
                    text=confirm_prompt,
                    language=request.Language or "Tamil",
                    state="CONFIRM_PRODUCT",
                    prompt_key="CONFIRM_PRODUCT",
                    farmer_id=request.FarmerId,
                    data={
                        "category": request.SelectedCategory,
                        "product_name": product_name,
                        "quantity_kg": qty
                    }
                )

            # 6. State: CONFIRM_PRODUCT
            if current_state == "CONFIRM_PRODUCT":
                farmer_id = request.FarmerId
                if not farmer_id:
                    farmer = await self.identify_farmer(client, supabase_url, supabase_key, request.From)
                    farmer_id = farmer["id"] if farmer else None

                if digits == "1":
                    product_name = request.SelectedProduct or "Produce"
                    qty = request.QuantityKg or 5.0
                    cat_key = request.SelectedCategory or "VEGETABLES"
                    default_price = 30.0
                    for c_key, items in PRODUCT_ITEMS_CONFIG.items():
                        for k, itm in items.items():
                            if itm["name"] == product_name:
                                default_price = itm["default_price"]

                    created_product = await self.create_product_listing(client, supabase_url, supabase_key, farmer_id, product_name, qty, default_price)

                    call_db_id = await self.log_call(client, supabase_url, supabase_key, request.CallSid, request.From, farmer_id, "COMPLETED")
                    await self.log_interaction(
                        client, supabase_url, supabase_key, call_db_id, "ADD_PRODUCT",
                        {
                            "product_name": product_name,
                            "quantity_kg": qty,
                            "price": default_price,
                            "product_id": created_product.get("id") if created_product else None,
                            "farmer_id": farmer_id
                        }
                    )

                    return IVRResponse(
                        text=PROMPTS["PRODUCT_SUCCESS"][lang_code],
                        language=request.Language or "Tamil",
                        state="COMPLETED",
                        prompt_key="PRODUCT_SUCCESS",
                        farmer_id=farmer_id,
                        data={"created_product": created_product}
                    )

                else:
                    return IVRResponse(
                        text=PROMPTS["PRODUCT_CANCELLED"][lang_code],
                        language=request.Language or "Tamil",
                        state="COMPLETED",
                        prompt_key="PRODUCT_CANCELLED",
                        farmer_id=farmer_id
                    )

            # Fallback for unhandled state
            return IVRResponse(
                text=PROMPTS["INVALID_INPUT"][lang_code],
                language=request.Language or "Tamil",
                state="COMPLETED",
                prompt_key="INVALID_INPUT"
            )

# -----------------------------------------------------------------------------
# TWILIO IVR PROVIDER INTERFACE
# -----------------------------------------------------------------------------

class TwilioIVRProvider(IVRProvider):
    """Twilio TwiML Integration Interface"""

    def get_provider_name(self) -> str:
        return "twilio"

    def generate_twiml(self, prompt_text: str, language: str = "Tamil", action_url: str = "/api/ivr/input") -> str:
        voice = "Polly.Aditi"
        lang_attr = "ta-IN" if language == "Tamil" else "en-IN"
        twiml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Gather numDigits="1" action="{action_url}" method="POST">
        <Say language="{lang_attr}" voice="{voice}">{prompt_text}</Say>
    </Gather>
</Response>"""
        return twiml

    async def process_call(self, request: IVRWebhookRequest, supabase_url: str, supabase_key: str) -> IVRResponse:
        mock = MockIVRProvider()
        mock_res = await mock.process_call(request, supabase_url, supabase_key)
        twiml_xml = self.generate_twiml(mock_res.text or "", mock_res.language)
        mock_res.twiml = twiml_xml
        return mock_res

# -----------------------------------------------------------------------------
# EXOTEL IVR PROVIDER INTERFACE
# -----------------------------------------------------------------------------

class ExotelIVRProvider(IVRProvider):
    """Exotel Passthrough / JSON Integration Interface"""

    def get_provider_name(self) -> str:
        return "exotel"

    async def process_call(self, request: IVRWebhookRequest, supabase_url: str, supabase_key: str) -> IVRResponse:
        mock = MockIVRProvider()
        mock_res = await mock.process_call(request, supabase_url, supabase_key)
        return mock_res

# -----------------------------------------------------------------------------
# PROVIDER FACTORY
# -----------------------------------------------------------------------------

def get_ivr_provider() -> IVRProvider:
    """Returns configured IVRProvider singleton based on IVR_PROVIDER env var"""
    provider_name = os.environ.get("IVR_PROVIDER", "mock").lower().strip()
    if provider_name == "twilio":
        return TwilioIVRProvider()
    elif provider_name == "exotel":
        return ExotelIVRProvider()
    else:
        return MockIVRProvider()

# Standard Helper Exports
def handle_incoming_call(req: IVRWebhookRequest) -> IVRResponse:
    provider = get_ivr_provider()
    # Simple sync fallback wrapper for legacy calls
    return IVRResponse(
        twiml="""<Response><Gather action="/api/ivr/input"><Say language="ta-IN">வணக்கம். AgriConnect-க்கு வரவேற்கிறோம்.</Say></Gather></Response>""",
        text=PROMPTS["LANGUAGE_SELECT"]["ta"],
        state="LANGUAGE_SELECT"
    )

def handle_digit_input(req: IVRWebhookRequest) -> IVRResponse:
    digits = req.Digits
    if digits == "1":
        response_text = PROMPTS["PRODUCT_SELECT_VEGETABLES"]["ta"]
    elif digits == "2":
        response_text = PROMPTS["PRODUCT_SELECT_FRUITS"]["ta"]
    elif digits == "3":
        response_text = PROMPTS["PRODUCT_SELECT_GRAINS"]["ta"]
    elif digits == "4":
        response_text = "உங்களுக்கு இன்று 2 புதிய ஆர்டர்கள் உள்ளன."
    elif digits == "5":
        response_text = PROMPTS["HELP_PROMPT"]["ta"]
    else:
        response_text = PROMPTS["INVALID_INPUT"]["ta"]

    return IVRResponse(
        twiml=f"""<Response><Say language="ta-IN">{response_text}</Say></Response>""",
        text=response_text,
        state="COMPLETED"
    )
