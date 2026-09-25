from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict
from uuid import UUID, uuid4
from datetime import datetime

class UserBase(BaseModel):
    name: str
    phone: str
    role: str # "farmer", "consumer", "delivery_partner", "admin"

class UserCreate(UserBase):
    state: Optional[str] = None
    district: Optional[str] = None
    village: Optional[str] = None
    farm_size: Optional[str] = None
    languages: Optional[str] = None
    land_area: Optional[str] = None
    acreage: Optional[float] = None
    ownership_status: Optional[str] = None
    document_type: Optional[str] = None
    document_path: Optional[str] = None

class UserResponse(UserBase):
    id: UUID

class FarmerProfile(BaseModel):
    state: Optional[str] = None
    district: Optional[str] = None
    village: Optional[str] = None
    farm_size: Optional[str] = None
    languages: Optional[str] = None
    land_area: Optional[str] = None
    acreage: Optional[float] = None
    ownership_status: Optional[str] = None
    document_type: Optional[str] = None
    document_path: Optional[str] = None
    verification_status: str = "Pending"
    is_ivr_user: bool = False
    farmer_delivery_enabled: bool = False
    delivery_radius_km: int = 0
    admin_remarks: Optional[str] = None

class VerificationAction(BaseModel):
    action: str # "Approve", "Reject", "Request Correction"
    remarks: Optional[str] = None

class ConsumerProfile(BaseModel):
    address: Optional[str] = None

class DeliveryPartnerProfile(BaseModel):
    service_radius_km: Optional[int] = None
    vehicle_type: Optional[str] = None
    verification_status: str = "Pending"
    is_available: bool = True

class AdminProfile(BaseModel):
    department: Optional[str] = None

class PlatformSettings(BaseModel):
    setting_key: str
    setting_value: str
    description: Optional[str] = None

class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    unit: str
    quantity_available: float
    farmer_id: UUID
    delivery_preference: Optional[str] = None # 'Self Pickup', 'Farmer Delivery', 'Delivery Partner'
    verification_state: str = "Pending Review"
    image_url: Optional[str] = None
    status: str = "Available"
    completed_at: Optional[datetime] = None
    created_at: Optional[datetime] = None

class ProductCreate(ProductBase):
    pass

class ProductResponse(ProductBase):
    id: UUID

class ProductStatusUpdate(BaseModel):
    status: str

class FarmerInventoryBase(BaseModel):
    farmer_id: UUID
    product_id: UUID
    source: str = "App" # "App" or "IVR"
    quantity_added: float

class FarmerInventoryCreate(FarmerInventoryBase):
    pass

class FarmerInventoryResponse(FarmerInventoryBase):
    id: UUID

class OrderItem(BaseModel):
    product_id: UUID
    quantity: float
    price_at_time: float

class OrderBase(BaseModel):
    consumer_id: UUID
    total_amount: float
    status: str = "Order Placed"
    delivery_method: Optional[str] = None
    created_at: str = "" # Mock string date for historical checking

class OrderCreate(OrderBase):
    items: List[OrderItem]

class OrderResponse(OrderBase):
    id: UUID
    items: List[OrderItem]

class BulkOrderRequestBase(BaseModel):
    consumer_id: UUID
    reason: str
    required_quantity: float
    required_date: str
    delivery_location: str
    status: str = "Pending"
    admin_notes: Optional[str] = None

class BulkOrderRequestCreate(BulkOrderRequestBase):
    pass

class BulkOrderRequestResponse(BulkOrderRequestBase):
    id: UUID

class DeliveryBase(BaseModel):
    order_id: UUID
    status: str
    estimated_time: Optional[str] = None
    fee: float

class DeliveryCreate(DeliveryBase):
    pass

class DeliveryResponse(DeliveryBase):
    id: UUID

from typing import Optional

class AddressBase(BaseModel):
    consumer_id: UUID
    label: str = "Home"
    full_name: str
    mobile_number: str
    address_line: str
    locality: Optional[str] = None
    city: str
    district: Optional[str] = None
    state: Optional[str] = None
    pincode: str
    landmark: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    is_default: bool = False

class AddressCreate(AddressBase):
    pass

class AddressResponse(AddressBase):
    id: UUID

class HubStockTransferCreate(BaseModel):
    farmer_id: UUID
    product_id: UUID
    hub_id: str
    product_name: str
    quantity_sent: float
    farmer_price: float

class HubStockReceiptAction(BaseModel):
    action: str # "CONFIRM" or "REJECT"
    rejection_reason: Optional[str] = None

class HubIncomingReceiptCreate(BaseModel):
    farmer_id: str
    product_name: str
    quantity: float
    unit: Optional[str] = "kg"
    hub_id: str
    farmer_price: float
    operating_cost_component: Optional[float] = 8.00
    source_reference: Optional[str] = None
    worker_id: Optional[str] = None

class HubSaleReceiptCreate(BaseModel):
    hub_inventory_id: str
    quantity: float
    unit_price: float
    consumer_reference: Optional[str] = None
    payment_status: Optional[str] = "PAID"
    worker_id: Optional[str] = None

class FPOLotCreate(BaseModel):
    farmer_id: Optional[UUID] = None
    fpo_name: Optional[str] = None
    crop_name: str
    variety: str = "Standard"
    grade: str = "Grade A"  # "Grade A (Export)", "Grade B (Standard)", "Grade C (Processing)"
    quantity_quintals: float
    moisture_percentage: Optional[float] = 12.0
    certification: Optional[str] = "Organic Certified"  # "Organic Certified", "Pesticide Free", "Standard GAP"
    packaging_type: str = "Jute Bags"  # "Jute Bags", "Plastic Crates", "Bulk Mesh"
    reserve_price_per_quintal: float
    expected_harvest_date: str
    location_district: str
    location_state: str
    storage_type: str = "Farm Gate"  # "Farm Gate", "Cold Storage Hub", "Mandi Warehouse"
    images: List[str] = []

class FPOLotResponse(FPOLotCreate):
    id: UUID
    status: str = "Open for Bidding"
    created_at: str

class BuyerBidCreate(BaseModel):
    lot_id: UUID
    buyer_id: UUID
    buyer_name: str
    buyer_type: str  # "Processor", "Institutional Buyer", "Wholesale Trader", "Exporter"
    bid_price_per_quintal: float
    offered_quantity_quintals: float
    payment_terms: str = "Escrow on Delivery"  # "Instant Bank Transfer", "7-Day Escrow", "Pay on Inspection"
    delivery_location: str
    notes: Optional[str] = None

class BuyerBidResponse(BuyerBidCreate):
    id: UUID
    status: str = "Pending Review"  # "Pending Review", "Accepted", "Rejected", "Countered"
    created_at: str

class DisputeCreate(BaseModel):
    order_id: Optional[UUID] = None
    lot_id: Optional[UUID] = None
    complainant_id: UUID
    complainant_role: str  # "farmer", "consumer", "buyer", "delivery"
    issue_category: str  # "Quality Mismatch", "Weight Variance", "Transit Damage", "Payment Delay", "Other"
    description: str
    evidence_urls: List[str] = []

class DisputeResponse(DisputeCreate):
    id: UUID
    status: str = "Open"  # "Open", "Under Review", "Resolved", "Rejected"
    resolution_notes: Optional[str] = None
    created_at: str


