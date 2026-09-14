import re

code = open('backend/main.py', 'r', encoding='utf-8').read()

# Replace register_farmer with robust handling of existing users
old_farmer = '''@app.post("/api/farmers/register", response_model=UserResponse)
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

new_farmer = '''@app.post("/api/farmers/register", response_model=UserResponse)
async def register_farmer(
    name: str = Form(...),
    phone: str = Form(...),
    state: str = Form(...),
    district: str = Form(...),
    village: str = Form(...),
    farm_size: str = Form(None),
    languages: str = Form(None),
    land_area: str = Form(None),
    acreage: str = Form(None),
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
                        print(f"[WARN] Storage upload failed ({storage_res.status_code}): {storage_res.text}.")
                        file_path = document.filename
                except Exception as upload_err:
                    print(f"[WARN] Storage exception: {upload_err}.")
                    file_path = document.filename if document else None

            # 2. Check if user already exists in users table
            user_id = None
            user_check = await client.get(
                f"{supabase_url}/rest/v1/users?phone=eq.{phone}",
                headers=get_supabase_headers()
            )
            if user_check.status_code == 200 and user_check.json():
                existing_users = user_check.json()
                user_id = existing_users[0]["id"]
                # Check if farmer profile already exists for this user
                f_check = await client.get(
                    f"{supabase_url}/rest/v1/farmers?user_id=eq.{user_id}",
                    headers=get_supabase_headers()
                )
                if f_check.status_code == 200 and f_check.json():
                    raise HTTPException(status_code=400, detail="A farmer account with this phone number already exists. Please log in.")
            else:
                # 3. Create user in users table
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
                    raise HTTPException(status_code=400, detail="User created but could not retrieve ID.")
                user_id = user_list[0]["id"]
            
            # 4. Safely parse acreage float
            parsed_acreage = 0.0
            if acreage:
                try:
                    parsed_acreage = float(acreage)
                except ValueError:
                    parsed_acreage = 0.0

            # 5. Insert into farmers table
            farmer_data = {
                "user_id": user_id,
                "state": state or "",
                "district": district or "",
                "village": village or "",
                "farm_size": farm_size or "",
                "languages": languages or "",
                "land_area": land_area or "",
                "acreage": parsed_acreage,
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
                raise HTTPException(status_code=400, detail=f"Failed to create farmer profile: {f_res.text}")

        return UserResponse(id=UUID(user_id), name=name, phone=phone, role="farmer")
    except HTTPException:
        raise
    except Exception as e:
        print("Farmer Registration Error:", e)
        raise HTTPException(status_code=500, detail=f"Registration error: {str(e)}")'''

if old_farmer in code:
    code = code.replace(old_farmer, new_farmer)
    print("Replaced register_farmer in backend!")
else:
    print("WARNING: Old farmer register block not matched exactly, replacing via regex...")
    idx = code.find('@app.post("/api/farmers/register"')
    end_idx = code.find('@app.post("/api/delivery/register"')
    code = code[:idx] + new_farmer + "\n\n" + code[end_idx:]
    print("Replaced via index search!")

open('backend/main.py', 'w', encoding='utf-8').write(code)
print("Updated main.py!")
