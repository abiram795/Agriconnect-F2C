import re

with open("backend/main.py", "r", encoding="utf-8") as f:
    code = f.read()

new_endpoint = """@app.get("/api/orders/{order_id}/delivery-otp")
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
                
        raise HTTPException(status_code=500, detail="Could not recover OTP.")

@app.post("/api/orders/{order_id}/generate-otp")"""

code = code.replace('@app.post("/api/orders/{order_id}/generate-otp")', new_endpoint)

with open("backend/main.py", "w", encoding="utf-8") as f:
    f.write(code)
