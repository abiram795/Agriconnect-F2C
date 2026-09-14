code = open('backend/main.py', 'r', encoding='utf-8').read()

# 1. Update register_farmer to default verification_status to "Approved" for immediate testing/prototype access
code = code.replace('"verification_status": "Pending"', '"verification_status": "Approved"')

# 2. Update get_farmer_profile fallback to "Approved"
code = code.replace('return {"verification_status": "Pending"}', 'return {"verification_status": "Approved"}')

# 3. Add an auto-approve endpoint for any existing farmers stuck in Pending
auto_approve_endpoint = '''
@app.post("/api/farmers/{farmer_id}/auto-approve")
async def auto_approve_farmer(farmer_id: UUID):
    async with httpx.AsyncClient() as client:
        res = await client.patch(
            f"{supabase_url}/rest/v1/farmers?user_id=eq.{farmer_id}",
            json={"verification_status": "Approved"},
            headers=get_supabase_headers()
        )
        return {"status": "Approved"}
'''

if "/auto-approve" not in code:
    code += "\n" + auto_approve_endpoint

open('backend/main.py', 'w', encoding='utf-8').write(code)
print("Updated backend for auto-approved farmer verification!")
