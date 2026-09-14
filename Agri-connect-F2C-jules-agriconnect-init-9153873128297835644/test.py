import httpx
import asyncio

async def test():
    async with httpx.AsyncClient() as client:
        res = await client.post("http://localhost:8000/api/orders", json={
            "consumer_id": "00000000-0000-0000-0000-000000000000",
            "farmer_id": "00000000-0000-0000-0000-000000000000",
            "product_id": "00000000-0000-0000-0000-000000000000",
            "quantity": 1,
            "total_amount": 50,
            "fulfillment_method": "Delivery Partner",
            "delivery_address": {"address": "test"}
        })
        print(res.status_code)
        print(res.text)

asyncio.run(test())
