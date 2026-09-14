import re

with open("backend/models.py", "r", encoding="utf-8") as f:
    code = f.read()

old_address_code = """class AddressBase(BaseModel):
    consumer_id: UUID
    title: str = "Home"
    address_line: str

class AddressCreate(AddressBase):
    pass

class AddressResponse(AddressBase):
    id: UUID"""

new_address_code = """from typing import Optional

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
    id: UUID"""

code = code.replace(old_address_code, new_address_code)

with open("backend/models.py", "w", encoding="utf-8") as f:
    f.write(code)
