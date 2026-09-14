path = r'c:\Users\abira\Downloads\Agri-connect-F2C-jules-agriconnect-init-9153873128297835644\Agri-connect-F2C-jules-agriconnect-init-9153873128297835644\backend\main.py'

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

old_get_otp = '''@app.get("/api/orders/{order_id}/delivery-otp")
async def get_delivery_otp(order_id: UUID):
    async with httpx.AsyncClient() as client:
        headers = get_supabase_headers()
        res = await client.get(f"{supabase_url}/rest/v1/orders?id=eq.{order_id}", headers=headers)
        if res.status_code != 200 or not res.json():
            raise HTTPException(status_code=404, detail="Order not found")
            
        order = res.json()[0]
        otp_hash = order.get("delivery_otp_hash")
        
        if not otp_hash:
            raise HTTPException(status_code=400, detail="OTP not generated yet.")
            
        # Recover OTP by brute-forcing the 10,000 possibilities
        for i in range(10000):
            raw_otp = f"{i:04d}"
            test_hash = hashlib.sha256(f"{order_id}:{raw_otp}".encode()).hexdigest()
            if test_hash == otp_hash:
                return {"otp": raw_otp}
                
        raise HTTPException(status_code=500, detail="Could not recover OTP.")'''

new_get_otp = '''@app.get("/api/orders/{order_id}/delivery-otp")
async def get_delivery_otp(order_id: UUID):
    async with httpx.AsyncClient() as client:
        headers = get_supabase_headers()
        res = await client.get(f"{supabase_url}/rest/v1/orders?id=eq.{order_id}", headers=headers)
        if res.status_code != 200 or not res.json():
            raise HTTPException(status_code=404, detail="Order not found")
            
        order = res.json()[0]
        otp_hash = order.get("delivery_otp_hash")
        
        if not otp_hash:
            raw_otp = str(random.randint(1000, 9999))
            otp_hash = hashlib.sha256(f"{order_id}:{raw_otp}".encode()).hexdigest()
            await client.patch(
                f"{supabase_url}/rest/v1/orders?id=eq.{order_id}",
                json={
                    "delivery_otp_hash": otp_hash,
                    "delivery_otp_expires_at": (datetime.utcnow() + timedelta(days=1)).isoformat(),
                    "delivery_otp_attempts": 0
                },
                headers=headers
            )
            return {"otp": raw_otp}
            
        # Recover OTP by checking 10,000 possibilities
        for i in range(10000):
            raw_otp = f"{i:04d}"
            test_hash = hashlib.sha256(f"{order_id}:{raw_otp}".encode()).hexdigest()
            if test_hash == otp_hash:
                return {"otp": raw_otp}
                
        raise HTTPException(status_code=500, detail="Could not recover OTP.")'''

if old_get_otp in content:
    content = content.replace(old_get_otp, new_get_otp)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Updated get_delivery_otp successfully!")
else:
    print("Could not find exact old_get_otp block in main.py")
