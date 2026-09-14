code = open('backend/main.py', 'r', encoding='utf-8').read()

models_definition = '''
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
'''

# Remove duplicates
for m in ['class OrderStatusUpdate(BaseModel):', 'class FarmerOrderStatusUpdate(BaseModel):', 'class OTPVerifyRequest(BaseModel):']:
    if m in code:
        idx = code.find(m)
        end_idx = code.find('\n\n', idx)
        code = code[:idx] + code[end_idx+2:]

# Insert models definition right after imports
import_end = code.find('app = FastAPI(')
code = code[:import_end] + models_definition + "\n\n" + code[import_end:]

open('backend/main.py', 'w', encoding='utf-8').write(code)
print("Moved all Pydantic models to top of main.py!")
