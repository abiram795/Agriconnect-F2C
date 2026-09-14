import pytest
import asyncio
from ivr_service import (
    IVRWebhookRequest,
    IVRResponse,
    MockIVRProvider,
    TwilioIVRProvider,
    ExotelIVRProvider,
    get_ivr_provider,
    PROMPTS,
    MAIN_MENU_CONFIG,
    PRODUCT_ITEMS_CONFIG
)

SUPABASE_URL = "https://mock.supabase.co"
SUPABASE_KEY = "mock_key"

def test_mock_provider_name():
    provider = MockIVRProvider()
    assert provider.get_provider_name() == "mock"

def test_twilio_provider_name():
    provider = TwilioIVRProvider()
    assert provider.get_provider_name() == "twilio"
    twiml = provider.generate_twiml("Test Prompt", "Tamil")
    assert "<Say language=\"ta-IN\" voice=\"Polly.Aditi\">Test Prompt</Say>" in twiml

def test_exotel_provider_name():
    provider = ExotelIVRProvider()
    assert provider.get_provider_name() == "exotel"

def test_call_init_and_language_selection_tamil():
    async def _test():
        provider = MockIVRProvider()
        
        # Step 1: Call Init
        req1 = IVRWebhookRequest(From="9876543210", State="INIT")
        res1 = await provider.process_call(req1, "", "")
        assert res1.state == "LANGUAGE_SELECT"
        assert "தமிழுக்கு 1 அழுத்தவும்" in res1.text

        # Step 2: Select Tamil (Digits=1)
        req2 = IVRWebhookRequest(From="9876543210", State="LANGUAGE_SELECT", Digits="1")
        res2 = await provider.process_call(req2, "", "")
        assert res2.language == "Tamil"

    asyncio.run(_test())

def test_call_language_selection_english():
    async def _test():
        provider = MockIVRProvider()
        req = IVRWebhookRequest(From="9876543210", State="LANGUAGE_SELECT", Digits="2")
        res = await provider.process_call(req, "", "")
        assert res.language == "English"

    asyncio.run(_test())

def test_unregistered_invalid_farmer_access():
    async def _test():
        provider = MockIVRProvider()
        req = IVRWebhookRequest(From="0000000000", State="LANGUAGE_SELECT", Digits="1")
        res = await provider.process_call(req, "", "")
        assert res.state == "UNAUTHORIZED"
        assert res.success is False
        assert "மன்னிக்கவும்" in res.text or "not registered" in res.text

    asyncio.run(_test())

def test_main_menu_configurable_structure():
    assert "1" in MAIN_MENU_CONFIG
    assert MAIN_MENU_CONFIG["1"]["id"] == "VEGETABLES"
    assert MAIN_MENU_CONFIG["2"]["id"] == "FRUITS"
    assert MAIN_MENU_CONFIG["3"]["id"] == "GRAINS"
    assert MAIN_MENU_CONFIG["4"]["id"] == "CHECK_ORDERS"
    assert MAIN_MENU_CONFIG["5"]["id"] == "HELP"

def test_add_vegetable_flow():
    async def _test():
        provider = MockIVRProvider()
        
        # 1. Main Menu -> Select Vegetables (1)
        req1 = IVRWebhookRequest(From="9876543210", State="MAIN_MENU", Digits="1", Language="Tamil", FarmerId="mock-farmer-id")
        res1 = await provider.process_call(req1, "", "")
        assert res1.state == "PRODUCT_SELECT"
        assert res1.data["category"] == "VEGETABLES"
        assert "தக்காளிக்கு 1" in res1.text

        # 2. Select Item -> Tomato (1)
        req2 = IVRWebhookRequest(From="9876543210", State="PRODUCT_SELECT", Digits="1", Language="Tamil", SelectedCategory="VEGETABLES", FarmerId="mock-farmer-id")
        res2 = await provider.process_call(req2, "", "")
        assert res2.state == "ENTER_QUANTITY"
        assert res2.data["product_name"] == "Tomato"

        # 3. Enter Quantity -> 5 kg
        req3 = IVRWebhookRequest(From="9876543210", State="ENTER_QUANTITY", Digits="5", Language="Tamil", SelectedCategory="VEGETABLES", SelectedProduct="Tomato", FarmerId="mock-farmer-id")
        res3 = await provider.process_call(req3, "", "")
        assert res3.state == "CONFIRM_PRODUCT"
        assert "Tomato" in res3.text
        assert "5" in res3.text

        # 4. Confirm -> 1
        req4 = IVRWebhookRequest(From="9876543210", State="CONFIRM_PRODUCT", Digits="1", Language="Tamil", SelectedCategory="VEGETABLES", SelectedProduct="Tomato", QuantityKg=5.0, FarmerId="mock-farmer-id")
        res4 = await provider.process_call(req4, "", "")
        assert res4.state == "COMPLETED"
        assert "வெற்றிகரமாக சேர்க்கப்பட்டது" in res4.text

    asyncio.run(_test())

def test_add_fruit_flow():
    async def _test():
        provider = MockIVRProvider()
        req1 = IVRWebhookRequest(From="9876543210", State="MAIN_MENU", Digits="2", Language="English", FarmerId="mock-farmer-id")
        res1 = await provider.process_call(req1, "", "")
        assert res1.state == "PRODUCT_SELECT"
        assert res1.data["category"] == "FRUITS"
        assert "Banana" in res1.text or "Press 1" in res1.text

        req2 = IVRWebhookRequest(From="9876543210", State="PRODUCT_SELECT", Digits="1", Language="English", SelectedCategory="FRUITS", FarmerId="mock-farmer-id")
        res2 = await provider.process_call(req2, "", "")
        assert res2.data["product_name"] == "Banana"

        req3 = IVRWebhookRequest(From="9876543210", State="ENTER_QUANTITY", Digits="10", Language="English", SelectedCategory="FRUITS", SelectedProduct="Banana", FarmerId="mock-farmer-id")
        res3 = await provider.process_call(req3, "", "")
        assert "Banana" in res3.text
        assert "10" in res3.text

    asyncio.run(_test())

def test_add_grain_millet_flow():
    async def _test():
        provider = MockIVRProvider()
        req1 = IVRWebhookRequest(From="9876543210", State="MAIN_MENU", Digits="3", Language="Tamil", FarmerId="mock-farmer-id")
        res1 = await provider.process_call(req1, "", "")
        assert res1.state == "PRODUCT_SELECT"
        assert res1.data["category"] == "GRAINS"

        req2 = IVRWebhookRequest(From="9876543210", State="PRODUCT_SELECT", Digits="2", Language="Tamil", SelectedCategory="GRAINS", FarmerId="mock-farmer-id")
        res2 = await provider.process_call(req2, "", "")
        assert res2.data["product_name"] == "Ragi"

    asyncio.run(_test())

def test_quantity_validation():
    async def _test():
        provider = MockIVRProvider()
        req = IVRWebhookRequest(From="9876543210", State="ENTER_QUANTITY", Digits="invalid_qty", Language="English", SelectedProduct="Rice", FarmerId="mock-farmer-id")
        res = await provider.process_call(req, "", "")
        assert "5" in res.text

    asyncio.run(_test())

def test_todays_orders_flow():
    async def _test():
        provider = MockIVRProvider()
        req = IVRWebhookRequest(From="9876543210", State="MAIN_MENU", Digits="4", Language="English", FarmerId="mock-farmer-id")
        res = await provider.process_call(req, "", "")
        assert res.state == "COMPLETED"
        assert "orders" in res.text.lower() or "no new orders" in res.text.lower()

    asyncio.run(_test())

def test_help_flow():
    async def _test():
        provider = MockIVRProvider()
        req = IVRWebhookRequest(From="9876543210", State="MAIN_MENU", Digits="5", Language="Tamil", FarmerId="mock-farmer-id")
        res = await provider.process_call(req, "", "")
        assert res.state == "COMPLETED"
        assert "1800-AGRI-CONNECT" in res.text

    asyncio.run(_test())
