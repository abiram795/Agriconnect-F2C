code = open('backend/main.py', 'r', encoding='utf-8').read()

old_crr = '''class ConsumerRegisterRequest(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None
    password: str
    address_line: str
    locality: Optional[str] = None
    city: str
    state: str
    pincode: str'''

new_crr = '''class ConsumerRegisterRequest(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None
    password: str
    address_line: Optional[str] = ""
    locality: Optional[str] = ""
    city: Optional[str] = ""
    state: Optional[str] = ""
    pincode: Optional[str] = ""'''

if old_crr in code:
    code = code.replace(old_crr, new_crr)
    print("Replaced ConsumerRegisterRequest!")
else:
    print("WARNING: ConsumerRegisterRequest block not matched")

open('backend/main.py', 'w', encoding='utf-8').write(code)
print("Updated main.py!")
