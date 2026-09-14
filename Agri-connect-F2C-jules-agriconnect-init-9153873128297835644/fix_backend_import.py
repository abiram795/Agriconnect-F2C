code = open('backend/main.py', 'r', encoding='utf-8').read()

# Fix 1: Ensure FarmerOrderStatusUpdate is defined before any function references it
if "class FarmerOrderStatusUpdate(BaseModel):" in code:
    code = code.replace("class FarmerOrderStatusUpdate(BaseModel):", "# Class defined above")

# Replace OrderStatusUpdate definition with both
old_def = "class OrderStatusUpdate(BaseModel):\n    status: str"
new_def = "class OrderStatusUpdate(BaseModel):\n    status: str\n\nclass FarmerOrderStatusUpdate(BaseModel):\n    status: str"

code = code.replace(old_def, new_def)

open('backend/main.py', 'w', encoding='utf-8').write(code)
print("Fixed main.py class ordering!")
