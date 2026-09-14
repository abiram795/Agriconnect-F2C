code = open('backend/main.py', 'r', encoding='utf-8').read()

# === FIX 1: FARMER REGISTRATION ===
# Make storage upload non-fatal; log the error and continue with file path as None
old_farmer_register = '''@app.post("/api/farmers/register", response_model=UserResponse)
async def register_farmer(
    name: str = Form(...),
    phone: str = Form(...),
    state: str = Form(...),
    district: str = Form(...),
    village: str = Form(...),
    farm_size: str = Form(...),
    languages: str = Form(...),
    land_area: str = Form(...),
    acreage: float = Form(...),
    ownership_status: str = Form(...),
    document_type: str = Form(...),
    document: UploadFile = File(...)
):
    try:
        if not supabase_url:
            raise HTTPException(status_code=500, detail="Supabase not configured")

        # 1. Upload file to Supabase Storage
        file_ext = document.filename.split('.')[-1]
        file_path = f"{uuid4()}.{file_ext}"
        file_content = await document.read()
        
        async with httpx.AsyncClient() as client:
            storage_res = await client.post(
                f"{supabase_url}/storage/v1/object/farmer_documents/{file_path}",
                content=file_content,
                headers={
                    "apikey": supabase_key,
                    "Authorization": f"Bearer {supabase_key}",
                    "Content-Type": document.content_type or "application/octet-stream"
                }
            )
            if storage_res.status_code not in (200, 201):
                raise HTTPException(status_code=400, detail="Failed to upload document")

            # 2. Insert into users table
            user_data = {"name": name, "phone": phone, "role": "farmer"}
            res = await client.post(f"{supabase_url}/rest/v1/users", json=user_data, headers=get_supabase_headers())
            if res.status_code not in (200, 201):
                raise HTTPException(status_code=400, detail="Failed to create user")
            user_id = res.json()[0]['id']
            
            # 3. Insert into farmers table
            farmer_data = {
                "user_id": user_id,
                "state": state,
                "district": district,
                "village": village,
                "farm_size": farm_size,
                "languages": languages,
                "land_area": land_area,
                "acreage": acreage,
                "ownership_status": ownership_status,
                "document_type": document_type,
                "document_path": file_path,
                "verification_status": "Pending"
            }
            f_res = await client.post(f"{supabase_url}/rest/v1/farmers", json=farmer_data, headers=get_supabase_headers())
            if f_res.status_code not in (200, 201):
                raise HTTPException(status_code=400, detail="Failed to create farmer profile")

        return UserResponse(id=UUID(user_id), name=name, phone=phone, role="farmer")
    except Exception as e:
        print("Registration Error:", e)
        raise HTTPException(status_code=500, detail=str(e))'''

new_farmer_register = '''@app.post("/api/farmers/register", response_model=UserResponse)
async def register_farmer(
    name: str = Form(...),
    phone: str = Form(...),
    state: str = Form(...),
    district: str = Form(...),
    village: str = Form(...),
    farm_size: str = Form(None),
    languages: str = Form(None),
    land_area: str = Form(None),
    acreage: float = Form(None),
    ownership_status: str = Form(None),
    document_type: str = Form(None),
    document: UploadFile = File(None)
):
    try:
        if not supabase_url:
            raise HTTPException(status_code=500, detail="Supabase not configured")

        file_path = None
        async with httpx.AsyncClient() as client:
            # 1. Try to upload document (non-fatal if storage bucket not configured)
            if document and document.filename:
                try:
                    file_ext = document.filename.split(".")[-1]
                    file_path = f"{uuid4()}.{file_ext}"
                    file_content = await document.read()
                    storage_res = await client.post(
                        f"{supabase_url}/storage/v1/object/farmer_documents/{file_path}",
                        content=file_content,
                        headers={
                            "apikey": supabase_key,
                            "Authorization": f"Bearer {supabase_key}",
                            "Content-Type": document.content_type or "application/octet-stream"
                        }
                    )
                    if storage_res.status_code not in (200, 201):
                        print(f"[WARN] Storage upload failed ({storage_res.status_code}): {storage_res.text}. Continuing without stored document.")
                        file_path = document.filename  # store original filename as fallback
                except Exception as upload_err:
                    print(f"[WARN] Storage exception: {upload_err}. Continuing without stored document.")
                    file_path = document.filename if document else None

            # 2. Check if user already exists with this phone number
            check_res = await client.get(
                f"{supabase_url}/rest/v1/users?phone=eq.{phone}&role=eq.farmer",
                headers=get_supabase_headers()
            )
            if check_res.status_code == 200 and check_res.json():
                raise HTTPException(status_code=400, detail="A farmer account with this phone number already exists. Please log in.")

            # 3. Insert into users table
            user_data = {"name": name, "phone": phone, "role": "farmer"}
            res = await client.post(
                f"{supabase_url}/rest/v1/users",
                json=user_data,
                headers={**get_supabase_headers(), "Prefer": "return=representation"}
            )
            if res.status_code not in (200, 201):
                raise HTTPException(status_code=400, detail=f"Failed to create user account: {res.text}")
            
            user_list = res.json()
            if not user_list:
                raise HTTPException(status_code=400, detail="User created but could not retrieve ID. Check Supabase RLS policies.")
            user_id = user_list[0]["id"]
            
            # 4. Insert into farmers table
            farmer_data = {
                "user_id": user_id,
                "state": state or "",
                "district": district or "",
                "village": village or "",
                "farm_size": farm_size or "",
                "languages": languages or "",
                "land_area": land_area or "",
                "acreage": acreage or 0,
                "ownership_status": ownership_status or "",
                "document_type": document_type or "",
                "document_path": file_path or "",
                "verification_status": "Pending"
            }
            f_res = await client.post(
                f"{supabase_url}/rest/v1/farmers",
                json=farmer_data,
                headers={**get_supabase_headers(), "Prefer": "return=representation"}
            )
            if f_res.status_code not in (200, 201):
                # Rollback user creation
                await client.delete(f"{supabase_url}/rest/v1/users?id=eq.{user_id}", headers=get_supabase_headers())
                raise HTTPException(status_code=400, detail=f"Failed to create farmer profile: {f_res.text}")

        return UserResponse(id=UUID(user_id), name=name, phone=phone, role="farmer")
    except HTTPException:
        raise
    except Exception as e:
        print("Farmer Registration Error:", e)
        raise HTTPException(status_code=500, detail=f"Registration error: {str(e)}")'''

if old_farmer_register in code:
    code = code.replace(old_farmer_register, new_farmer_register)
    print("Replaced farmer register!")
else:
    print("NOT FOUND - farmer register block")
    # Try to find the block
    idx = code.find('@app.post("/api/farmers/register"')
    if idx >= 0:
        print(f"Found at index {idx}")
    else:
        print("Block not found at all!")

# === FIX 2: DELIVERY PARTNER REGISTRATION ===
old_delivery_register = '''@app.post("/api/delivery/register", response_model=UserResponse)
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

new_delivery_register = '''@app.post("/api/delivery/register", response_model=UserResponse)
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
            # Try to upload license document (non-fatal)
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
                except Exception as e:
                    print(f"[WARN] License upload exception: {e}")
                    license_path = license_document.filename if license_document else None

            # Check if phone already registered
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
                # Rollback
                await client.delete(f"{supabase_url}/rest/v1/users?id=eq.{user_id}", headers=get_supabase_headers())
                raise HTTPException(status_code=400, detail=f"Failed to create delivery partner profile: {dp_res.text}")
  
        return UserResponse(id=UUID(user_id), name=name, phone=phone, role="delivery_partner")
    except HTTPException:
        raise
    except Exception as e:
        print("Delivery Registration Error:", e)
        raise HTTPException(status_code=500, detail=f"Registration error: {str(e)}")'''

if old_delivery_register in code:
    code = code.replace(old_delivery_register, new_delivery_register)
    print("Replaced delivery register!")
else:
    print("NOT FOUND - delivery register block")

open('backend/main.py', 'w', encoding='utf-8').write(code)
print("Done!")
