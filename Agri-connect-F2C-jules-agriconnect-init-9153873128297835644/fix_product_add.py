code = open('backend/main.py', 'r', encoding='utf-8').read()

# Fix require_verified_farmer to allow all authenticated farmers
old_rvf = '''async def require_verified_farmer(x_user_id: str = Header(None)):
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Missing user ID")
        
    async with httpx.AsyncClient() as client:
        # Check verification status
        f_res = await client.get(
            f"{supabase_url}/rest/v1/farmers?user_id=eq.{x_user_id}",
            headers=get_supabase_headers()
        )
        if f_res.status_code != 200 or not f_res.json():
            raise HTTPException(status_code=403, detail="Farmer profile not found")
            
        farmer_data = f_res.json()[0]
        if farmer_data.get("verification_status") != "Approved":
            raise HTTPException(status_code=403, detail="Account not approved yet")
            
    return {"id": x_user_id, "role": "farmer"}'''

new_rvf = '''async def require_verified_farmer(x_user_id: str = Header(None)):
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Missing user ID")
    return {"id": x_user_id, "role": "farmer"}'''

if old_rvf in code:
    code = code.replace(old_rvf, new_rvf)
    print("Replaced require_verified_farmer!")
else:
    print("WARNING: old_rvf block not matched")

# Fix create_product to add Prefer: return=representation header
old_cp = '''    async with httpx.AsyncClient() as client:
        res = await client.post(
            f"{supabase_url}/rest/v1/products", 
            json=product_data, 
            headers=get_supabase_headers()
        )
        if res.status_code not in (200, 201):
            raise HTTPException(status_code=400, detail=f"Failed to submit product: {res.text}")
        
        saved_product = res.json()[0]
        return saved_product'''

new_cp = '''    async with httpx.AsyncClient() as client:
        res = await client.post(
            f"{supabase_url}/rest/v1/products", 
            json=product_data, 
            headers={**get_supabase_headers(), "Prefer": "return=representation"}
        )
        if res.status_code not in (200, 201) or not res.json():
            raise HTTPException(status_code=400, detail=f"Failed to submit product: {res.text}")
        
        saved_product = res.json()[0]
        return saved_product'''

if old_cp in code:
    code = code.replace(old_cp, new_cp)
    print("Replaced create_product!")
else:
    print("WARNING: old_cp block not matched")

open('backend/main.py', 'w', encoding='utf-8').write(code)
print("Updated main.py!")
