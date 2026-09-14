import re

with open("backend/main.py", "r", encoding="utf-8") as f:
    code = f.read()

# Fix in create_address
code = code.replace(
    'headers=get_supabase_headers(prefer="return=representation")',
    'headers=get_supabase_headers()'
)

with open("backend/main.py", "w", encoding="utf-8") as f:
    f.write(code)
print("Fixed headers error in main.py")
