code = open('backend/main.py', 'r', encoding='utf-8').read()

old_block = '''@app.post("/api/delivery/register", response_model=UserResponse)
async def register_delivery_partner(
    name: str = Form(...),
    phone: str = Form(...),
    email: str = Form(None),
    address: str = Form(None),
    service_area: str = Form(None),
    service_radius_km: int = Form(...),
    vehicle_type: str = Form(...),
    license_document: UploadFile = File(None)
):
    try:
        if not supabase_url:
            raise HTTPException(status_code=500, detail="Supabase not configured")

        user_data = {"name": name, "phone": phone, "role": "delivery_partner"}
        async with httpx.AsyncClient() as client:
            res = await client.post(f"{supabase_url}/rest/v1/users", json=user_data, headers=get_supabase_headers())
            if res.status_code not in (200, 201):
                raise HTTPException(status_code=400, detail="Failed to create user")
            user_id = res.json()[0]['id']
            
            dp_data = {
                "user_id": user_id,
                "service_radius_km": service_radius_km,
                "vehicle_type": vehicle_type,
                "verification_status": "Pending"
            }
            dp_res = await client.post(f"{supabase_url}/rest/v1/delivery_partners", json=dp_data, headers=get_supabase_headers())
            if dp_res.status_code not in (200, 201):
                raise HTTPException(status_code=400, detail="Failed to create delivery partner profile")

        return UserResponse(id=UUID(user_id), name=name, phone=phone, role="delivery_partner")
    except Exception as e:
        print("Registration Error:", e)
        raise HTTPException(status_code=500, detail=str(e))'''

new_block = '''@app.post("/api/delivery/register", response_model=UserResponse)
async def register_delivery_partner(
    name: str = Form(...),
    phone: str = Form(...),
    email: str = Form(None),
    address: str = Form(None),
    service_area: str = Form(None),
    service_radius_km: int = Form(10),
    vehicle_type: str = Form(...),
    license_document: UploadFile = File(None)
):
    try:
        if not supabase_url:
            raise HTTPException(status_code=500, detail="Supabase not configured")
  
        license_path = None
        async with httpx.AsyncClient() as client:
            # Try to upload license document (non-fatal if storage not set up)
            if license_document and license_document.filename:
                try:
                    file_ext = license_document.filename.split(".")[-1]
                    license_path = f"licenses/{uuid4()}.{file_ext}"
                    file_content = await license_document.read()
                    storage_res = await client.post(
                        f"{supabase_url}/storage/v1/object/delivery_documents/{license_path}",
                        content=file_content,
                        headers={
                            "apikey": supabase_key,
                            "Authorization": f"Bearer {supabase_key}",
                            "Content-Type": license_document.content_type or "application/octet-stream"
                        }
                    )
                    if storage_res.status_code not in (200, 201):
                        print(f"[WARN] License upload failed: {storage_res.text}")
                        license_path = license_document.filename
                except Exception as upload_ex:
                    print(f"[WARN] License upload exception: {upload_ex}")
                    license_path = license_document.filename if license_document else None

            # Check if phone already registered as delivery partner
            check_res = await client.get(
                f"{supabase_url}/rest/v1/users?phone=eq.{phone}&role=eq.delivery_partner",
                headers=get_supabase_headers()
            )
            if check_res.status_code == 200 and check_res.json():
                raise HTTPException(status_code=400, detail="A delivery partner account with this phone number already exists. Please log in.")

            user_data = {"name": name, "phone": phone, "role": "delivery_partner"}
            res = await client.post(
                f"{supabase_url}/rest/v1/users",
                json=user_data,
                headers={**get_supabase_headers(), "Prefer": "return=representation"}
            )
            if res.status_code not in (200, 201):
                raise HTTPException(status_code=400, detail=f"Failed to create user: {res.text}")
            
            user_list = res.json()
            if not user_list:
                raise HTTPException(status_code=400, detail="User created but could not retrieve ID. Check Supabase RLS.")
            user_id = user_list[0]["id"]
            
            dp_data = {
                "user_id": user_id,
                "service_area": service_area or "",
                "service_radius_km": service_radius_km or 10,
                "vehicle_type": vehicle_type,
                "address": address or "",
                "license_path": license_path or "",
                "verification_status": "Pending",
                "is_available": True
            }
            dp_res = await client.post(
                f"{supabase_url}/rest/v1/delivery_partners",
                json=dp_data,
                headers={**get_supabase_headers(), "Prefer": "return=representation"}
            )
            if dp_res.status_code not in (200, 201):
                # Rollback user creation
                await client.delete(f"{supabase_url}/rest/v1/users?id=eq.{user_id}", headers=get_supabase_headers())
                raise HTTPException(status_code=400, detail=f"Failed to create delivery partner profile: {dp_res.text}")
  
        return UserResponse(id=UUID(user_id), name=name, phone=phone, role="delivery_partner")
    except HTTPException:
        raise
    except Exception as e:
        print("Delivery Registration Error:", e)
        raise HTTPException(status_code=500, detail=f"Registration error: {str(e)}")'''

if old_block in code:
    code = code.replace(old_block, new_block)
    print("Replaced delivery register!")
else:
    print("NOT FOUND!")
    # try with slightly different whitespace
    import re
    # Find the block
    idx = code.find('@app.post("/api/delivery/register"')
    end_idx = code.find('@app.get("/api/orders/available-deliveries")', idx)
    print(f"Block from {idx} to {end_idx}")
    print(repr(code[idx:end_idx]))

open('backend/main.py', 'w', encoding='utf-8').write(code)
print("Done")
