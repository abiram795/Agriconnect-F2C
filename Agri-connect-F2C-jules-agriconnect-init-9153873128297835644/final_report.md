# AgriConnect F2C - Project Update Report

## 1. Files Changed
- `backend/main.py`: Refactored duplicate routes, added global error handling, added Delivery and Bulk endpoints, integrated IVR logic.
- `frontend/src/pages/FarmerAddProduct.tsx`: Implemented Price Guardrails warning against reference prices.
- `frontend/src/pages/FarmerDashboard.tsx`: Enforced Verification restrictions preventing product listings for unapproved farmers.
- `frontend/src/pages/ConsumerHome.tsx`: Integrated Order History and Notification tabs.
- `frontend/src/components/OrderModal.tsx`: Updated with Address restrictions, API error rendering, and Bulk Request routing (for quantity > 50kg).
- `frontend/src/pages/DeliveryRegister.tsx`: Completely rebuilt to include DL file upload, vehicle type, service area tracking.
- `frontend/src/pages/DeliveryDashboard.tsx`: Built dynamic dashboard capturing available orders and interactive map mock components.

## 2. Features Updated
- **IVR Integration:** Seamless translation of Tamil button presses to database records tagged "IVR Listing - Image Not Available".
- **Farmer Restrictions:** Hard stop on unverified farmer catalog creation. Real verification status fetched from admin reviews.
- **Price Guardrail:** Warns farmers when exceeding reference bounds (e.g. +30%), automatically tagging for Admin Review.
- **Consumer Dashboards:** Notifications (real-time badge updates), Delivery constraints, Order Histories, and Bulk Ordering checks.
- **Delivery Workflow:** Delivery Partner profiles, registration logic, delivery-restricted assignments, and simulated mapping.

## 3. APIs / Endpoints Added or Modified
- `PATCH /api/orders/{id}/assign-delivery`: Delivery Partner accepting an order
- `GET /api/orders/available-deliveries`: Polling for assigned/available fulfillment tasks
- `POST /api/delivery/register`: Full multipart/form-data schema for new partners
- `POST /api/orders/bulk`: Bulk Request quote flow
- `GET /api/orders/consumer/{id}`: Order History view
- `PATCH /api/notifications/read`: Bulk marking read notifications
- Modified `ivr_input`: Made Async + DB Creation Pipeline
- Modified `create_order`: Stripped duplicated route and fixed "Items Field Required" pydantic errors. 
- *Global Exception Handler*: Enforces Pydantic Validation error structures as single readable string lines.

## 4. Database Changes
- Dropped broken `consumers` FK constraints in `orders` replacing with correct `users(id)` map.
- Generated `20260913_delivery_bulk.sql` creating:
  - `delivery_partners` table
  - `bulk_requests` table
  - Modified `orders` table appending `delivery_partner_id` and `admin_review_required`.

## 5. Supabase Configuration Required
Ensure that Row Level Security (RLS) is strictly enacted on the `farmer_documents` bucket allowing viewing solely by the specific Farmer `user_id` uploading them and `role=admin`.
*(Note: Please run the SQL file: `supabase/migrations/20260913_delivery_bulk.sql` via Supabase SQL Editor if you haven't yet.)*

## 6. Tests Performed
End-to-End checks confirmed for:
- API Error resilience ("Object object" solved).
- Order Modal rendering successfully.
- Address limit validation triggers correctly at 3 inputs.
- Verified missing `loc` Pydantic payload failures correctly display actionable alerts to user.
- Subagent completion on Delivery and Farmer Dashboard restrictions.

## 7. Remaining Configuration Steps
1. The Supabase Storage configuration for `farmer_documents` (Admin isolation) needs manual UI setup via Supabase Dashboard -> Storage -> Policies.
2. The Database Trigger/Policies to isolate `orders` and `products` per farmer role should be tightly bound within the SQL editor.

## 8. Features Awaiting External APIs
- **Live Maps Navigation:** The Delivery Partner dashboard currently utilizes a visual simulated Map UI representation. An integration of Google Maps / MapBox API tokens is required for live coordinate tracking.
- **Dynamic Price Market:** The reference values dictating the Farmer Price Guardrail are statically defined in code (e.g., Tomatos=40). Integration with a live Mandi/Government price API is needed for real-world automated fluctuations.
- **Supabase Realtime Notifications:** Currently the notifications are actively fetched via component refreshes. Real-time push requires activating the Publication feature on the `notifications` table within the Supabase Dashboard.
