path = r'c:\Users\abira\Downloads\Agri-connect-F2C-jules-agriconnect-init-9153873128297835644\Agri-connect-F2C-jules-agriconnect-init-9153873128297835644\backend\main.py'

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Make sure review order endpoint comes before generic reviewee endpoint
if content.find('@app.get("/api/reviews/order/{order_id}")') > content.find('@app.get("/api/reviews/{reviewee_type}/{reviewee_id}")'):
    rev_order_block = '''@app.get("/api/reviews/order/{order_id}")
async def get_order_reviews(order_id: UUID):
    oid = str(order_id)
    reviews_list = [r for r in REVIEWS_DB if r["order_id"] == oid]
    return reviews_list

'''
    content = content.replace(rev_order_block, '')
    content = content.replace(
        '@app.post("/api/reviews")',
        rev_order_block + '@app.post("/api/reviews")'
    )

# Make sure available-deliveries comes before generic /api/orders/{order_id}
avail_deliv_block = '''@app.get("/api/orders/available-deliveries")
async def get_available_deliveries():
    async with httpx.AsyncClient() as client:
        res = await client.get(
            f"{supabase_url}/rest/v1/deliveries?status=in.(Pending%20Assignment,Delivery%20Requested)&select=*,orders(*,consumers(*,users(*))),orders(*,order_items(*,products(*,farmers(*,users(*)))))",
            headers=get_supabase_headers()
        )
        if res.status_code != 200:
            return []
        return res.json()

'''

if content.find('@app.get("/api/orders/available-deliveries")') > content.find('@app.get("/api/orders/{order_id}"'):
    content = content.replace(avail_deliv_block, '')
    content = content.replace(
        '@app.get("/api/orders/{order_id}"',
        avail_deliv_block + '@app.get("/api/orders/{order_id}"'
    )

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Reordered main.py routes successfully!")
