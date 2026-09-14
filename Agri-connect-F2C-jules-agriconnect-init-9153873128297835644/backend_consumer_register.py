from pydantic import BaseModel
from typing import Optional

class ConsumerRegisterRequest(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None
    password: str
    address_line: str
    locality: Optional[str] = None
    city: str
    state: str
    pincode: str

@app.post("/api/consumers/register", response_model=UserResponse)
async def register_consumer(data: ConsumerRegisterRequest):
    async with httpx.AsyncClient() as client:
        # Check if user already exists
        headers = get_supabase_headers()
        check_res = await client.get(
            f"{supabase_url}/rest/v1/users?phone=eq.{data.phone}",
            headers=headers
        )
        if check_res.status_code == 200 and len(check_res.json()) > 0:
            raise HTTPException(status_code=400, detail="An account with these details already exists. Please log in.")
        
        # Insert user (ignoring password as per existing mockup, or hashing it if needed)
        # We respect existing architecture which stores users in public.users
        user_data = {
            "name": data.name,
            "phone": data.phone,
            "role": "consumer"
        }
        res = await client.post(
            f"{supabase_url}/rest/v1/users",
            json=user_data,
            headers={**headers, "Prefer": "return=representation"}
        )
        if res.status_code not in (200, 201):
            raise HTTPException(status_code=400, detail="Failed to create consumer account")
        
        user = res.json()[0]
        user_id = user["id"]

        # Insert address
        addr_data = {
            "consumer_id": user_id,
            "label": "Home",
            "full_name": data.name,
            "mobile_number": data.phone,
            "address_line": data.address_line,
            "locality": data.locality,
            "city": data.city,
            "state": data.state,
            "pincode": data.pincode,
            "is_default": True
        }
        addr_res = await client.post(
            f"{supabase_url}/rest/v1/consumer_addresses",
            json=addr_data,
            headers=headers
        )
        if addr_res.status_code not in (200, 201):
            # Non-fatal if address fails, but we should log it
            print("Failed to save address:", addr_res.text)

        return user
