import re

with open("main.py", "r") as f:
    code = f.read()

new_get_user = """@app.get("/api/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: UUID):
    if not supabase_url:
        if user_id not in users_db:
            raise HTTPException(status_code=404, detail="User not found")
        return users_db[user_id]
        
    async with httpx.AsyncClient() as client:
        res = await client.get(
            f"{supabase_url}/rest/v1/users?id=eq.{user_id}",
            headers=get_supabase_headers()
        )
        if res.status_code != 200 or not res.json():
            raise HTTPException(status_code=404, detail="User not found")
        return res.json()[0]"""

code = re.sub(
    r'@app\.get\("/api/users/\{user_id\}", response_model=UserResponse\)\ndef get_user\(user_id: UUID\):\n    if user_id not in users_db:\n        raise HTTPException\(status_code=404, detail="User not found"\)\n    return users_db\[user_id\]',
    new_get_user,
    code,
    flags=re.MULTILINE
)

with open("main.py", "w") as f:
    f.write(code)
