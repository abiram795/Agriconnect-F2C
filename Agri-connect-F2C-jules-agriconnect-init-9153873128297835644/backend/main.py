
# Fallback Store for Reviews, Earnings and Delivery Profiles
REVIEWS_DB = []
DELIVERIES_DB = {}
EARNINGS_DB = {}
NOTIFICATIONS_DB = []
DELIVERY_PROFILES = {}
PARTNER_EARNINGS = {}
BULK_REQUESTS_DB = {}


from fastapi import FastAPI, HTTPException, Depends, Header
from typing import List, Dict, Optional, Any
from uuid import UUID, uuid4
from models import UserCreate, UserResponse, ProductCreate, ProductResponse, OrderCreate, OrderResponse, BulkOrderRequestCreate, BulkOrderRequestResponse, VerificationAction, AddressCreate, AddressResponse
from pydantic import BaseModel
from ai_service import SearchRequest, SearchResponse, PriceRecommendationResponse, mock_natural_language_search, mock_price_recommendation, mock_image_analysis, ImageAnalysisResponse, ImageAnalysisRequest, analyze_product_image_real
from ivr_service import IVRWebhookRequest, IVRResponse, handle_incoming_call, handle_digit_input

import os
import httpx
from dotenv import load_dotenv
from datetime import datetime



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


class OrderStatusUpdate(BaseModel):
    status: str

class FarmerOrderStatusUpdate(BaseModel):
    status: str

class NotificationReadRequest(BaseModel):
    notification_ids: List[UUID]

class OTPVerifyRequest(BaseModel):
    otp: str
    farmer_id: UUID

class AssignDeliveryRequest(BaseModel):
    delivery_partner_id: str


from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="AgriConnect F2C API")

load_dotenv()
supabase_url = os.environ.get("SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

raw_origins = os.environ.get("ALLOWED_ORIGINS", "")
default_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://agri-connect-f2c.web.app",
    "https://agri-connect-f2c.firebaseapp.com"
]

if raw_origins.strip() == "*":
    origins = ["*"]
    allow_cred = False
else:
    extra = [o.strip() for o in raw_origins.split(",") if o.strip()]
    origins = list(set(default_origins + extra))
    allow_cred = True

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*\.web\.app|https://.*\.firebaseapp\.com",
    allow_credentials=allow_cred,
    allow_methods=["*"],
    allow_headers=["*"],
)

if not supabase_url or not supabase_key:
    print("Warning: Supabase credentials not found. DB operations may fail.")

def get_supabase_headers():
    return {
        "apikey": supabase_key,
        "Authorization": f"Bearer {supabase_key}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }

async def get_current_user(authorization: str = Header(...)):
    if not supabase_url:
        return {"id": "mock-user-id", "role": "admin"} # Fallback
    
    token = authorization.replace("Bearer ", "")
    async with httpx.AsyncClient() as client:
        # Get user from Supabase Auth
        auth_res = await client.get(
            f"{supabase_url}/auth/v1/user",
            headers={"apikey": supabase_key, "Authorization": f"Bearer {token}"}
        )
        if auth_res.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid token")
            
        auth_user = auth_res.json()
        auth_id = auth_user.get("id")
        
        # Get user role from our users table
        db_res = await client.get(
            f"{supabase_url}/rest/v1/users?auth_id=eq.{auth_id}",
            headers=get_supabase_headers()
        )
        db_users = db_res.json()
        if not db_users:
            raise HTTPException(status_code=401, detail="User profile not found")
            
        return db_users[0]

async def require_admin(user: dict = Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized as admin")
    return user

# Mock database (kept for other endpoints temporarily)
users_db: Dict[UUID, UserResponse] = {}
products_db: Dict[UUID, ProductResponse] = {}

@app.get("/")
def read_root():
    return {"message": "Welcome to AgriConnect F2C API"}

# Users API
@app.post("/api/users", response_model=UserResponse)
async def create_user(user: UserCreate):
    try:
        if not supabase_url:
            # Fallback to mock if no supabase config
            user_id = uuid4()
            new_user = UserResponse(id=user_id, name=user.name, phone=user.phone, role=user.role)
            users_db[user_id] = new_user
            return new_user

        # Insert into Supabase users table via REST
        user_data = {"name": user.name, "phone": user.phone, "role": user.role}
        async with httpx.AsyncClient() as client:
            res = await client.post(f"{supabase_url}/rest/v1/users", json=user_data, headers=get_supabase_headers())
            
            if res.status_code not in (200, 201):
                raise HTTPException(status_code=400, detail=f"Failed to create user: {res.text}")
                
            res_data = res.json()
            if not res_data:
                raise HTTPException(status_code=400, detail="Failed to create user")
                
            user_id = res_data[0]['id']
            
            # If farmer, insert profile
            if user.role == 'farmer':
                farmer_data = {
                    "user_id": user_id,
                    "state": user.state,
                    "district": user.district,
                    "village": user.village,
                    "farm_size": user.farm_size,
                    "languages": user.languages,
                    "land_area": user.land_area,
                    "acreage": user.acreage,
                    "ownership_status": user.ownership_status,
                    "document_type": user.document_type,
                    "document_path": user.document_path,
                    "verification_status": "Pending"
                }
                f_res = await client.post(f"{supabase_url}/rest/v1/farmers", json=farmer_data, headers=get_supabase_headers())
                if f_res.status_code not in (200, 201):
                    print("Failed to save farmer profile:", f_res.text)
                
            return UserResponse(id=UUID(user_id), name=user.name, phone=user.phone, role=user.role)
    except Exception as e:
        print("Database Error:", e)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/users/{user_id}", response_model=UserResponse)
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
        return res.json()[0]

@app.get("/api/farmers/{user_id}")
async def get_farmer_profile(user_id: UUID):
    if not supabase_url:
        return {"verification_status": "Approved", "users": {"name": "Farmer", "phone": ""}}
    async with httpx.AsyncClient() as client:
        headers = get_supabase_headers()
        # 1. Try join query
        res = await client.get(
            f"{supabase_url}/rest/v1/farmers?user_id=eq.{user_id}&select=*,users!farmers_user_id_fkey(name,phone)",
            headers=headers
        )
        if res.status_code == 200 and res.json():
            return res.json()[0]
        
        # 2. Try simple farmers query without join
        f_res = await client.get(
            f"{supabase_url}/rest/v1/farmers?user_id=eq.{user_id}",
            headers=headers
        )
        # 3. Query users table
        u_res = await client.get(
            f"{supabase_url}/rest/v1/users?id=eq.{user_id}",
            headers=headers
        )
        
        user_info = u_res.json()[0] if (u_res.status_code == 200 and u_res.json()) else {"name": "Farmer", "phone": ""}
        
        if f_res.status_code == 200 and f_res.json():
            farmer_profile = f_res.json()[0]
            farmer_profile["users"] = {"name": user_info.get("name", "Farmer"), "phone": user_info.get("phone", "")}
            return farmer_profile
            
        # Fallback profile if farmer row doesn't exist yet
        return {
            "user_id": str(user_id),
            "state": "Tamil Nadu",
            "district": "Coimbatore",
            "village": "Coimbatore",
            "farm_size": "Small",
            "languages": "Tamil",
            "verification_status": "Pending",
            "land_area": "Survey No. 123",
            "acreage": 2.0,
            "ownership_status": "Owned",
            "users": {
                "name": user_info.get("name", "Farmer"),
                "phone": user_info.get("phone", "")
            }
        }

from fastapi import UploadFile, File, Form

async def create_supabase_auth_user(client: httpx.AsyncClient, phone: str, password: str, name: str, role: str, email: Optional[str] = None):
    if not password or len(password.strip()) == 0:
        raise HTTPException(status_code=400, detail="Please enter a password.")
    if len(password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters long.")
        
    clean_phone = "".join(filter(str.isdigit, str(phone)))
    auth_email = email.strip() if (email and "@" in email) else f"phone_{clean_phone}@agriconnect.internal"
    
    payload = {
        "email": auth_email,
        "password": password,
        "email_confirm": True,
        "phone_confirm": True,
        "user_metadata": {"name": name, "role": role}
    }
    if clean_phone:
        payload["phone"] = f"+91{clean_phone}" if len(clean_phone) == 10 else f"+{clean_phone}"

    auth_headers = {
        "apikey": supabase_key,
        "Authorization": f"Bearer {supabase_key}",
        "Content-Type": "application/json"
    }
    
    res = await client.post(f"{supabase_url}/auth/v1/admin/users", json=payload, headers=auth_headers)
    if res.status_code in (200, 201):
        auth_user = res.json()
        return auth_user.get("id"), auth_email
    elif res.status_code in (400, 422) and ("already" in res.text.lower() or "exists" in res.text.lower() or "registered" in res.text.lower()):
        raise HTTPException(status_code=400, detail="An account with these credentials already exists. Please log in instead.")
    else:
        detail_text = res.text
        try:
            err_j = res.json()
            detail_text = err_j.get("msg") or err_j.get("message") or err_j.get("error_description") or detail_text
        except Exception:
            pass
        raise HTTPException(status_code=400, detail=f"Authentication signup failed: {detail_text}")

async def verify_supabase_auth_password(client: httpx.AsyncClient, phone: str, password: str, email: Optional[str] = None) -> bool:
    if not password:
        return False
    clean_phone = "".join(filter(str.isdigit, str(phone)))
    auth_headers = {
        "apikey": supabase_key,
        "Content-Type": "application/json"
    }
    
    emails_to_try = []
    if email and "@" in email:
        emails_to_try.append(email.strip())
    if clean_phone:
        emails_to_try.append(f"phone_{clean_phone}@agriconnect.internal")
        
    for auth_email in emails_to_try:
        token_res = await client.post(
            f"{supabase_url}/auth/v1/token?grant_type=password",
            json={"email": auth_email, "password": password},
            headers=auth_headers
        )
        if token_res.status_code == 200:
            return True
    return False

@app.post("/api/farmers/register", response_model=UserResponse)
async def register_farmer(
    name: str = Form(...),
    phone: str = Form(...),
    password: str = Form(...),
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

        if not password or len(password.strip()) == 0:
            raise HTTPException(status_code=400, detail="Please enter a password.")

        file_path = None
        async with httpx.AsyncClient() as client:
            # 1. Check if user already exists
            user_check = await client.get(
                f"{supabase_url}/rest/v1/users?phone=eq.{phone}",
                headers=get_supabase_headers()
            )
            if user_check.status_code == 200 and user_check.json():
                existing_users = user_check.json()
                user_id = existing_users[0]["id"]
                f_check = await client.get(
                    f"{supabase_url}/rest/v1/farmers?user_id=eq.{user_id}",
                    headers=get_supabase_headers()
                )
                if f_check.status_code == 200 and f_check.json():
                    raise HTTPException(status_code=400, detail="An account with these credentials already exists. Please log in instead.")

            # 2. Create user in Supabase Auth with password
            auth_id, auth_email = await create_supabase_auth_user(client, phone, password, name, "farmer")

            # 3. Create or link user in users table
            user_id = None
            if user_check.status_code == 200 and user_check.json():
                user_id = user_check.json()[0]["id"]
                await client.patch(
                    f"{supabase_url}/rest/v1/users?id=eq.{user_id}",
                    json={"auth_id": auth_id},
                    headers=get_supabase_headers()
                )
            else:
                user_data = {"id": auth_id, "auth_id": auth_id, "name": name, "phone": phone, "role": "farmer"}
                res = await client.post(
                    f"{supabase_url}/rest/v1/users",
                    json=user_data,
                    headers={**get_supabase_headers(), "Prefer": "return=representation"}
                )
                if res.status_code not in (200, 201):
                    raise HTTPException(status_code=400, detail=f"Failed to create user account: {res.text}")
                user_id = res.json()[0]["id"]

            # 4. Try to upload document
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
                        file_path = document.filename
                except Exception:
                    file_path = document.filename if document else None

            # 5. Insert into farmers table
            parsed_acreage = 0.0
            if acreage:
                try:
                    parsed_acreage = float(acreage)
                except ValueError:
                    parsed_acreage = 0.0

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
        raise HTTPException(status_code=500, detail=f"Registration error: {str(e)}")

@app.get("/api/users", response_model=List[UserResponse])
def list_users():
    return list(users_db.values())

# Admin Verification API
@app.get("/api/admin/farmers")
async def get_farmers_for_verification(admin_user: dict = Depends(require_admin)):
    async with httpx.AsyncClient() as client:
        res = await client.get(
            f"{supabase_url}/rest/v1/farmers?select=*,users!farmers_user_id_fkey(name,phone)&order=created_at.desc.nullslast",
            headers=get_supabase_headers()
        )
        if res.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to fetch farmers")
        return res.json()

@app.get("/api/admin/farmers/{farmer_id}/document")
async def get_farmer_document_url(farmer_id: UUID, admin_user: dict = Depends(require_admin)):
    async with httpx.AsyncClient() as client:
        f_res = await client.get(
            f"{supabase_url}/rest/v1/farmers?user_id=eq.{farmer_id}&select=document_path",
            headers=get_supabase_headers()
        )
        if f_res.status_code != 200 or not f_res.json():
            raise HTTPException(status_code=404, detail="Farmer not found")
            
        doc_path = f_res.json()[0].get("document_path")
        if not doc_path:
            raise HTTPException(status_code=404, detail="No document found")
            
        # Create signed url
        sign_res = await client.post(
            f"{supabase_url}/storage/v1/object/sign/farmer_documents/{doc_path}",
            json={"expiresIn": 60 * 60},
            headers=get_supabase_headers()
        )
        if sign_res.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to generate secure URL")
            
        return {"signed_url": f"{supabase_url}/storage/v1{sign_res.json()['signedURL']}"}

@app.post("/api/admin/farmers/{farmer_id}/verify")
async def verify_farmer(farmer_id: UUID, action_data: VerificationAction, admin_user: dict = Depends(require_admin)):
    async with httpx.AsyncClient() as client:
        # Get current status
        f_res = await client.get(
            f"{supabase_url}/rest/v1/farmers?user_id=eq.{farmer_id}",
            headers=get_supabase_headers()
        )
        if f_res.status_code != 200 or not f_res.json():
            raise HTTPException(status_code=404, detail="Farmer not found")
            
        current_status = f_res.json()[0].get("verification_status", "Pending")
        
        # Map action to status
        new_status = current_status
        if action_data.action == "Approve":
            new_status = "Approved"
        elif action_data.action == "Reject":
            new_status = "Rejected"
        elif action_data.action == "Request Correction":
            new_status = "Correction Required"
        else:
            raise HTTPException(status_code=400, detail="Invalid action")
            
        # Update farmer
        update_data = {
            "verification_status": new_status,
            "admin_remarks": action_data.remarks,
            "verified_by": admin_user["id"],
            "verification_date": datetime.utcnow().isoformat()
        }
        u_res = await client.patch(
            f"{supabase_url}/rest/v1/farmers?user_id=eq.{farmer_id}",
            json=update_data,
            headers=get_supabase_headers()
        )
        if u_res.status_code not in (200, 204):
            raise HTTPException(status_code=400, detail="Failed to update farmer status")
            
        # Insert verification log
        log_data = {
            "farmer_id": str(farmer_id),
            "admin_id": admin_user["id"],
            "previous_status": current_status,
            "new_status": new_status,
            "action": action_data.action,
            "remarks": action_data.remarks
        }
        try:
            await client.post(
                f"{supabase_url}/rest/v1/verification_logs",
                json=log_data,
                headers=get_supabase_headers()
            )
        except Exception:
            pass

        # Send notification to farmer
        notif_msg = f"Your farmer verification status is now '{new_status}'."
        if action_data.remarks:
            notif_msg += f" Admin Remarks: {action_data.remarks}"
        try:
            await client.post(
                f"{supabase_url}/rest/v1/notifications",
                json={
                    "user_id": str(farmer_id),
                    "role": "farmer",
                    "title": f"Verification Update: {new_status}",
                    "message": notif_msg,
                    "is_read": False
                },
                headers=get_supabase_headers()
            )
        except Exception:
            pass
        
        return {"status": "success", "new_status": new_status}

async def require_verified_farmer(x_user_id: str = Header(None)):
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Missing user ID header")
    if not supabase_url:
        return {"id": x_user_id, "role": "farmer"}

    async with httpx.AsyncClient() as client:
        res = await client.get(
            f"{supabase_url}/rest/v1/farmers?user_id=eq.{x_user_id}",
            headers=get_supabase_headers()
        )
        if res.status_code == 200 and res.json():
            farmer_profile = res.json()[0]
            status = farmer_profile.get("verification_status", "Pending")
            if status != "Approved":
                raise HTTPException(
                    status_code=403,
                    detail=f"Your farmer account verification status is '{status}'. Product listing is unavailable until approved by an admin."
                )
            return {"id": x_user_id, "role": "farmer", "profile": farmer_profile}
        else:
            raise HTTPException(
                status_code=403,
                detail="Farmer profile not found. Please complete registration and await admin verification."
            )

@app.post("/api/products/analyze-image", response_model=ImageAnalysisResponse)
async def analyze_product_image_endpoint(req: ImageAnalysisRequest):
    if not req.image_base64 or len(req.image_base64.strip()) == 0:
        raise HTTPException(status_code=400, detail="Please capture/select a product image first.")
    
    analysis_result = analyze_product_image_real(req.image_base64, req.selected_product_name)
    return analysis_result

# Products API
@app.post("/api/products", response_model=ProductResponse)
async def create_product(product: ProductCreate, farmer: dict = Depends(require_verified_farmer)):
    product_data = product.model_dump()
    # Remove category if present since products table uses category_id or has no category column
    product_data.pop('category', None)
    if not product_data.get('category_id'):
        product_data.pop('category_id', None)

    # 0. Server-side AI Image Validation: Validate image contents before product creation
    img_url = product_data.get("image_url") or ""
    if img_url and len(img_url) > 50:
        analysis = analyze_product_image_real(img_url, product_data["name"])
        if not analysis.success or not analysis.matches_selected_product or not analysis.is_agricultural_product:
            raise HTTPException(status_code=400, detail=f"Image Verification Failed: {analysis.message}")

    # Convert UUIDs to strings
    product_data['farmer_id'] = str(product_data['farmer_id'])
    farmer_user_id = product_data['farmer_id']
    
    async with httpx.AsyncClient() as client:
        # 1. Ensure user record exists in users table
        u_check = await client.get(
            f"{supabase_url}/rest/v1/users?id=eq.{farmer_user_id}",
            headers=get_supabase_headers()
        )
        if u_check.status_code == 200 and not u_check.json():
            # Auto-provision minimal user record
            random_phone = f"9{str(uuid4().int)[:9]}"
            await client.post(
                f"{supabase_url}/rest/v1/users",
                json={
                    "id": farmer_user_id,
                    "name": "Farmer",
                    "phone": random_phone,
                    "role": "farmer"
                },
                headers=get_supabase_headers()
            )

        # 2. Ensure farmer record exists in farmers table to satisfy FK constraint
        f_check = await client.get(
            f"{supabase_url}/rest/v1/farmers?user_id=eq.{farmer_user_id}",
            headers=get_supabase_headers()
        )
        if f_check.status_code == 200 and not f_check.json():
            # Farmer profile missing in farmers table; auto-provision to fulfill foreign key constraint
            await client.post(
                f"{supabase_url}/rest/v1/farmers",
                json={
                    "user_id": farmer_user_id,
                    "verification_status": "Pending",
                    "state": "Tamil Nadu",
                    "district": "Coimbatore",
                    "village": "Coimbatore"
                },
                headers=get_supabase_headers()
            )

        res = await client.post(
            f"{supabase_url}/rest/v1/products", 
            json=product_data, 
            headers={**get_supabase_headers(), "Prefer": "return=representation"}
        )
        if res.status_code not in (200, 201) or not res.json():
            detail_msg = res.text
            try:
                err_json = res.json()
                if isinstance(err_json, dict) and "message" in err_json:
                    detail_msg = err_json["message"]
            except Exception:
                pass
            raise HTTPException(status_code=400, detail=f"Failed to submit product: {detail_msg}")
        
        saved_product = res.json()[0]
        return saved_product

@app.get("/api/farmers/{farmer_id}/products")
async def get_farmer_products(farmer_id: UUID):
    async with httpx.AsyncClient() as client:
        res = await client.get(
            f"{supabase_url}/rest/v1/products?farmer_id=eq.{farmer_id}&order=created_at.desc.nullslast",
            headers=get_supabase_headers()
        )
        if res.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to fetch products")
        return res.json()

from models import ProductStatusUpdate
@app.patch("/api/products/{product_id}/status")
async def update_product_status(product_id: UUID, status_update: ProductStatusUpdate, farmer: dict = Depends(require_verified_farmer)):
    update_data = {"status": status_update.status}
    if status_update.status in ['Completed', 'Removed']:
        update_data["completed_at"] = datetime.utcnow().isoformat()
    
    async with httpx.AsyncClient() as client:
        # Verify ownership
        chk_res = await client.get(f"{supabase_url}/rest/v1/products?id=eq.{product_id}", headers=get_supabase_headers())
        if chk_res.status_code != 200 or not chk_res.json():
            raise HTTPException(status_code=404, detail="Product not found")
        if str(chk_res.json()[0]["farmer_id"]) != str(farmer["id"]):
            raise HTTPException(status_code=403, detail="Not your product")

        res = await client.patch(
            f"{supabase_url}/rest/v1/products?id=eq.{product_id}", 
            json=update_data, 
            headers=get_supabase_headers()
        )
        if res.status_code not in (200, 204):
            raise HTTPException(status_code=400, detail="Failed to update product")
        return {"status": "success"}

@app.get("/api/products/{product_id}")
async def get_product(product_id: UUID):
    async with httpx.AsyncClient() as client:
        res = await client.get(
            f"{supabase_url}/rest/v1/products?id=eq.{product_id}&select=*,farmers!inner(*,users!farmers_user_id_fkey(name,phone))",
            headers=get_supabase_headers()
        )
        if res.status_code != 200 or not res.json():
            raise HTTPException(status_code=404, detail="Product not found")
        return res.json()[0]

@app.get("/api/products")
async def list_products():
    async with httpx.AsyncClient() as client:
        res = await client.get(
            f"{supabase_url}/rest/v1/products?status=eq.Available&select=*,farmers!inner(*,users!farmers_user_id_fkey(name,phone))&order=created_at.desc",
            headers=get_supabase_headers()
        )
        if res.status_code != 200:
            return []
        return res.json()

from datetime import datetime

# Platform Settings DB Mock
platform_settings_db = {
    "DAILY_CONSUMER_LIMIT_KG": 10.0
}

# Orders API
orders_db: Dict[UUID, OrderResponse] = {}

@app.post("/api/orders_mock", response_model=OrderResponse)
def create_order(order: OrderCreate):
    daily_limit = platform_settings_db.get("DAILY_CONSUMER_LIMIT_KG", 10.0)

    # Validation against limits per consumer per product category per day
    today_str = datetime.now().strftime("%Y-%m-%d")

    # Simple mock categories based on product string name ending for hackathon demo
    # In real app: query products_db[item.product_id].category_id
    def get_category(prod_id: UUID) -> str:
        prod = products_db.get(prod_id)
        if prod and "Tomato" in prod.name: return "Vegetables"
        if prod and "Onion" in prod.name: return "Vegetables"
        return "Other"

    requested_kg_by_cat = {}
    for item in order.items:
        cat = get_category(item.product_id)
        requested_kg_by_cat[cat] = requested_kg_by_cat.get(cat, 0) + item.quantity

    # Fetch past orders for the consumer today
    past_orders_today = [
        o for o in orders_db.values()
        if o.consumer_id == order.consumer_id and o.created_at.startswith(today_str)
    ]

    past_kg_by_cat = {}
    for past_order in past_orders_today:
        for item in past_order.items:
             cat = get_category(item.product_id)
             past_kg_by_cat[cat] = past_kg_by_cat.get(cat, 0) + item.quantity

    # Check limits
    for cat, req_qty in requested_kg_by_cat.items():
        past_qty = past_kg_by_cat.get(cat, 0)
        if req_qty + past_qty > daily_limit:
            raise HTTPException(
                status_code=400,
                detail=f"Order exceeds daily consumer limit of {daily_limit}kg for {cat}. You have already ordered {past_qty}kg today. Please use bulk request for larger quantities."
            )

    order_id = uuid4()
    order_dict = order.model_dump()
    order_dict['created_at'] = today_str # Set the creation date for historical checking
    new_order = OrderResponse(id=order_id, **order_dict)
    orders_db[order_id] = new_order
    return new_order

@app.get("/api/orders/available-deliveries")
async def get_available_deliveries():
    deliveries_list = []
    # 1. Try DB
    async with httpx.AsyncClient() as client:
        try:
            res = await client.get(
                f"{supabase_url}/rest/v1/deliveries?status=in.(Pending%20Assignment,Delivery%20Requested)&select=*,orders(*,products(*,farmers(*,users(*))))",
                headers=get_supabase_headers()
            )
            if res.status_code == 200 and res.json():
                deliveries_list = res.json()
        except Exception:
            pass
            
    # 2. Add in-memory deliveries
    for oid, d in DELIVERIES_DB.items():
        if d.get("status") in ["Pending Assignment", "Delivery Requested"] and not d.get("delivery_partner_id"):
            if not any(x.get("order_id") == oid for x in deliveries_list):
                deliveries_list.append(d)
                
    return deliveries_list


@app.get("/api/orders/{order_id}", response_model=OrderResponse)
def get_order(order_id: UUID):
    if order_id not in orders_db:
        raise HTTPException(status_code=404, detail="Order not found")
    return orders_db[order_id]

# Bulk Orders API
bulk_orders_db: Dict[UUID, BulkOrderRequestResponse] = {}

@app.post("/api/bulk-orders", response_model=BulkOrderRequestResponse)
def create_bulk_order(request: BulkOrderRequestCreate):
    req_id = uuid4()
    new_req = BulkOrderRequestResponse(id=req_id, **request.model_dump())
    bulk_orders_db[req_id] = new_req
    return new_req

@app.get("/api/bulk-orders", response_model=List[BulkOrderRequestResponse])
def list_bulk_orders():
    return list(bulk_orders_db.values())

# Admin Verification API
class VerificationRequest(BaseModel):
    admin_id: UUID
    target_id: UUID
    action: str # "Approve", "Reject"
    notes: str = ""

@app.post("/api/admin/verify")
def verify_target(req: VerificationRequest):
    # In a real app this would update the DB and log the action
    return {"status": "success", "message": f"Target {req.target_id} marked as {req.action}"}

# AI API
@app.post("/api/ai/search", response_model=SearchResponse)
def ai_search(req: SearchRequest):
    return mock_natural_language_search(req.query)

@app.get("/api/ai/price", response_model=PriceRecommendationResponse)
def ai_price(product: str):
    return mock_price_recommendation(product)

# IVR Mock API
@app.post("/api/ivr/incoming", response_model=IVRResponse)
def ivr_incoming(req: IVRWebhookRequest):
    return handle_incoming_call(req)

@app.post("/api/ivr/input", response_model=IVRResponse)
async def ivr_input(req: IVRWebhookRequest):
    digits = req.Digits
    category_map = {
        "1": "Vegetables",
        "2": "Fruits",
        "3": "Millets"
    }
    
    if digits in category_map:
        cat_name = category_map[digits]
        async with httpx.AsyncClient() as client:
            user_res = await client.get(
                f"{supabase_url}/rest/v1/users?phone=eq.{req.From}",
                headers=get_supabase_headers()
            )
            users = user_res.json() if user_res.status_code == 200 else []
            if users:
                farmer_id = users[0]["id"]
                product_data = {
                    "farmer_id": farmer_id,
                    "name": f"IVR {cat_name} Listing",
                    "price": 0.0,
                    "quantity_available": 0.0,
                    "unit": "kg",
                    "image_url": "IVR Listing - Image Not Available",
                    "status": "Pending Verification",
                    "delivery_preference": "Self Pickup"
                }
                await client.post(
                    f"{supabase_url}/rest/v1/products",
                    json=product_data,
                    headers=get_supabase_headers()
                )
    
    return handle_digit_input(req)


@app.get("/api/products/search")
async def search_products(q: str):
    async with httpx.AsyncClient() as client:
        # Use ilike for case-insensitive search
        res = await client.get(
            f"{supabase_url}/rest/v1/products?name=ilike.*{q}*&status=eq.Available&select=*,farmers!inner(*,users!farmers_user_id_fkey(name,phone))&order=created_at.desc",
            headers=get_supabase_headers()
        )
        if res.status_code != 200:
            return []
        return res.json()

class OrderCreateData(BaseModel):
    consumer_id: UUID
    farmer_id: UUID
    product_id: UUID
    quantity: float
    total_amount: float
    fulfillment_method: str
    delivery_address: Optional[dict] = None

@app.post("/api/orders")
async def create_order(order: OrderCreateData):
    async with httpx.AsyncClient() as client:
        headers = get_supabase_headers()
        # 1. Verify product and quantity
        prod_res = await client.get(f"{supabase_url}/rest/v1/products?id=eq.{order.product_id}&select=quantity_available,status", headers=headers)
        if not prod_res.json():
            raise HTTPException(status_code=404, detail="Product not found")
        prod = prod_res.json()[0]
        if prod["status"] != "Available" or float(prod["quantity_available"]) < order.quantity:
            raise HTTPException(status_code=400, detail="Insufficient stock or product unavailable")
        
        # 2. Reduce quantity
        new_qty = float(prod["quantity_available"]) - order.quantity
        new_status = "Available" if new_qty > 0 else "Out of Stock"
        patch_res = await client.patch(
            f"{supabase_url}/rest/v1/products?id=eq.{order.product_id}",
            json={"quantity_available": new_qty, "status": new_status},
            headers=headers
        )
        
        # 3. Create order
        order_payload = order.dict()
        order_payload["consumer_id"] = str(order_payload["consumer_id"])
        order_payload["farmer_id"] = str(order_payload["farmer_id"])
        order_payload["product_id"] = str(order_payload["product_id"])
        order_res = await client.post(
            f"{supabase_url}/rest/v1/orders",
            json=order_payload,
            headers={**headers, "Prefer": "return=representation"}
        )
        if order_res.status_code not in (200, 201):
            raise HTTPException(status_code=400, detail=f"Failed to create order: {order_res.text}")
        created_order = order_res.json()[0]
        
        # 4. Create notifications
        farmer_title = "New Order Received"
        farmer_message = f"You received a new order for {order.quantity} kg via {order.fulfillment_method}."
        if order.fulfillment_method == "Farmer Delivery":
            farmer_title = "New Delivery Order"
            farmer_message = f"Customer has placed an order for {order.quantity} kg. Please deliver."

        await client.post(
            f"{supabase_url}/rest/v1/notifications",
            json=[
                {
                    "user_id": str(order.farmer_id),
                    "role": "farmer",
                    "order_id": created_order["id"],
                    "title": farmer_title,
                    "message": farmer_message
                },
                {
                    "user_id": str(order.consumer_id),
                    "role": "consumer",
                    "order_id": created_order["id"],
                    "title": "Order Placed Successfully",
                    "message": f"Your order has been placed. Fulfillment: {order.fulfillment_method}."
                }
            ],
            headers=headers
        )
        
        # 5. Create delivery request if needed
        if order.fulfillment_method == "Delivery Partner":
            DELIVERIES_DB[created_order["id"]] = {
                "order_id": created_order["id"],
                "delivery_partner_id": None,
                "status": "Delivery Requested",
                "orders": created_order
            }
            await client.post(
                f"{supabase_url}/rest/v1/deliveries",
                json={
                    "order_id": created_order["id"],
                    "status": "Delivery Requested"
                },
                headers=headers
            )
            
            # Find eligible delivery partners (simplified to all active partners for hackathon)
            dp_res = await client.get(f"{supabase_url}/rest/v1/users?role=eq.delivery_partner", headers=headers)
            if dp_res.status_code == 200:
                dps = dp_res.json()
                notifications = []
                for dp in dps:
                    notifications.append({
                        "user_id": dp["id"],
                        "role": "delivery_partner",
                        "order_id": created_order["id"],
                        "title": "New Delivery Request",
                        "message": f"A customer has placed a delivery order for {order.quantity} kg. Pickup from Farmer."
                    })
                if notifications:
                    await client.post(f"{supabase_url}/rest/v1/notifications", json=notifications, headers=headers)
            
        return created_order


@app.patch("/api/orders/{order_id}/status")
async def update_order_status(order_id: UUID, status_update: OrderStatusUpdate):
    async with httpx.AsyncClient() as client:
        res = await client.patch(
            f"{supabase_url}/rest/v1/orders?id=eq.{order_id}",
            json={"status": status_update.status},
            headers={**get_supabase_headers(), "Prefer": "return=representation"}
        )
        if res.status_code not in (200, 201, 204):
            raise HTTPException(status_code=400, detail="Failed to update order status")
        return res.json()[0]

@app.get("/api/notifications/{user_id}")
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


@app.get("/api/orders/consumer/{user_id}")
async def get_consumer_orders_specific(user_id: UUID):
    async with httpx.AsyncClient() as client:
        res = await client.get(
            f"{supabase_url}/rest/v1/orders?consumer_id=eq.{user_id}&select=*,products(*),users!orders_farmer_id_fkey(name,phone)&order=created_at.desc",
            headers=get_supabase_headers()
        )
        return res.json() if res.status_code == 200 else []

class BulkRequestCreate(BaseModel):
    consumer_id: UUID
    product_id: Optional[UUID] = None
    product_name: Optional[str] = "Fresh Produce"
    quantity_required: float
    unit: Optional[str] = "kg"
    reason: str
    date_needed: str
    delivery_address: Optional[dict] = None
    fulfillment_method: Optional[str] = "Delivery Partner"

class BulkFarmerResponse(BaseModel):
    farmer_id: UUID
    action: str  # "ACCEPT" or "DECLINE"
    quantity: Optional[float] = None

class BulkConsumerAction(BaseModel):
    consumer_id: UUID
    action: str  # "ACCEPT_PARTIAL", "CANCEL", "CONVERT_TO_ORDER"

async def match_farmers_for_bulk_request(product_id_str: Optional[str], product_name: str, required_qty: float, excluded_farmer_ids: set):
    matched_contributions = []
    async with httpx.AsyncClient() as client:
        headers = get_supabase_headers()
        res = await client.get(
            f"{supabase_url}/rest/v1/products?status=eq.Available&quantity_available=gt.0&select=*,farmers!inner(*,users!farmers_user_id_fkey(name,phone))&order=quantity_available.desc",
            headers=headers
        )
        if res.status_code != 200:
            return matched_contributions
        
        products_list = res.json()
        
        eligible = []
        for p in products_list:
            farmer_info = p.get("farmers") or {}
            farmer_status = farmer_info.get("verification_status", "Approved")
            if farmer_status != "Approved":
                continue
                
            farmer_user_id = str(p.get("farmer_id") or farmer_info.get("user_id") or "")
            if not farmer_user_id or farmer_user_id in excluded_farmer_ids:
                continue
                
            p_id = str(p.get("id"))
            p_name = (p.get("name") or "").lower()
            target_name = (product_name or "").lower()
            
            # Match condition
            if (product_id_str and p_id == product_id_str) or (target_name and (target_name in p_name or p_name in target_name)) or not target_name:
                user_info = farmer_info.get("users") or {}
                farmer_name = user_info.get("name") or "Verified Farmer"
                farmer_phone = user_info.get("phone") or ""
                avail_qty = float(p.get("quantity_available") or 0.0)
                unit_price = float(p.get("price") or 0.0)
                
                eligible.append({
                    "product": p,
                    "farmer_user_id": farmer_user_id,
                    "farmer_name": farmer_name,
                    "farmer_phone": farmer_phone,
                    "avail_qty": avail_qty,
                    "unit_price": unit_price
                })
        
        if not eligible:
            return matched_contributions
            
        # Preference 1: Single farmer with full quantity
        single_full = [e for e in eligible if e["avail_qty"] >= required_qty]
        if single_full:
            chosen = single_full[0]
            matched_contributions.append({
                "id": str(uuid4()),
                "farmer_id": chosen["farmer_user_id"],
                "farmer_name": chosen["farmer_name"],
                "farmer_phone": chosen["farmer_phone"],
                "product_id": str(chosen["product"]["id"]),
                "product_name": chosen["product"]["name"],
                "unit_price": chosen["unit_price"],
                "requested_contribution": required_qty,
                "confirmed_contribution": 0.0,
                "status": "PENDING",
                "created_at": datetime.utcnow().isoformat()
            })
            return matched_contributions
            
        # Preference 2: Multi-farmer aggregation
        remaining_needed = required_qty
        for e in eligible:
            if remaining_needed <= 0:
                break
            contrib_qty = min(e["avail_qty"], remaining_needed)
            matched_contributions.append({
                "id": str(uuid4()),
                "farmer_id": e["farmer_user_id"],
                "farmer_name": e["farmer_name"],
                "farmer_phone": e["farmer_phone"],
                "product_id": str(e["product"]["id"]),
                "product_name": e["product"]["name"],
                "unit_price": e["unit_price"],
                "requested_contribution": contrib_qty,
                "confirmed_contribution": 0.0,
                "status": "PENDING",
                "created_at": datetime.utcnow().isoformat()
            })
            remaining_needed -= contrib_qty
            
        return matched_contributions

@app.post("/api/bulk-requests")
@app.post("/api/orders/bulk")
async def create_bulk_request(req: BulkRequestCreate):
    req_id = str(uuid4())
    p_id_str = str(req.product_id) if req.product_id else None
    
    matched_items = await match_farmers_for_bulk_request(p_id_str, req.product_name, req.quantity_required, set())
    
    total_matched_qty = sum(item["requested_contribution"] for item in matched_items)
    initial_status = "AWAITING_FARMER_RESPONSES" if matched_items else "PARTIALLY_CONFIRMED"
        
    bulk_record = {
        "id": req_id,
        "consumer_id": str(req.consumer_id),
        "product_id": p_id_str,
        "product_name": req.product_name,
        "quantity_required": req.quantity_required,
        "unit": req.unit or "kg",
        "reason": req.reason,
        "date_needed": req.date_needed,
        "delivery_address": req.delivery_address or {},
        "fulfillment_method": req.fulfillment_method or "Delivery Partner",
        "status": initial_status,
        "farmer_contributions": matched_items,
        "confirmed_quantity": 0.0,
        "remaining_quantity": req.quantity_required,
        "available_supply": total_matched_qty,
        "total_estimated_price": sum(item["requested_contribution"] * item["unit_price"] for item in matched_items),
        "created_at": datetime.utcnow().isoformat()
    }
    
    BULK_REQUESTS_DB[req_id] = bulk_record
    
    # Notify matched farmers
    async with httpx.AsyncClient() as client:
        headers = get_supabase_headers()
        for item in matched_items:
            notif_msg = f"A customer requested {req.quantity_required} {req.unit} of {req.product_name}. Contribution requested: {item['requested_contribution']} {req.unit}."
            notif_data = {
                "user_id": item["farmer_id"],
                "role": "farmer",
                "order_id": req_id,
                "title": "New Bulk Order Contribution Request",
                "message": notif_msg
            }
            try:
                await client.post(f"{supabase_url}/rest/v1/notifications", json=notif_data, headers=headers)
            except Exception:
                pass
            NOTIFICATIONS_DB.append({
                "id": str(uuid4()),
                "user_id": item["farmer_id"],
                "role": "farmer",
                "title": notif_data["title"],
                "message": notif_data["message"],
                "is_read": False,
                "created_at": datetime.utcnow().isoformat()
            })
            
    return bulk_record

@app.get("/api/bulk-requests/consumer/{consumer_id}")
async def get_consumer_bulk_requests(consumer_id: UUID):
    cid = str(consumer_id)
    reqs = [r for r in BULK_REQUESTS_DB.values() if r["consumer_id"] == cid]
    return sorted(reqs, key=lambda x: x.get("created_at", ""), reverse=True)

@app.get("/api/bulk-requests/farmer/{farmer_id}")
async def get_farmer_bulk_requests(farmer_id: UUID):
    fid = str(farmer_id)
    res_list = []
    for req in BULK_REQUESTS_DB.values():
        for contrib in req.get("farmer_contributions", []):
            if contrib["farmer_id"] == fid:
                res_list.append({
                    "bulk_request_id": req["id"],
                    "contribution_id": contrib["id"],
                    "product_name": req["product_name"],
                    "requested_contribution": contrib["requested_contribution"],
                    "confirmed_contribution": contrib["confirmed_contribution"],
                    "consumer_required_total": req["quantity_required"],
                    "unit": req["unit"],
                    "date_needed": req["date_needed"],
                    "delivery_address": req["delivery_address"],
                    "unit_price": contrib["unit_price"],
                    "status": contrib["status"],
                    "bulk_status": req["status"],
                    "created_at": contrib.get("created_at", req.get("created_at"))
                })
    return sorted(res_list, key=lambda x: x.get("created_at", ""), reverse=True)

@app.post("/api/bulk-requests/{request_id}/farmer-response")
async def farmer_bulk_response(request_id: str, resp: BulkFarmerResponse):
    if request_id not in BULK_REQUESTS_DB:
        raise HTTPException(status_code=404, detail="Bulk request not found")
        
    req = BULK_REQUESTS_DB[request_id]
    fid = str(resp.farmer_id)
    
    target_contrib = None
    for c in req.get("farmer_contributions", []):
        if c["farmer_id"] == fid and c["status"] == "PENDING":
            target_contrib = c
            break
            
    if not target_contrib:
        raise HTTPException(status_code=400, detail="No pending contribution request found for this farmer")
        
    async with httpx.AsyncClient() as client:
        headers = get_supabase_headers()
        
        if resp.action.upper() == "ACCEPT":
            # Check live inventory in products table
            p_res = await client.get(f"{supabase_url}/rest/v1/products?id=eq.{target_contrib['product_id']}", headers=headers)
            live_qty = 0.0
            if p_res.status_code == 200 and p_res.json():
                live_qty = float(p_res.json()[0].get("quantity_available") or 0.0)
                
            requested_amt = target_contrib["requested_contribution"]
            actual_accept_qty = min(requested_amt, live_qty)
            
            if actual_accept_qty <= 0:
                raise HTTPException(status_code=400, detail=f"Only {live_qty} kg is currently available in inventory.")
                
            # Reserve inventory from products table
            new_avail = live_qty - actual_accept_qty
            new_p_status = "Available" if new_avail > 0 else "Out of Stock"
            await client.patch(
                f"{supabase_url}/rest/v1/products?id=eq.{target_contrib['product_id']}",
                json={"quantity_available": new_avail, "status": new_p_status},
                headers=headers
            )
            
            target_contrib["confirmed_contribution"] = actual_accept_qty
            target_contrib["status"] = "ACCEPTED"
            
        else: # DECLINE
            target_contrib["status"] = "DECLINED"
            target_contrib["confirmed_contribution"] = 0.0
            
            # Dynamic Re-matching: search for additional eligible farmers
            already_asked = {c["farmer_id"] for c in req["farmer_contributions"]}
            cur_confirmed = sum(c["confirmed_contribution"] for c in req["farmer_contributions"] if c["status"] == "ACCEPTED")
            unfulfilled = req["quantity_required"] - cur_confirmed
            
            if unfulfilled > 0:
                new_items = await match_farmers_for_bulk_request(req.get("product_id"), req["product_name"], unfulfilled, already_asked)
                for item in new_items:
                    req["farmer_contributions"].append(item)
                    try:
                        notif_msg = f"A customer requested {req['quantity_required']} {req['unit']} of {req['product_name']}. Contribution requested: {item['requested_contribution']} {req['unit']}."
                        await client.post(f"{supabase_url}/rest/v1/notifications", json={
                            "user_id": item["farmer_id"],
                            "role": "farmer",
                            "order_id": request_id,
                            "title": "New Bulk Order Contribution Request",
                            "message": notif_msg
                        }, headers=headers)
                    except Exception:
                        pass

    # Recalculate totals and status
    confirmed_total = sum(c["confirmed_contribution"] for c in req["farmer_contributions"] if c["status"] == "ACCEPTED")
    req["confirmed_quantity"] = confirmed_total
    req["remaining_quantity"] = max(0.0, req["quantity_required"] - confirmed_total)
    
    if confirmed_total >= req["quantity_required"]:
        req["status"] = "FULLY_CONFIRMED"
    else:
        pending_exists = any(c["status"] == "PENDING" for c in req["farmer_contributions"])
        if pending_exists:
            req["status"] = "AWAITING_FARMER_RESPONSES"
        else:
            req["status"] = "PARTIALLY_CONFIRMED"
            
    return {"status": "success", "bulk_request": req}

@app.post("/api/bulk-requests/{request_id}/consumer-action")
async def consumer_bulk_action(request_id: str, action_data: BulkConsumerAction):
    if request_id not in BULK_REQUESTS_DB:
        raise HTTPException(status_code=404, detail="Bulk request not found")
        
    req = BULK_REQUESTS_DB[request_id]
    if req["consumer_id"] != str(action_data.consumer_id):
        raise HTTPException(status_code=403, detail="Unauthorized")
        
    async with httpx.AsyncClient() as client:
        headers = get_supabase_headers()
        act = action_data.action.upper()
        
        if act == "ACCEPT_PARTIAL":
            req["quantity_required"] = req["confirmed_quantity"]
            req["remaining_quantity"] = 0.0
            req["status"] = "FULLY_CONFIRMED"
            return {"status": "success", "bulk_request": req}
            
        elif act == "CANCEL":
            # Release reserved inventory back to farmers for accepted contributions
            for c in req.get("farmer_contributions", []):
                if c["status"] == "ACCEPTED" and c["confirmed_contribution"] > 0:
                    p_res = await client.get(f"{supabase_url}/rest/v1/products?id=eq.{c['product_id']}", headers=headers)
                    if p_res.status_code == 200 and p_res.json():
                        cur_q = float(p_res.json()[0].get("quantity_available") or 0.0)
                        restored_q = cur_q + c["confirmed_contribution"]
                        await client.patch(
                            f"{supabase_url}/rest/v1/products?id=eq.{c['product_id']}",
                            json={"quantity_available": restored_q, "status": "Available"},
                            headers=headers
                        )
                    c["status"] = "CANCELLED"
            req["status"] = "CANCELLED"
            return {"status": "success", "bulk_request": req}
            
        elif act == "CONVERT_TO_ORDER":
            if req["status"] not in ["FULLY_CONFIRMED", "PARTIALLY_CONFIRMED"] or req["confirmed_quantity"] <= 0:
                raise HTTPException(status_code=400, detail="Bulk request must have confirmed contributions before converting to orders.")
                
            created_orders = []
            for c in req.get("farmer_contributions", []):
                if c["status"] == "ACCEPTED" and c["confirmed_contribution"] > 0:
                    order_payload = {
                        "consumer_id": req["consumer_id"],
                        "farmer_id": c["farmer_id"],
                        "product_id": c["product_id"],
                        "quantity": c["confirmed_contribution"],
                        "total_amount": c["confirmed_contribution"] * c["unit_price"],
                        "fulfillment_method": req["fulfillment_method"],
                        "delivery_address": req["delivery_address"],
                        "status": "CONFIRMED"
                    }
                    o_res = await client.post(
                        f"{supabase_url}/rest/v1/orders",
                        json=order_payload,
                        headers={**headers, "Prefer": "return=representation"}
                    )
                    if o_res.status_code in (200, 201) and o_res.json():
                        created_order = o_res.json()[0]
                        created_orders.append(created_order)
                        
                        if req["fulfillment_method"] == "Delivery Partner":
                            DELIVERIES_DB[created_order["id"]] = {
                                "order_id": created_order["id"],
                                "delivery_partner_id": None,
                                "status": "Delivery Requested",
                                "orders": created_order
                            }
                            await client.post(
                                f"{supabase_url}/rest/v1/deliveries",
                                json={"order_id": created_order["id"], "status": "Delivery Requested"},
                                headers=headers
                            )
            req["status"] = "COMPLETED"
            return {"status": "success", "orders": created_orders, "bulk_request": req}
        else:
            raise HTTPException(status_code=400, detail="Invalid action")

class NotificationReadRequest(BaseModel):
    notification_ids: List[UUID]

@app.patch("/api/notifications/read")
async def mark_notifications_read(req: NotificationReadRequest):
    async with httpx.AsyncClient() as client:
        for nid in req.notification_ids:
            await client.patch(
                f"{supabase_url}/rest/v1/notifications?id=eq.{nid}",
                json={"is_read": True},
                headers=get_supabase_headers()
            )
        return {"status": "success"}

@app.post("/api/delivery/register", response_model=UserResponse)
async def register_delivery_partner(
    name: str = Form(...),
    phone: str = Form(...),
    password: str = Form(...),
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
  
        if not password or len(password.strip()) == 0:
            raise HTTPException(status_code=400, detail="Please enter a password.")

        async with httpx.AsyncClient() as client:
            user_check = await client.get(
                f"{supabase_url}/rest/v1/users?phone=eq.{phone}",
                headers=get_supabase_headers()
            )
            if user_check.status_code == 200 and user_check.json():
                user_id = user_check.json()[0]["id"]
                dp_check = await client.get(
                    f"{supabase_url}/rest/v1/delivery_partners?user_id=eq.{user_id}",
                    headers=get_supabase_headers()
                )
                if dp_check.status_code == 200 and dp_check.json():
                    raise HTTPException(status_code=400, detail="An account with these credentials already exists. Please log in instead.")

            # Create user in Supabase Auth with password
            auth_id, auth_email = await create_supabase_auth_user(client, phone, password, name, "delivery_partner", email)

            # Create or link user in users table
            user_id = None
            if user_check.status_code == 200 and user_check.json():
                user_id = user_check.json()[0]["id"]
                await client.patch(
                    f"{supabase_url}/rest/v1/users?id=eq.{user_id}",
                    json={"auth_id": auth_id},
                    headers=get_supabase_headers()
                )
            else:
                user_data = {"id": auth_id, "auth_id": auth_id, "name": name, "phone": phone, "role": "delivery_partner"}
                res = await client.post(
                    f"{supabase_url}/rest/v1/users",
                    json=user_data,
                    headers={**get_supabase_headers(), "Prefer": "return=representation"}
                )
                if res.status_code not in (200, 201):
                    raise HTTPException(status_code=400, detail=f"Failed to create user: {res.text}")
                user_id = res.json()[0]["id"]
            
            dp_data = {
                "user_id": user_id,
                "service_radius_km": service_radius_km or 10,
                "vehicle_type": vehicle_type or "Bike",
                "verification_status": "Approved",
                "is_available": True
            }
            dp_res = await client.post(
                f"{supabase_url}/rest/v1/delivery_partners",
                json=dp_data,
                headers={**get_supabase_headers(), "Prefer": "return=representation"}
            )
            if dp_res.status_code not in (200, 201):
                raise HTTPException(status_code=400, detail=f"Failed to create delivery partner profile: {dp_res.text}")
  
        return UserResponse(id=UUID(user_id), name=name, phone=phone, role="delivery_partner")
    except HTTPException:
        raise
    except Exception as e:
        print("Delivery Registration Error:", e)
        raise HTTPException(status_code=500, detail=f"Registration error: {str(e)}")

class AssignDeliveryRequest(BaseModel):
    delivery_partner_id: str

@app.patch("/api/orders/{order_id}/assign-delivery")
async def assign_delivery(order_id: UUID, req: AssignDeliveryRequest):
    oid = str(order_id)
    # Check in-memory store first
    if oid in DELIVERIES_DB and DELIVERIES_DB[oid].get("delivery_partner_id") and DELIVERIES_DB[oid].get("delivery_partner_id") != req.delivery_partner_id:
        raise HTTPException(status_code=400, detail="Delivery already assigned to another partner.")

    async with httpx.AsyncClient() as client:
        headers = get_supabase_headers()
        # Check DB
        check_res = await client.get(f"{supabase_url}/rest/v1/deliveries?order_id=eq.{oid}", headers=headers)
        if check_res.status_code == 200 and check_res.json():
            delivery = check_res.json()[0]
            if delivery.get("delivery_partner_id") and str(delivery.get("delivery_partner_id")) != str(req.delivery_partner_id):
                raise HTTPException(status_code=400, detail="Delivery already assigned to another partner.")

        # Update DB
        res = await client.patch(
            f"{supabase_url}/rest/v1/deliveries?order_id=eq.{oid}",
            json={
                "delivery_partner_id": str(req.delivery_partner_id),
                "status": "Accepted"
            },
            headers={**headers, "Prefer": "return=representation"}
        )
        
        await client.patch(
            f"{supabase_url}/rest/v1/orders?id=eq.{oid}",
            json={"status": "Delivery Assigned"},
            headers=headers
        )

    DELIVERIES_DB[oid] = {
        "order_id": oid,
        "delivery_partner_id": str(req.delivery_partner_id),
        "status": "Accepted"
    }

    return {"status": "success", "message": "Delivery assigned successfully"}


@app.get("/api/deliveries/partner/{partner_id}")
async def get_partner_deliveries(partner_id: UUID):
    async with httpx.AsyncClient() as client:
        res = await client.get(
            f"{supabase_url}/rest/v1/deliveries?delivery_partner_id=eq.{partner_id}&status=not.eq.Delivered&select=*,orders(*,consumers(*,users(*))),orders(*,order_items(*,products(*,farmers(*,users(*)))))",
            headers=get_supabase_headers()
        )
        if res.status_code != 200:
            return []
        return res.json()

@app.patch("/api/deliveries/{delivery_id}/status")
async def update_delivery_status(delivery_id: UUID, status_update: FarmerOrderStatusUpdate):
    if not supabase_url:
        raise HTTPException(status_code=400, detail="Supabase required")
    
    if status_update.status in ['Delivered', 'Completed']:
        raise HTTPException(status_code=403, detail="Order completion requires OTP verification.")
        
    async with httpx.AsyncClient() as client:
        headers = get_supabase_headers()
        get_res = await client.get(f"{supabase_url}/rest/v1/deliveries?id=eq.{delivery_id}&select=*,orders(*)", headers=headers)
        if get_res.status_code != 200 or not get_res.json():
            raise HTTPException(status_code=404, detail="Delivery not found")
        
        delivery = get_res.json()[0]
        order = delivery.get("orders")
        order_id = order.get("id")
        
        update_data = {"status": status_update.status}
        order_update_data = {"status": status_update.status}
        
        recovered_otp = None
        if status_update.status == 'Out for Delivery':
            if not order.get("delivery_otp_hash"):
                import random, hashlib
                recovered_otp = str(random.randint(1000, 9999))
                otp_hash = hashlib.sha256(f"{order_id}:{recovered_otp}".encode()).hexdigest()
                order_update_data["delivery_otp_hash"] = otp_hash
                from datetime import datetime, timedelta
                order_update_data["delivery_otp_expires_at"] = (datetime.utcnow() + timedelta(days=1)).isoformat()
                order_update_data["delivery_otp_attempts"] = 0
            else:
                import hashlib
                for i in range(10000):
                    test = f"{i:04d}"
                    if hashlib.sha256(f"{order_id}:{test}".encode()).hexdigest() == order.get("delivery_otp_hash"):
                        recovered_otp = test
                        break
        
        # update delivery
        await client.patch(
            f"{supabase_url}/rest/v1/deliveries?id=eq.{delivery_id}",
            json=update_data,
            headers=headers
        )
        
        # update order
        await client.patch(
            f"{supabase_url}/rest/v1/orders?id=eq.{order_id}",
            json=order_update_data,
            headers=headers
        )
        
        consumer_id = order.get("consumer_id")
        if consumer_id:
            message = f"Your order status is now: {status_update.status}."
            title_msg = "Order Status Updated"
            if status_update.status == "Out for Delivery":
                title_msg = "Your order is out for delivery"
                message = f"Your delivery partner is on the way. Your delivery verification OTP is {recovered_otp or 'ready'}. Share this OTP with the partner only when your order arrives."
            
            await client.post(
                f"{supabase_url}/rest/v1/notifications",
                json={
                    "user_id": consumer_id,
                    "role": "consumer",
                    "order_id": str(order_id),
                    "title": title_msg,
                    "message": message
                },
                headers=headers
            )
            
        return {"status": "success"}

# Addresses API

@app.post("/api/addresses", response_model=AddressResponse)
async def create_address(addr: AddressCreate):
    async with httpx.AsyncClient() as client:
        # Check count
        count_res = await client.get(
            f"{supabase_url}/rest/v1/consumer_addresses?consumer_id=eq.{addr.consumer_id}&select=id",
            headers=get_supabase_headers()
        )
        if count_res.status_code == 200 and len(count_res.json()) >= 3:
            raise HTTPException(status_code=400, detail="Maximum 3 addresses allowed per consumer")
        
        # Unset default if necessary
        if addr.is_default:
            await client.patch(
                f"{supabase_url}/rest/v1/consumer_addresses?consumer_id=eq.{addr.consumer_id}",
                json={"is_default": False},
                headers=get_supabase_headers()
            )
            
        data = addr.model_dump()
        data["consumer_id"] = str(data["consumer_id"])
        
        res = await client.post(
            f"{supabase_url}/rest/v1/consumer_addresses",
            json=data,
            headers=get_supabase_headers()
        )
        if res.status_code not in (200, 201):
            raise HTTPException(status_code=400, detail="Failed to create address")
        return res.json()[0]

@app.get("/api/addresses/{consumer_id}", response_model=List[AddressResponse])
async def get_addresses(consumer_id: UUID):
    async with httpx.AsyncClient() as client:
        res = await client.get(
            f"{supabase_url}/rest/v1/consumer_addresses?consumer_id=eq.{consumer_id}&order=created_at.desc.nullslast",
            headers=get_supabase_headers()
        )
        if res.status_code != 200:
            return []
        return res.json()

@app.put("/api/addresses/{addr_id}", response_model=AddressResponse)
async def update_address(addr_id: UUID, addr: AddressCreate):
    async with httpx.AsyncClient() as client:
        if addr.is_default:
            await client.patch(
                f"{supabase_url}/rest/v1/consumer_addresses?consumer_id=eq.{addr.consumer_id}",
                json={"is_default": False},
                headers=get_supabase_headers()
            )
            
        data = addr.model_dump()
        data["consumer_id"] = str(data["consumer_id"])
        
        res = await client.patch(
            f"{supabase_url}/rest/v1/consumer_addresses?id=eq.{addr_id}",
            json=data,
            headers=get_supabase_headers()
        )
        if res.status_code not in (200, 201) or not res.json():
            raise HTTPException(status_code=400, detail="Failed to update address")
        return res.json()[0]

@app.delete("/api/addresses/{addr_id}")
async def delete_address(addr_id: UUID):
    async with httpx.AsyncClient() as client:
        res = await client.delete(
            f"{supabase_url}/rest/v1/consumer_addresses?id=eq.{addr_id}",
            headers=get_supabase_headers()
        )
        if res.status_code not in (200, 204):
            raise HTTPException(status_code=400, detail="Failed to delete address")
        return {"status": "success"}
from pydantic import BaseModel
class LoginRequest(BaseModel):
    phone: str
    password: str
    role: str

@app.post("/api/login")
async def login_user(login_data: LoginRequest):
    if not login_data.password or len(login_data.password.strip()) == 0:
        raise HTTPException(status_code=400, detail="Please enter a password.")

    async with httpx.AsyncClient() as client:
        # Check if user exists in users table with role
        res = await client.get(
            f"{supabase_url}/rest/v1/users?phone=eq.{login_data.phone}&role=eq.{login_data.role}",
            headers=get_supabase_headers()
        )
        if res.status_code != 200 or not res.json():
            raise HTTPException(status_code=401, detail="Invalid phone number or password.")
        
        user = res.json()[0]
        
        # Get registered auth email if auth_id is present
        auth_email = None
        if user.get("auth_id"):
            auth_user_res = await client.get(
                f"{supabase_url}/auth/v1/admin/users/{user['auth_id']}",
                headers={"apikey": supabase_key, "Authorization": f"Bearer {supabase_key}"}
            )
            if auth_user_res.status_code == 200:
                auth_email = auth_user_res.json().get("email")

        # Verify password with Supabase Auth
        verified = await verify_supabase_auth_password(client, login_data.phone, login_data.password, email=auth_email)
        if not verified:
            raise HTTPException(status_code=401, detail="Invalid phone number or password.")

        return user

from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi import Request

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = exc.errors()
    error_msgs = []
    for error in errors:
        loc = " -> ".join(str(l) for l in error.get("loc", []))
        error_msgs.append(f"{loc}: {error.get('msg')}")
    
    return JSONResponse(
        status_code=422,
        content={"detail": "Validation Error: " + "; ".join(error_msgs)}
    )

from pydantic import BaseModel
from typing import Optional

class ConsumerRegisterRequest(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None
    password: str
    address_line: Optional[str] = ""
    locality: Optional[str] = ""
    city: Optional[str] = ""
    state: Optional[str] = ""
    pincode: Optional[str] = ""

@app.post("/api/consumers/register", response_model=UserResponse)
async def register_consumer(data: ConsumerRegisterRequest):
    if not data.password or len(data.password.strip()) == 0:
        raise HTTPException(status_code=400, detail="Please enter a password.")

    async with httpx.AsyncClient() as client:
        headers = get_supabase_headers()
        # Check if user already exists
        check_res = await client.get(
            f"{supabase_url}/rest/v1/users?phone=eq.{data.phone}",
            headers=headers
        )
        if check_res.status_code == 200 and len(check_res.json()) > 0:
            raise HTTPException(status_code=400, detail="An account with these credentials already exists. Please log in instead.")
        
        # Create user in Supabase Auth with password
        auth_id, auth_email = await create_supabase_auth_user(client, data.phone, data.password, data.name, "consumer", data.email)

        # Insert user into public.users table
        user_data = {
            "id": auth_id,
            "auth_id": auth_id,
            "name": data.name,
            "phone": data.phone,
            "role": "consumer"
        }
        res = await client.post(
            f"{supabase_url}/rest/v1/users",
            json=user_data,
            headers={**headers, "Prefer": "return=representation"}
        )
        if res.status_code not in (200, 201):
            raise HTTPException(status_code=400, detail="Failed to create consumer account")
        
        user = res.json()[0]
        user_id = user["id"]

        # Insert address
        if data.address_line or data.city:
            addr_data = {
                "consumer_id": user_id,
                "label": "Home",
                "full_name": data.name,
                "mobile_number": data.phone,
                "address_line": data.address_line or "",
                "locality": data.locality or "",
                "city": data.city or "",
                "state": data.state or "",
                "pincode": data.pincode or "",
                "is_default": True
            }
            await client.post(
                f"{supabase_url}/rest/v1/consumer_addresses",
                json=addr_data,
                headers=headers
            )

        return user


# Class defined above
    status: str

import random
import hashlib
from datetime import datetime, timedelta

@app.patch("/api/orders/{order_id}/farmer-status")
async def update_farmer_order_status(order_id: UUID, status_update: FarmerOrderStatusUpdate):
    if not supabase_url:
        raise HTTPException(status_code=400, detail="Supabase required for OTP flow")
        
    if status_update.status in ['Delivered', 'Completed']:
        raise HTTPException(status_code=403, detail="Order completion requires OTP verification.")
        
    async with httpx.AsyncClient() as client:
        headers = get_supabase_headers()
        
        # Retrieve order
        get_res = await client.get(f"{supabase_url}/rest/v1/orders?id=eq.{order_id}", headers=headers)
        if get_res.status_code != 200 or not get_res.json():
            raise HTTPException(status_code=404, detail="Order not found")
        
        order_data = get_res.json()[0]
        
        update_data = {"status": status_update.status}
        
        # Generate OTP if transitioning to Out for Delivery
        recovered_otp = None
        if status_update.status == 'Out for Delivery':
            if not order_data.get("delivery_otp_hash"):
                recovered_otp = str(random.randint(1000, 9999))
                otp_hash = hashlib.sha256(f"{order_id}:{recovered_otp}".encode()).hexdigest()
                update_data["delivery_otp_hash"] = otp_hash
                update_data["delivery_otp_expires_at"] = (datetime.utcnow() + timedelta(days=1)).isoformat()
                update_data["delivery_otp_attempts"] = 0
            else:
                # Recover it
                for i in range(10000):
                    test = f"{i:04d}"
                    if hashlib.sha256(f"{order_id}:{test}".encode()).hexdigest() == order_data.get("delivery_otp_hash"):
                        recovered_otp = test
                        break
                
        # Update order status
        res = await client.patch(
            f"{supabase_url}/rest/v1/orders?id=eq.{order_id}",
            json=update_data,
            headers={**headers, "Prefer": "return=representation"}
        )
        
        if res.status_code not in (200, 201) or not res.json():
            raise HTTPException(status_code=400, detail="Failed to update order status")
            
        updated_order = res.json()[0]
        consumer_id = updated_order.get("consumer_id")
        
        # Notify consumer
        if consumer_id:
            message = f"Your order status is now: {status_update.status}."
            if status_update.status == "Out for Delivery":
                message = "Your farmer has started the delivery. Your delivery verification code is ready. Share it with the farmer only after receiving your order."
            title_msg = "Your order is out for delivery" if status_update.status == "Out for Delivery" else "Order Status Updated"
            NOTIFICATIONS_DB.append({
                "id": str(uuid4()),
                "user_id": str(consumer_id),
                "role": "consumer",
                "order_id": str(order_id),
                "title": title_msg,
                "message": message,
                "is_read": False,
                "created_at": datetime.utcnow().isoformat()
            })
            await client.post(
                f"{supabase_url}/rest/v1/notifications",
                json={
                    "user_id": consumer_id,
                    "role": "consumer",
                    "order_id": str(order_id),
                    "title": title_msg,
                    "message": message
                },
                headers=headers
            )
            
        return {"message": "Status updated successfully", "order": updated_order}

@app.post("/api/orders/{order_id}/verify-otp")
async def verify_delivery_otp(order_id: UUID, req: OTPVerifyRequest):
    oid = str(order_id)
    async with httpx.AsyncClient() as client:
        headers = get_supabase_headers()
        res = await client.get(f"{supabase_url}/rest/v1/orders?id=eq.{oid}", headers=headers)
        if res.status_code != 200 or not res.json():
            raise HTTPException(status_code=404, detail="Order not found")
            
        order = res.json()[0]
        consumer_id = order.get("consumer_id")
        
        if order.get("status") in ['Delivered', 'Completed']:
            return {"message": "Order is already completed.", "status": "Delivered"}
            
        if order.get("delivery_otp_attempts", 0) >= 5:
            raise HTTPException(status_code=429, detail="Too many incorrect attempts. Please contact support.")
            
        if not order.get("delivery_otp_hash"):
            raise HTTPException(status_code=400, detail="OTP not generated for this order yet.")
            
        exp_time_str = order.get("delivery_otp_expires_at")
        if exp_time_str:
            exp_time = datetime.fromisoformat(exp_time_str.replace("Z", "+00:00"))
            if datetime.utcnow().timestamp() > exp_time.timestamp():
                raise HTTPException(status_code=400, detail="Delivery verification code expired.")
        
        # Verify OTP
        input_hash = hashlib.sha256(f"{order_id}:{req.otp}".encode()).hexdigest()
        if input_hash != order.get("delivery_otp_hash"):
            await client.patch(
                f"{supabase_url}/rest/v1/orders?id=eq.{oid}",
                json={"delivery_otp_attempts": order.get("delivery_otp_attempts", 0) + 1},
                headers=headers
            )
            raise HTTPException(status_code=400, detail="Incorrect delivery OTP. Please ask the customer to provide the correct code.")
            
        # Success! Mark as Delivered
        await client.patch(
            f"{supabase_url}/rest/v1/orders?id=eq.{oid}",
            json={
                "status": "Delivered",
                "delivery_otp_verified_at": datetime.utcnow().isoformat(),
                "delivery_otp_verified_by": str(req.farmer_id)
            },
            headers=headers
        )
        
        # Also mark delivery as completed and set fee=30.0
        dp_id = None
        if oid in DELIVERIES_DB:
            DELIVERIES_DB[oid]["status"] = "Delivered"
            DELIVERIES_DB[oid]["fee"] = 30.0
            dp_id = DELIVERIES_DB[oid].get("delivery_partner_id")

        try:
            d_res = await client.patch(
                f"{supabase_url}/rest/v1/deliveries?order_id=eq.{oid}",
                json={"status": "Delivered", "fee": 30.0},
                headers={**headers, "Prefer": "return=representation"}
            )
            if d_res.status_code == 200 and d_res.json():
                dp_id = d_res.json()[0].get("delivery_partner_id") or dp_id
        except Exception:
            pass

        if dp_id:
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
            })

        # Notify consumer
        if consumer_id:
            await client.post(
                f"{supabase_url}/rest/v1/notifications",
                json={
                    "user_id": consumer_id,
                    "role": "consumer",
                    "order_id": oid,
                    "title": "Delivery Verified",
                    "message": "Your order has been delivered successfully."
                },
                headers=headers
            )
            
        return {"message": "Delivery verified successfully.", "status": "Delivered"}


@app.get("/api/orders/{order_id}/delivery-otp")
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
                
        raise HTTPException(status_code=500, detail="Could not recover OTP.")

@app.post("/api/orders/{order_id}/generate-otp")
async def generate_new_otp(order_id: UUID):
    async with httpx.AsyncClient() as client:
        headers = get_supabase_headers()
        res = await client.get(f"{supabase_url}/rest/v1/orders?id=eq.{order_id}", headers=headers)
        if res.status_code != 200 or not res.json():
            raise HTTPException(status_code=404, detail="Order not found")
            
        raw_otp = str(random.randint(1000, 9999))
        otp_hash = hashlib.sha256(f"{order_id}:{raw_otp}".encode()).hexdigest()
        
        update_res = await client.patch(
            f"{supabase_url}/rest/v1/orders?id=eq.{order_id}",
            json={
                "delivery_otp_hash": otp_hash,
                "delivery_otp_expires_at": (datetime.utcnow() + timedelta(days=1)).isoformat(),
                "delivery_otp_attempts": 0
            },
            headers=headers
        )
        if update_res.status_code not in (200, 204):
            raise HTTPException(status_code=500, detail="Failed to generate OTP")
            
        return {"otp": raw_otp}


@app.post("/api/farmers/{farmer_id}/auto-approve")
async def auto_approve_farmer(farmer_id: UUID):
    raise HTTPException(status_code=403, detail="Self-approval is disabled. Farmer verification requires authorized admin approval.")


@app.get("/api/orders/{role}/{user_id}")
async def get_orders(role: str, user_id: UUID):
    async with httpx.AsyncClient() as client:
        if role == "farmer":
            query = f"farmer_id=eq.{user_id}"
        elif role == "consumer":
            query = f"consumer_id=eq.{user_id}"
        else:
            raise HTTPException(status_code=400, detail="Invalid role")
        
        res = await client.get(
            f"{supabase_url}/rest/v1/orders?{query}&select=*,products(*),users!orders_consumer_id_fkey(name,phone)&order=created_at.desc",
            headers=get_supabase_headers()
        )
        return res.json() if res.status_code == 200 else []




# --- REVIEW & EARNINGS ENDPOINTS ---

@app.get("/api/reviews/order/{order_id}")
async def get_order_reviews(order_id: UUID):
    oid = str(order_id)
    reviews_list = [r for r in REVIEWS_DB if r["order_id"] == oid]
    return reviews_list

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
    completed_orders = []
    
    # 1. Check DB
    async with httpx.AsyncClient() as client:
        try:
            res = await client.get(f"{supabase_url}/rest/v1/deliveries?delivery_partner_id=eq.{pid}&status=eq.Delivered&select=*,orders(*)", headers=get_supabase_headers())
            if res.status_code == 200 and res.json():
                for d in res.json():
                    completed_orders.append({
                        "order_id": d.get("order_id"),
                        "date": d.get("updated_at") or d.get("created_at"),
                        "fee": 30.0,
                        "customer_address": d.get("orders", {}).get("delivery_address")
                    })
        except Exception:
            pass

    # 2. Check in-memory store
    if pid in EARNINGS_DB:
        for item in EARNINGS_DB[pid]:
            if not any(x.get("order_id") == item["order_id"] for x in completed_orders):
                completed_orders.append(item)

    total_earnings = len(completed_orders) * 30.0
    return {
        "total_earnings": total_earnings,
        "completed_deliveries_count": len(completed_orders),
        "todays_earnings": total_earnings,
        "completed_orders": completed_orders
    }


# --- SMART GEO-LOGISTICS & ROUTE MATCHING ENGINE ENDPOINTS ---

from geo_logistics import (
    evaluate_logistics_route, 
    RouteEvaluationRequest, 
    LogisticsSettingsUpdate, 
    LOGISTICS_SETTINGS, 
    COLLECTION_HUBS
)

@app.post("/api/logistics/evaluate-route")
async def evaluate_route_endpoint(req: RouteEvaluationRequest):
    return evaluate_logistics_route(
        farmer_location=req.farmer_location,
        consumer_location=req.consumer_location,
        quantity_kg=req.quantity_kg,
        number_of_farmers=req.number_of_farmers or 1,
        partner_available=req.partner_available if req.partner_available is not None else True
    )

@app.get("/api/logistics/settings")
def get_logistics_settings():
    return LOGISTICS_SETTINGS

@app.patch("/api/logistics/settings")
def update_logistics_settings(settings: LogisticsSettingsUpdate):
    if settings.DIRECT_DELIVERY_MAX_KM is not None:
        LOGISTICS_SETTINGS["DIRECT_DELIVERY_MAX_KM"] = settings.DIRECT_DELIVERY_MAX_KM
    if settings.DELIVERY_PARTNER_MAX_KM is not None:
        LOGISTICS_SETTINGS["DELIVERY_PARTNER_MAX_KM"] = settings.DELIVERY_PARTNER_MAX_KM
    if settings.BULK_AGGREGATION_QTY_KG is not None:
        LOGISTICS_SETTINGS["BULK_AGGREGATION_QTY_KG"] = settings.BULK_AGGREGATION_QTY_KG
    if settings.HUB_SERVICE_RADIUS_KM is not None:
        LOGISTICS_SETTINGS["HUB_SERVICE_RADIUS_KM"] = settings.HUB_SERVICE_RADIUS_KM
    return LOGISTICS_SETTINGS

@app.get("/api/logistics/hubs")
def get_collection_hubs():
    return COLLECTION_HUBS

@app.get("/api/logistics/overview")
async def get_logistics_overview():
    active_deliveries_count = 0
    pending_collections_count = 0
    in_transit_count = 0
    city_deliveries_count = 0
    aggregation_orders_count = 0

    async with httpx.AsyncClient() as client:
        try:
            res = await client.get(f"{supabase_url}/rest/v1/deliveries?select=status", headers=get_supabase_headers())
            if res.status_code == 200 and res.json():
                for d in res.json():
                    st = d.get("status", "")
                    if st in ["Pending Assignment", "Accepted", "Out for Delivery"]:
                        active_deliveries_count += 1
                    if st == "Pending Assignment":
                        pending_collections_count += 1
                    if st == "Out for Delivery":
                        in_transit_count += 1
                    if st in ["Accepted", "Out for Delivery"]:
                        city_deliveries_count += 1
        except Exception:
            pass

    for r in BULK_REQUESTS_DB.values():
        if r.get("status") in ["AWAITING_FARMER_RESPONSES", "PARTIALLY_CONFIRMED", "FULLY_CONFIRMED"]:
            aggregation_orders_count += 1

    return {
        "active_logistics": active_deliveries_count,
        "pending_collections": pending_collections_count,
        "in_transit": in_transit_count,
        "city_deliveries": city_deliveries_count,
        "aggregation_orders": aggregation_orders_count,
        "hubs": COLLECTION_HUBS,
        "settings": LOGISTICS_SETTINGS
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port)



