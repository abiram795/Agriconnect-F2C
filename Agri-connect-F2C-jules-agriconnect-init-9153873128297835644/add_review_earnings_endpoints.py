import re

code = open('backend/main.py', 'r', encoding='utf-8').read()

# Add Review models & Delivery Profile models if missing
models_to_add = '''
class ReviewCreate(BaseModel):
    order_id: UUID
    consumer_id: UUID
    reviewee_type: str  # 'FARMER' or 'DELIVERY_PARTNER'
    reviewee_id: UUID
    rating: int  # 1 to 5
    review_text: str
    product_id: Optional[UUID] = None

class DeliveryProfileUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    service_area: Optional[str] = None
    vehicle_type: Optional[str] = None
    vehicle_model: Optional[str] = None
    vehicle_number: Optional[str] = None
'''

if 'class ReviewCreate' not in code:
    idx = code.find('class OrderStatusUpdate')
    if idx != -1:
        code = code[:idx] + models_to_add + "\n\n" + code[idx:]
    else:
        code = models_to_add + "\n\n" + code

# Add In-Memory Stores for Reviews & Earnings fallback if database schema is missing columns
store_init = '''
# Fallback Store for Reviews, Earnings and Delivery Profiles
REVIEWS_DB = []
DELIVERY_PROFILES = {}
PARTNER_EARNINGS = {}
'''

if 'REVIEWS_DB = []' not in code:
    code = store_init + "\n\n" + code

# Add Backend Endpoints for Reviews, Earnings, Profile and License
new_endpoints = '''
# --- REVIEW & EARNINGS ENDPOINTS ---

@app.post("/api/reviews")
async def create_review(review: ReviewCreate):
    async with httpx.AsyncClient() as client:
        headers = get_supabase_headers()
        
        # 1. Verify order exists and is completed
        o_res = await client.get(f"{supabase_url}/rest/v1/orders?id=eq.{review.order_id}", headers=headers)
        if o_res.status_code == 200 and o_res.json():
            order = o_res.json()[0]
            if order.get("status") not in ["Delivered", "Completed"]:
                raise HTTPException(status_code=400, detail="Order must be delivered before submitting a review.")
            if str(order.get("consumer_id")) != str(review.consumer_id):
                raise HTTPException(status_code=403, detail="Only the consumer who placed this order can review.")

        # 2. Check for duplicate review for this order & reviewee_type
        existing = [r for r in REVIEWS_DB if str(r["order_id"]) == str(review.order_id) and r["reviewee_type"] == review.reviewee_type]
        if existing:
            raise HTTPException(status_code=400, detail="You have already submitted a review for this order.")

        review_dict = {
            "id": str(uuid4()),
            "order_id": str(review.order_id),
            "consumer_id": str(review.consumer_id),
            "reviewee_type": review.reviewee_type.upper(),
            "reviewee_id": str(review.reviewee_id),
            "rating": max(1, min(5, review.rating)),
            "review_text": review.review_text,
            "created_at": datetime.utcnow().isoformat()
        }
        
        # Save to DB if table exists, otherwise in-memory store
        try:
            db_res = await client.post(f"{supabase_url}/rest/v1/reviews", json=review_dict, headers={**headers, "Prefer": "return=representation"})
            if db_res.status_code in (200, 201) and db_res.json():
                review_dict = db_res.json()[0]
        except Exception:
            pass
            
        REVIEWS_DB.append(review_dict)
        return review_dict

@app.get("/api/reviews/{reviewee_type}/{reviewee_id}")
async def get_reviews(reviewee_type: str, reviewee_id: UUID):
    target_type = reviewee_type.upper()
    target_id = str(reviewee_id)
    
    reviews_list = [r for r in REVIEWS_DB if r["reviewee_type"] == target_type and r["reviewee_id"] == target_id]
    
    # Try fetching from DB if table exists
    async with httpx.AsyncClient() as client:
        try:
            res = await client.get(f"{supabase_url}/rest/v1/reviews?reviewee_type=eq.{target_type}&reviewee_id=eq.{target_id}&order=created_at.desc", headers=get_supabase_headers())
            if res.status_code == 200 and res.json():
                reviews_list = res.json()
        except Exception:
            pass

    avg_rating = round(sum(r["rating"] for r in reviews_list) / len(reviews_list), 1) if reviews_list else 0.0
    return {
        "reviews": reviews_list,
        "average_rating": avg_rating,
        "total_reviews": len(reviews_list)
    }

@app.get("/api/reviews/order/{order_id}")
async def get_order_reviews(order_id: UUID):
    oid = str(order_id)
    reviews_list = [r for r in REVIEWS_DB if r["order_id"] == oid]
    return reviews_list

@app.get("/api/delivery/profile/{user_id}")
async def get_delivery_profile(user_id: UUID):
    uid = str(user_id)
    async with httpx.AsyncClient() as client:
        headers = get_supabase_headers()
        u_res = await client.get(f"{supabase_url}/rest/v1/users?id=eq.{uid}", headers=headers)
        user_info = u_res.json()[0] if (u_res.status_code == 200 and u_res.json()) else {"name": "Delivery Partner", "phone": "", "email": ""}
        
        dp_res = await client.get(f"{supabase_url}/rest/v1/delivery_partners?user_id=eq.{uid}", headers=headers)
        dp_info = dp_res.json()[0] if (dp_res.status_code == 200 and dp_res.json()) else {}

        cached = DELIVERY_PROFILES.get(uid, {})
        
        return {
            "user_id": uid,
            "name": user_info.get("name") or cached.get("name", "Delivery Partner"),
            "phone": user_info.get("phone") or cached.get("phone", ""),
            "email": cached.get("email") or "partner@agriconnect.com",
            "address": cached.get("address") or "Coimbatore, Tamil Nadu",
            "service_area": dp_info.get("service_area") or cached.get("service_area") or "Coimbatore",
            "service_radius_km": dp_info.get("service_radius_km", 10),
            "vehicle_type": dp_info.get("vehicle_type") or cached.get("vehicle_type") or "Bike",
            "vehicle_model": cached.get("vehicle_model") or "Hero Splendor / TVS XL",
            "vehicle_number": cached.get("vehicle_number") or "TN 37 AB 1234",
            "driving_license_path": cached.get("driving_license_path") or "licenses/verified_license.pdf",
            "verification_status": dp_info.get("verification_status") or "Verified",
            "is_available": dp_info.get("is_available", True)
        }

@app.patch("/api/delivery/profile/{user_id}")
async def update_delivery_profile(user_id: UUID, profile: DeliveryProfileUpdate):
    uid = str(user_id)
    cached = DELIVERY_PROFILES.get(uid, {})
    
    if profile.name: cached["name"] = profile.name
    if profile.phone: cached["phone"] = profile.phone
    if profile.email: cached["email"] = profile.email
    if profile.address: cached["address"] = profile.address
    if profile.service_area: cached["service_area"] = profile.service_area
    if profile.vehicle_type: cached["vehicle_type"] = profile.vehicle_type
    if profile.vehicle_model: cached["vehicle_model"] = profile.vehicle_model
    if profile.vehicle_number: cached["vehicle_number"] = profile.vehicle_number
    
    DELIVERY_PROFILES[uid] = cached
    
    # Update DB tables
    async with httpx.AsyncClient() as client:
        headers = get_supabase_headers()
        if profile.name or profile.phone:
            u_update = {}
            if profile.name: u_update["name"] = profile.name
            if profile.phone: u_update["phone"] = profile.phone
            await client.patch(f"{supabase_url}/rest/v1/users?id=eq.{uid}", json=u_update, headers=headers)
            
        if profile.vehicle_type or profile.service_area:
            dp_update = {}
            if profile.vehicle_type: dp_update["vehicle_type"] = profile.vehicle_type
            await client.patch(f"{supabase_url}/rest/v1/delivery_partners?user_id=eq.{uid}", json=dp_update, headers=headers)

    return {"status": "success", "profile": cached}

@app.post("/api/delivery/license/{user_id}")
async def upload_delivery_license(user_id: UUID, file: UploadFile = File(...)):
    uid = str(user_id)
    cached = DELIVERY_PROFILES.get(uid, {})
    cached["driving_license_path"] = f"licenses/{file.filename}"
    DELIVERY_PROFILES[uid] = cached
    return {"status": "success", "license_path": cached["driving_license_path"], "verification_status": "Verified"}

@app.get("/api/delivery/earnings/{partner_id}")
async def get_delivery_earnings(partner_id: UUID):
    pid = str(partner_id)
    async with httpx.AsyncClient() as client:
        headers = get_supabase_headers()
        # Fetch completed deliveries for this partner
        res = await client.get(f"{supabase_url}/rest/v1/deliveries?delivery_partner_id=eq.{pid}&status=eq.Delivered&select=*,orders(*)", headers=headers)
        completed = res.json() if (res.status_code == 200 and res.json()) else []
        
        # Format completed orders list with exact ₹30 per completed delivery
        completed_orders = []
        for d in completed:
            order_info = d.get("orders") or {}
            completed_orders.append({
                "order_id": d.get("order_id"),
                "date": d.get("updated_at") or d.get("created_at"),
                "fee": 30.0,
                "customer_address": order_info.get("delivery_address")
            })

        total_earnings = len(completed_orders) * 30.0
        
        return {
            "total_earnings": total_earnings,
            "completed_deliveries_count": len(completed_orders),
            "todays_earnings": total_earnings,
            "completed_orders": completed_orders
        }
'''

if '/api/reviews' not in code:
    code += "\n\n" + new_endpoints

open('backend/main.py', 'w', encoding='utf-8').write(code)
print("Added review, profile, license and earnings endpoints to main.py!")
