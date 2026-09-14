# Goal Description
Update the existing AgriConnect F2C project to satisfy all 20 requirements outlined by the user, transforming it into a fully working end-to-end prototype without rebuilding from scratch or changing the existing tech stack.

## Proposed Changes

### 1. IVR Farmer Product Listing
- **Current State:** `ivr_incoming` and `ivr_input` exist in backend.
- **Plan:** Update `ivr_input` in `backend/main.py` to parse Tamil IVR inputs (1: Veg, 2: Fruit, 3: Grain, 4: Orders) and product info (name, qty). Create product in DB marked as "IVR Listing - Image Not Available" and "Pending Verification" if needed.

### 2. Smartphone Farmer Live Camera Listing
- **Current State:** `FarmerAddProduct.tsx` already uses `react-webcam` for live capture.
- **Plan:** Verify AI assistance is integrated without claiming legal certification.

### 3. Farmer Price Guardrail
- **Current State:** Basic `ai_price` exists but might be mocked.
- **Plan:** Update `FarmerAddProduct.tsx` and `backend/main.py` to check entered price against a reference range (e.g., config/DB). Show warnings for extreme deviations and flag for "Admin Review Required".

### 4. Farmer Land Document Verification
- **Current State:** `FarmerRegister.tsx` uploads document to `farmer_documents` bucket. `AdminDashboard.tsx` allows review.
- **Plan:** Ensure RLS policies on `farmer_documents` bucket are strictly private (only owner and admin). Verify the review flow in AdminDashboard works correctly.

### 5. Admin Access
- **Current State:** Admin has a separate protected route.
- **Plan:** Remove any mock data generating fake statistics. Ensure all Admin dashboard metrics are fetched from the real DB.

### 6. Consumer Address Management
- **Current State:** Done. Added in previous sessions (`POST /api/addresses`, limit 3).
- **Plan:** Verify the UI flow in `ConsumerHome.tsx` / `OrderModal.tsx`.

### 7. Consumer Product Search
- **Current State:** Partially implemented in `ConsumerHome.tsx`.
- **Plan:** Ensure `search_products` in backend correctly filters by name, category, quantity, and price.

### 8. Consumer Order Workflow
- **Current State:** Implemented real order flow replacing the `[object Object]` error.
- **Plan:** Verify edge cases. Add proper error handling for all order steps (e.g., PENDING, CONFIRMED, etc.).

### 9 & 12. Delivery / Fulfillment Options & Assignment
- **Current State:** Consumers can select Fulfillment method.
- **Plan:** Implement Delivery Partner assignment logic. If consumer selects "Delivery Partner", create a `deliveries` request. Add accept/reject logic for Delivery Partners.

### 10. Farmer Delivery Preference
- **Current State:** Done (Farmer can select multiple checkboxes in `FarmerAddProduct.tsx`).
- **Plan:** No changes needed.

### 11. Delivery Partner Registration
- **Current State:** `DeliveryRegister.tsx` exists but needs full fields (vehicle type, DL) and secure upload. `DeliveryDashboard.tsx` needs to fetch available deliveries.
- **Plan:** Update `DeliveryRegister.tsx` and `backend/main.py` for Delivery Partner onboarding. Build `DeliveryDashboard.tsx` to accept orders.

### 13. Map / Location
- **Current State:** Not implemented.
- **Plan:** Add basic map rendering (e.g., Leaflet or simple distance mock if no Maps API key) for Delivery Partner / Farmer Delivery to show delivery address.

### 14. Notifications
- **Current State:** Farmer in-app notifications implemented.
- **Plan:** Extend notifications to Consumer and Delivery Partner dashboards for status changes.

### 15. Farmer Dashboard
- **Current State:** Real data integration done.
- **Plan:** Enforce unverified farmer restriction (prevent product publishing). Show correction remarks if rejected.

### 16 & 17. Consumer Dashboard & Bulk Orders
- **Current State:** `ConsumerHome` exists.
- **Plan:** Add Order History panel. Implement "BULK REQUEST" flow for large quantities.

### 18, 19, 20. DB Consistency, API Error Handling, Testing
- **Plan:** Standardize all API error messages. Run end-to-end testing as outlined in the prompt.

## Verification Plan
Perform all 12 Tests explicitly listed by the user (Test 1 through Test 12). Ensure each workflow updates real database records and triggers real in-app notifications.
