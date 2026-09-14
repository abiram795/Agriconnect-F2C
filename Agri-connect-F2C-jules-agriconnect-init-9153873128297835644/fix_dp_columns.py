code = open('backend/main.py', 'r', encoding='utf-8').read()

old_dp_block = '''            dp_data = {
                "user_id": user_id,
                "service_area": service_area or "",
                "service_radius_km": service_radius_km or 10,
                "vehicle_type": vehicle_type,
                "address": address or "",
                "license_path": license_path or "",
                "verification_status": "Pending",
                "is_available": True
            }'''

new_dp_block = '''            # Only insert columns that exist on delivery_partners schema (user_id, service_radius_km, vehicle_type, verification_status, is_available)
            dp_data = {
                "user_id": user_id,
                "service_radius_km": service_radius_km or 10,
                "vehicle_type": vehicle_type or "Bike",
                "verification_status": "Pending",
                "is_available": True
            }'''

if old_dp_block in code:
    code = code.replace(old_dp_block, new_dp_block)
    print("Replaced dp_data block!")
else:
    print("WARNING: dp_data block not matched exactly")

open('backend/main.py', 'w', encoding='utf-8').write(code)
print("Updated main.py!")
