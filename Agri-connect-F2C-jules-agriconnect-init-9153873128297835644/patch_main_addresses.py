import re

with open("backend/main.py", "r", encoding="utf-8") as f:
    code = f.read()

old_addresses = """# Addresses API
addresses_db: Dict[UUID, AddressResponse] = {}

@app.post("/api/addresses", response_model=AddressResponse)
def create_address(addr: AddressCreate):
    count = sum(1 for a in addresses_db.values() if a.consumer_id == addr.consumer_id)
    if count >= 3:
        raise HTTPException(status_code=400, detail="Maximum 3 addresses allowed per consumer")
    
    addr_id = uuid4()
    new_addr = AddressResponse(id=addr_id, **addr.model_dump())
    addresses_db[addr_id] = new_addr
    return new_addr

@app.get("/api/addresses/{consumer_id}", response_model=List[AddressResponse])
def get_addresses(consumer_id: UUID):
    return [a for a in addresses_db.values() if a.consumer_id == consumer_id]

@app.put("/api/addresses/{addr_id}", response_model=AddressResponse)
def update_address(addr_id: UUID, addr: AddressCreate):
    if addr_id not in addresses_db:
        raise HTTPException(status_code=404, detail="Address not found")
    
    updated_addr = AddressResponse(id=addr_id, **addr.model_dump())
    addresses_db[addr_id] = updated_addr
    return updated_addr

@app.delete("/api/addresses/{addr_id}")
def delete_address(addr_id: UUID):
    if addr_id not in addresses_db:
        raise HTTPException(status_code=404, detail="Address not found")
    del addresses_db[addr_id]
    return {"status": "success"}"""

new_addresses = """# Addresses API

@app.post("/api/addresses", response_model=AddressResponse)
async def create_address(addr: AddressCreate):
    async with httpx.AsyncClient() as client:
        # Check count
        count_res = await client.get(
            f"{supabase_url}/rest/v1/consumer_addresses?consumer_id=eq.{addr.consumer_id}&select=id",
            headers=get_supabase_headers()
        )
        if count_res.status_code == 200 and len(count_res.json()) >= 3:
            raise HTTPException(status_code=400, detail="Maximum 3 addresses allowed per consumer")
        
        # Unset default if necessary
        if addr.is_default:
            await client.patch(
                f"{supabase_url}/rest/v1/consumer_addresses?consumer_id=eq.{addr.consumer_id}",
                json={"is_default": False},
                headers=get_supabase_headers()
            )
            
        data = addr.model_dump()
        data["consumer_id"] = str(data["consumer_id"])
        
        res = await client.post(
            f"{supabase_url}/rest/v1/consumer_addresses",
            json=data,
            headers=get_supabase_headers(prefer="return=representation")
        )
        if res.status_code not in (200, 201):
            raise HTTPException(status_code=400, detail="Failed to create address")
        return res.json()[0]

@app.get("/api/addresses/{consumer_id}", response_model=List[AddressResponse])
async def get_addresses(consumer_id: UUID):
    async with httpx.AsyncClient() as client:
        res = await client.get(
            f"{supabase_url}/rest/v1/consumer_addresses?consumer_id=eq.{consumer_id}&order=created_at.desc.nullslast",
            headers=get_supabase_headers()
        )
        if res.status_code != 200:
            return []
        return res.json()

@app.put("/api/addresses/{addr_id}", response_model=AddressResponse)
async def update_address(addr_id: UUID, addr: AddressCreate):
    async with httpx.AsyncClient() as client:
        if addr.is_default:
            await client.patch(
                f"{supabase_url}/rest/v1/consumer_addresses?consumer_id=eq.{addr.consumer_id}",
                json={"is_default": False},
                headers=get_supabase_headers()
            )
            
        data = addr.model_dump()
        data["consumer_id"] = str(data["consumer_id"])
        
        res = await client.patch(
            f"{supabase_url}/rest/v1/consumer_addresses?id=eq.{addr_id}",
            json=data,
            headers=get_supabase_headers(prefer="return=representation")
        )
        if res.status_code not in (200, 201) or not res.json():
            raise HTTPException(status_code=400, detail="Failed to update address")
        return res.json()[0]

@app.delete("/api/addresses/{addr_id}")
async def delete_address(addr_id: UUID):
    async with httpx.AsyncClient() as client:
        res = await client.delete(
            f"{supabase_url}/rest/v1/consumer_addresses?id=eq.{addr_id}",
            headers=get_supabase_headers()
        )
        if res.status_code not in (200, 204):
            raise HTTPException(status_code=400, detail="Failed to delete address")
        return {"status": "success"}"""

if old_addresses in code:
    code = code.replace(old_addresses, new_addresses)
    with open("backend/main.py", "w", encoding="utf-8") as f:
        f.write(code)
    print("Addresses updated successfully!")
else:
    print("Could not find old addresses block.")
