code_to_append = """
class FarmerOrderStatusUpdate(BaseModel):
    status: str

@app.patch("/api/orders/{order_id}/farmer-status")
async def update_farmer_order_status(order_id: UUID, status_update: FarmerOrderStatusUpdate):
    if not supabase_url:
        if order_id in orders_db:
            orders_db[order_id].status = status_update.status
            return {"message": "Status updated successfully"}
        raise HTTPException(status_code=404, detail="Order not found")
        
    async with httpx.AsyncClient() as client:
        headers = get_supabase_headers()
        
        # 1. Update order status
        res = await client.patch(
            f"{supabase_url}/rest/v1/orders?id=eq.{order_id}",
            json={"status": status_update.status},
            headers={**headers, "Prefer": "return=representation"}
        )
        
        if res.status_code not in (200, 201) or not res.json():
            raise HTTPException(status_code=400, detail="Failed to update order status")
            
        updated_order = res.json()[0]
        consumer_id = updated_order.get("consumer_id")
        
        # 2. Notify consumer
        if consumer_id:
            message = f"Your order status is now: {status_update.status}."
            if status_update.status == "Out for Delivery":
                message = "Your farmer has started the delivery."
            elif status_update.status == "Delivered":
                message = "Your order has been delivered."
            elif status_update.status == "Preparing":
                message = "Farmer is preparing your order."
                
            await client.post(
                f"{supabase_url}/rest/v1/notifications",
                json={
                    "user_id": consumer_id,
                    "role": "consumer",
                    "order_id": str(order_id),
                    "title": "Order Status Updated",
                    "message": message
                },
                headers=headers
            )
            
        return {"message": "Status updated successfully", "order": updated_order}
"""

with open("main.py", "a") as f:
    f.write(code_to_append)
