from pydantic import BaseModel
class LoginRequest(BaseModel):
    phone: str
    password: str
    role: str

@app.post("/api/login")
async def login_user(login_data: LoginRequest):
    async with httpx.AsyncClient() as client:
        res = await client.get(
            f"{supabase_url}/rest/v1/users?phone=eq.{login_data.phone}&role=eq.{login_data.role}",
            headers=get_supabase_headers()
        )
        if res.status_code != 200 or not res.json():
            raise HTTPException(status_code=401, detail="Invalid phone number or role")
        
        user = res.json()[0]
        return user
