path = r'c:\Users\abira\Downloads\Agri-connect-F2C-jules-agriconnect-init-9153873128297835644\Agri-connect-F2C-jules-agriconnect-init-9153873128297835644\backend\main.py'

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add NOTIFICATIONS_DB to top fallback declarations
content = content.replace(
    'REVIEWS_DB = []\nDELIVERIES_DB = {}\nEARNINGS_DB = {}',
    'REVIEWS_DB = []\nDELIVERIES_DB = {}\nEARNINGS_DB = {}\nNOTIFICATIONS_DB = []'
)

# Update get_notifications
get_notif_code = '''@app.get("/api/notifications/{user_id}")
async def get_notifications(user_id: UUID):
    uid = str(user_id)
    notifs = [n for n in NOTIFICATIONS_DB if n.get("user_id") == uid]
    async with httpx.AsyncClient() as client:
        try:
            res = await client.get(
                f"{supabase_url}/rest/v1/notifications?user_id=eq.{uid}&order=created_at.desc",
                headers=get_supabase_headers()
            )
            if res.status_code == 200 and res.json():
                for item in res.json():
                    if not any(n.get("id") == item.get("id") for n in notifs):
                        notifs.append(item)
        except Exception:
            pass
    return notifs
'''

content = content.replace(
    '@app.get("/api/notifications/{user_id}")\nasync def get_notifications(user_id: UUID):\n    async with httpx.AsyncClient() as client:\n        res = await client.get(\n            f"{supabase_url}/rest/v1/notifications?user_id=eq.{user_id}&order=created_at.desc",\n            headers=get_supabase_headers()\n        )\n        return res.json() if res.status_code == 200 else []',
    get_notif_code
)

# Update verify_delivery_otp to include customer_address in EARNINGS_DB and push to NOTIFICATIONS_DB
verify_address_update = '''        if dp_id:
            pid = str(dp_id)
            if pid not in EARNINGS_DB: EARNINGS_DB[pid] = []
            if not any(x.get("order_id") == oid for x in EARNINGS_DB[pid]):
                EARNINGS_DB[pid].append({
                    "order_id": oid,
                    "fee": 30.0,
                    "date": datetime.utcnow().isoformat(),
                    "customer_address": order.get("delivery_address")
                })

        # Push to NOTIFICATIONS_DB
        if consumer_id:
            NOTIFICATIONS_DB.append({
                "id": str(uuid4()),
                "user_id": str(consumer_id),
                "role": "consumer",
                "order_id": oid,
                "title": "Delivery Verified",
                "message": "Your order has been delivered successfully.",
                "is_read": False,
                "created_at": datetime.utcnow().isoformat()
            })'''

content = content.replace(
    '''        if dp_id:
            pid = str(dp_id)
            if pid not in EARNINGS_DB: EARNINGS_DB[pid] = []
            if not any(x.get("order_id") == oid for x in EARNINGS_DB[pid]):
                EARNINGS_DB[pid].append({"order_id": oid, "fee": 30.0, "date": datetime.utcnow().isoformat()})''',
    verify_address_update
)

# In farmer-status endpoint when transitioning to Out for Delivery, push notification to NOTIFICATIONS_DB
notif_out_for_delivery = '''            title_msg = "Your order is out for delivery" if status_update.status == "Out for Delivery" else "Order Status Updated"
            NOTIFICATIONS_DB.append({
                "id": str(uuid4()),
                "user_id": str(consumer_id),
                "role": "consumer",
                "order_id": str(order_id),
                "title": title_msg,
                "message": message,
                "is_read": False,
                "created_at": datetime.utcnow().isoformat()
            })'''

content = content.replace(
    'title_msg = "Your order is out for delivery" if status_update.status == "Out for Delivery" else "Order Status Updated"',
    notif_out_for_delivery
)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated main.py notifications and address fallback successfully!")
